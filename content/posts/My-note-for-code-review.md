+++
title = "My Notes on Code-Review"
description = "Learn from everywhere"
type = ["posts","post"]
tags = [
    "infosec",
]
date = "2021-07-30"
categories = [
    "infosec",
]
series = ["web"]
[ author ]
  name = "Quac Tran"
+++
* [The Fast Approach](#the-fast-approach)
    * [First](#first)
    * [Leaked Secrets and Weak Encryption](#leaked-secrets-and-weak-wncryption)
    * [New Patches and Outdated Dependencies](#new-patches-and-outdated-dependencies)
    * [Developer Comments](#developer-comments)
    * [Debug Functionalities, Configuration Files, and Endpoints](#debug-functionalities-and-configuration-files-and-endpoints)
* [The Detailed Approach](#the-detailed-approach)
    * [Important Functions](#important-functions)
    * [User Input](#user-input)
* [Reference](#reference)
## The Fast Approach
### First
- Using grep => Look for specific dangerous patterns like specific ->
    - functions
    - strings
    - keywords
    - and coding patterns that are known to be dangerous.
    - Like => eval() function
- Focus on the search for dangerous functions used on user-controlled data.
    - Potential Dangerous Functions =>
![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/codereview/function_vuln.PNG)
    - **Graudit** : grep rough audit - source code auditing tool (https://github.com/wireghoul/graudit)
    - **APKleaks** : Scanning APK file for URIs, endpoints & secrets.
    - **gitleaks** : Scan git repos (or files) for secrets using regex and entropy 🔑(https://github.com/zricethezav/gitleaks)
 (https://github.com/dwisiswant0/apkleaks)
### Leaked Secrets and Weak Encryption
- Look for leaked secrets and credentials
- Developers make mistakes of hardcoding secrets such as => **API keys, encryption keys, and database passwords into source code**
    - If Leak -> the attacker can use these credentials to access the company’s assets.
- Grep keywords like => such as =>
    - **key, secret, password, encrypt, API, login, or token**
- Also **regex** based search for hex or base64 strings
    - It depends on the key format of the credentials we are looking for
    - Example => GitHub access tokens are lowercase, 40-character hex strings
        - A search pattern like **[a-f0-9]{40}** would find them in the source code
- **Entropy scanning** -> Can help us to find secrets that don’t adhere to a specific format.
    - That means => find secrets that is in randomness formats [Thus unpredictable]
    - Example => **aaaaa** => weak entropy or low entropy
    - Example => A longer string with a larger set of characters, like **wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY** => has higher entropy.
    - **Entropy is therefore a good tool to find highly randomized and complex strings, which often indicate a secret**
    - Good Tool => **TruffleHog** => https://github.com/trufflesecurity/truffleHog/
        - searches for secrets by using both regex and entropy scanning
- **Weak Cryptography or Hashing Algorithm**
    - Hard - During Black Box Pentesting
    - Easy to spot - During Code Review
    - Look for issues such as weak encryption keys, breakable encryption algorithms, and weak hashing algorithms
    - Grep the names of weak algorithms like **ECB, MD4, and MD5**.
        - The application might have functions named after these algorithms, such as
            - **ecb(), create_md4(), or md5_hash()**
        - might also have variables with the name of the algorithm, like **ecb_key**, and so on
    - The impact of weak hashing algorithms depends on where they are used
    - If they are used to hash values that are not considered security sensitive, their usage will have less of an impact than if they are used to hash passwords.
### New Patches and Outdated Dependencies
- If have access to the **commit** or **change history** of the source code
    - Focus on the most **recent code fixes** and **security patches**
- Recent changes haven’t stood the test of time and are more likely to contain bugs.
- Look at the protection mechanisms implemented and see if you can bypass them.
- Also search for the **program’s dependencies** and check whether any of them **are outdated**
- Grep for specific code **import functions** in the language we are using with **keywords** =>
    - **import, require, and dependencies**
- Then research the versions they’re using to see if any vulnerabilities are associated with them in the CVE database
    - The OWASP Dependency-Check tool => https://owasp.org/www-project-dependency-check/
### Developer Comments
- We must also look for
    - **developer comments** and
    - **hidden debug functionalities**, and
    - **accidentally exposed configuration files**
- Developers often forgot above things
- Developer comments can point out obvious programming mistakes.
- We can find developer comments by searching for the comment characters of each programming language
    - Python => **#**
    - Java / JavaScript / C++ => **//**
- Beside comments, we also need to search for =>
    - **todo, fix, completed, config, setup**, and **removed** in source code
### Debug Functionalities and Configuration Files and Endpoints
- Hidden debug functionalities often lead to privilege escalation,
    - as they’re intended to let the developers themselves bypass protection mechanisms
- We can often find them at special endpoints
    - so search for strings like HTTP, HTTPS, FTP, and dev.
    - e.g. => http://dev.example.com/admin?debug=1&password=password # Access debug panel
- **Configuration files**
    - allows us to gain more information about the target application and might contain credentials
    - Look for **filepaths** to configuration files in source code as well
    - Configuration files often have the file extensions
        - **.conf, .env, .cnf, .cfg, .cf, .ini, .sys, or .plist**
- Additional paths, deprecated endpoints, and endpoints
    - These are endpoints that users might not encounter when using the application normally.
    - But , If found by attacker => lead to vulnerabilities such as **authentication bypass** and **sensitive   - information leak**, depending on the exposed endpoint.
    - search for strings and characters that indicate URLs like
        - **HTTP, HTTPS, slashes (/), URL parameter markers (?), file extensions (.php, .html, .js, .json), and so on.**
## The Detailed Approach
*Instead of reading the entire codebase line by line, try following strategies to maximize our efficiency*
### Important Functions
- When reading source code, focus on **important functions**,
    - such as **authentication, password reset, state-changing actions**, and **sensitive info reads**.
- Which parts of the application are important depend on the priorities of the organization.
- Also review how important components interact with other parts of the application.
- This will show us that => how an attacker’s input can affect different parts of the application.
### User Input
- Another approach is to carefully read the code that processes user input.
- User Input => the entry points for attackers to exploit the application’s vulnerabilities
    - HTTP request parameters
    - HTTP headers
    - HTTP request paths
    - Database entries
    - File Reads
    - File Uploads
- Focusing on parts of the code that deal with user input will provide a good starting point for identifying potential - dangers
- Also must review to how the user input gets stored or transferred.
- Also, see whether other parts of the application use the previously processed user input.
- We, might find that the same user input interacts differently with various components of the application.
## Reference
- Bug Bounty Bootcamp - Chapper 22 (https://www.amazon.in/Bug-Bounty-Bootcamp-Reporting-Vulnerabilities-ebook/dp/B08YK368Y3)\
**Thanks for reading!**


