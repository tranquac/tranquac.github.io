---
title: "Getting the OSCP Certification: 'Offensive Security Certified Professional' (PEN-200) review"
date: 2021-04-21T18:17:00+07:00
draft: false
categories: [
    "Certificate",
    "Review",
]
tags: [
    "OSCP",
]
---
### 28-4-2021 / 21 Year Old
- Today I'm sitting here writing down these thoughts right after receiving the email telling me I had passed Offensive Security's OSCP exam. This is just a simple post so I can share my thoughts, feelings and the journey I took to earn the OSCP certification on my first attempt. It was a whole grueling process, three months of giving it my all.
![](https://raw.githubusercontent.com/tranquac/OSCP-Journey/main/pass.png)
## What is OSCP?
- OSCP is a certification program that focuses on offensive and security-testing skills. It has 2 parts: a pentest exam within 23h45m. The exam results then have to be written up into a report in English, reviewed within 7 days before the result is officially announced.
- The OSCP certification ranks among the TOP 5 most sought-after penetration and testing certifications for security professionals, and it's one of the certifications that requires a hands-on exam. In the exam, engineers have to demonstrate the ability to research a network system and discover vulnerabilities or security weaknesses in an application system, which then helps professionals assess the level of risk as well as build methods for response and incident remediation. You could say the most important thing being assessed in the exam is a sharp mindset and the ability to execute under heavy pressure.

## Why did I sign up for OSCP?
- First, to learn and advance both my knowledge and my skills in security testing and hacking, combined with the determination and passion in me.
- Second, because of work.
  Third, a raise... well, we won't talk about that here :)))
##  The registration and preparation phase
- To take the exam you have to go through the PWK (PENETRATION TESTING WITH KALI LINUX) course, which has 3 options: 30, 60 or 90 days. By now Offensive has released a new package with a 1-year duration priced at $2147. At the time I chose the 90-day package at $1350.
- When you register you'll receive these materials: an 800-page theory book, a set of videos (similar knowledge but not as thorough as the book), a package to connect to their VPN, and this is also the most valuable thing we can use to practice and train.
- I officially started the course on the 26th of the lunar month. That was close to the Lunar New Year (Tet) holiday. Since there was quite a lot to do and I was busy with Tet back home, in the first 20 days or so I only read the book and couldn't really practice much. After the Tet break and once I'd read a decent chunk of the theory book, I started practicing. I began with the two machines alpha and beta, and I'd advise you to start from these two as well. Because these are the only two machines Offensive walks through fully so we have something to reference.
- I really do advise that before registering you should also prepare yourself mentally as well as with the right knowledge, otherwise you'll be overwhelmed and dazed by the amount of knowledge you'll be exposed to. And I think this is not a course for beginners (in my opinion).
- Maybe I'll list out some knowledge that will be necessary for you:
  - The Linux and Windows operating systems. You should be familiar with both. Especially Linux. You should be proficient with using the terminal and commands on Linux because it's what we'll mainly use for doing the labs and the exam.
  + programming skills so you can read, understand, exploit and modify depending on the case. The exploits are mostly written in python, perl... You don't need to write an exploit for a specific problem, but you'll need to understand it and customize it.
  + Common web attack vectors such as: SQLi, Command Injection, LFI, RFI, Upload File...
  + Having practiced with labs is an advantage. You can do labs on hackthebox, tryhackme, vulnhub before coming to PWK. Before taking the course I also practiced a little on these platforms but not all that much. Here's a list of the hackthebox and vulnhub boxes that are OSCP-like, by TJNULL. If you finish it all before doing the OSCP labs, you'll surely be a lot more confident than I was:
  https://docs.google.com/spreadsheets/d/1dwSMIAPIam0PuRBkCiDI88pU3yzrqqHkDtBngUHNCw8/edit#gid=1839402159
  + Finally, some tools you simply can't not know how to use: nmap, burpsuite, nc, metasploit ...
## Note-taking
- I'm setting aside a dedicated section to talk about this because it's really important. I advise you to carefully note down everything you learn and research throughout the whole process of studying and practicing. It really helps you remember longer and you'll know where to find it again when you hit a similar problem or forget something, for example.
- Not just theory, note down your entire lab process too. Write out clearly the steps you took, how you solved each error you ran into... It'll be very useful.
- I have a whole stash of those:
![](https://raw.githubusercontent.com/tranquac/OSCP-Journey/main/Capture.png)
![](https://raw.githubusercontent.com/tranquac/OSCP-Journey/main/Capture2.png)
## The exam
- By the time right before the exam I had completed a total of 53 machines out of roughly 60, the rest being mainly active directory attacks, and since those weren't on the exam I decided to do them after my exam. And now I was ready. Time to get on the chopping block!
- The OSCP exam consists of 5 machines, which include:
1 buffer overflow machine, 25 points.
1 machine, 25 points.
2 machines, 20 points.
1 machine, 10 points.
- You pass once you reach 70 points. But after that you have to write a report on what you did and send it to Offensive within the following 24h.
- I had booked the exam for 11:00 on 25/4/2021. Since the internet at my rental was unstable, I went to the office to take it. And luckily on that day I had no network issues or technical errors.
  10:45 -> 11:30 -> verification time before the exam.
  11:30 -> ~7:00 pm I had completed 4 machines. A total of 80 points.
  7:00 -> 7:30 I had a bowl of bun bo to warm my heart.
  7:30 -> 12:00 I tried to exploit the last machine but got nothing. It was too tough to chew.
  12:00 -> 3:00 time to sleep.
  3:00 -> brushing teeth, washing my face, personal hygiene.
  3:30 -> 7:00 am I kept going at the last machine but still got nothing back, even though I knew the exact CVE for the application on that machine.
  7:00 -> 7:30 double-checking and wrapping up the exam.
- I finished about 4 hours early. Because I'd spent around 10h on that machine but got nothing back. I decided to head home and write the report for my exam.

## Closing words
- That's my journey. Through 3 months of effort, in the end I was rewarded with a result I deserved. Those 3 months were truly a stretch where I pushed past my own limits: studying for OSCP, studying and taking tests at university, I worked all day (including my job at the company and studying for the exam) and in the evening went back to university for class. My schedule during those 3 months was like a loop: by day go to work, in the evening go to class, get home around 9:15, work or do OSCP labs until about 12:00-1:00 and sleep, and the next day it repeats. That was truly a memorable stretch of time for my effort!
- I hope this isn't the last post, and I won't stop there, I'll keep pushing for the plans still unfinished; there's so much left to learn ahead.
- Finally, I send my thanks to the friends and colleagues who helped me and tried alongside me throughout that time: aishee, catmandx, minhnq22, ewind!

## Update
- On 03-06-2021 I received my certificate. Truly overjoyed!
![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cert/OSCP-Cert.jpg)

## HERE ARE SOME EXTREMELY USEFUL RESOURCES I REFERENCED AND STUDIED FOR THE EXAM:
[https://github.com/swisskyrepo/PayloadsAllTheThings](https://github.com/swisskyrepo/PayloadsAllTheThings)
[https://guide.offsecnewbie.com/](https://guide.offsecnewbie.com/)
[https://sushant747.gitbooks.io/total-oscp-guide/content/](https://sushant747.gitbooks.io/total-oscp-guide/content/)
[https://cd6629.gitbook.io/ctfwriteups/oscp-cheatsheet-unfinished](https://cd6629.gitbook.io/ctfwriteups/oscp-cheatsheet-unfinished)
[https://blog.adithyanak.com/](https://blog.adithyanak.com/)
[https://github.com/tranquac/Linux-Privilege-Escalation](https://github.com/tranquac/Linux-Privilege-Escalation)
[https://github.com/tranquac/OSCP-PWK-Notes-Public](https://github.com/tranquac/OSCP-PWK-Notes-Public)
[https://burmat.gitbook.io/security/](https://burmat.gitbook.io/security/)
[https://guif.re/linuxeop#Post%20exploitation](https://guif.re/linuxeop#Post%20exploitation)
#### Thanks everyone for reading this far!
