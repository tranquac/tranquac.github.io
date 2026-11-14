---
title: "JWT Attack"
date: 2021-07-28T18:17:00+07:00
draft: false
categories: [
    "Offensive Security"
]
tags: [
    "Token","JWT"
]
---
## What is JWT
- The full name of JWT is Json Web Token. It follows the JSON format and encodes user information into the token. The server doesn't store any user information, only the key information, and it verifies the token using a specific encryption algorithm and verifies the user's identity through the token. Token-based authentication can replace the traditional cookie + session authentication method.
- JWT consists of three parts: `header`.`payload`.`signature`.
### Header
- The two most commonly used fields in the header are `alg` and `typ`. `alg` specifies the algorithm used to encode the token (the most commonly used being the `HMAC` and `RSA` algorithms) and the declaration type `typ` is JWT
```json
{
    "alg" : "HS256",
    "typ" : "jwt"
}
```
### Payload
- The payload is the user data and some declarations related to the data to declare the user's permissions. For example, the following data could be passed during the login process
```json
{
    "user_role" : "1",    //logged-in user
    "iss": "admin",          //admin or user ...
    "iat": 1573423433,        //issued-at time
    "exp": 1573932423,        //expiration time
    "domain": "tranquac.com",   //scope
    "jti": "slkdfj343ekhdclsnd923redcdhfsd9s"   //token
}
```
### Signature
- The function of the Signature is to protect the integrity of the jwt.
- The creation method is to join the two parts, header and payload, together, then compute the signature using the algorithm specified in the header.
- Summarized into a formula it is:\
`signature = HMAC-SHA256(base64urlEncode(header) + '.' + base64urlEncode(payload), secret_key)`
### Sample JWT
- For example, using python or jwt.io both produce the corresponding jwt
```python
import jwt

encoded_jwt = jwt.encode({'user_name': 'admin'}, 'secret_key', algorithm='HS256')
print(encoded_jwt)
print(jwt.decode(encoded_jwt, 'key', algorithms=['HS256']))
```
![https://raw.githubusercontent.com/tranquac/Blog_Image/master/jwt/jwt.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/jwt/jwt.PNG)
- the corresponding jwt that is generated:
`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJhZG1pbiJ9.jBrzPBuyrCIYNdAqeQZn9-696uNQoghaCQMnC33GQ9Y`
## Attack methods
### Encryption algorithm
**Null encryption algorithm**
- JWT supports using the null encryption algorithm; you can set `alg` in the header to `None`
- In this case, as long as the signature is set to empty (meaning the signature field is not added) and sent to the server, any token can pass the server's verification. For example:
```json
{
    "alg" : "None",
    "typ" : "jwt"
}

{
    "user" : "Admin"
}
```
- The complete token that is generated is `ew0KCSJhbGciIDogIk5vbmUiLA0KCSJ0eXAiIDogImp3dCINCn0.ew0KCSJ1c2VyIiA6ICJBZG1pbiINCn0`
- The original purpose of the null encryption algorithm was to be used for debugging\

**Modifying the RSA encryption algorithm to HMAC**\
- The two most commonly used algorithms in JWT are HMAC and RSA.
- https://skysec.top/2018/05/19/2018CUMTCTF-Final-Web/#Pastebin/
### Brute force secret key
- As they say, where there's password verification, there's brute force XD.
- However, brute-forcing JWT needs to be done under certain conditions:
    + Knowing the encryption algorithm used by the JWT
    + a valid, signed jwt
    + The signing key isn't complex (a weak key)
- So in practice, brute-forcing JWT has major limitations.
- Related tool: c-jwt-cracker (https://github.com/brendan-rius/c-jwt-cracker)
`./jwtcrack eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJhZG1pbiJ9.jBrzPBuyrCIYNdAqeQZn9-696uNQoghaCQMnC33GQ9Y`
### Change KID
- `kid` It is an optional parameter in the jwt header, full name key ID; it's used to specify the key of the encryption algorithm
```json
{
    "alg" : "HS256",
    "typ" : "jwt",
    "kid" : "/home/jwt/.ssh/pem"
}
```
- Because this parameter can be entered by the user, it can also cause some security problems.\

**Arbitrary file read**
- `kid` : The parameter is used to read the key file, but the system doesn't know whether the user wants to read the key file, so if the parameters aren't filtered, an attacker can read any file on the system.
```json
{
    "alg" : "HS256",
    "typ" : "jwt",
    "kid" : "/etc/passwd"
}
```

**SQL injection**
- `kid` : You can also extract data from the database. At this point, it can lead to SQL injection attacks. You can obtain data by crafting a SQL statement or bypass the signature verification.
```json
{
    "alg" : "HS256",
    "typ" : "jwt",
    "kid" : "key1234' || union select 'secretkey' -- "
}
```

**Command inject**
- `kid` : Incomplete filtering of the parameters can also cause command injection problems, but the conditions for use are more demanding. If the server side uses Ruby and the open functions are used when reading the key file, then command injection can be caused through the parameters.\
`"/ path / to / key_file | whoami"`
- For other languages, such as php, if the code uses exec or system to read the key file, it can also cause command injection. Of course, this possibility is relatively small.
### Change JKU or X5U
- `JKU` : Its full name is "JSON Web Key Set URL", used to specify a set of URLs used to verify the jwt. Similar to `kid`, through `JKU` the user can also specify input data. If that data isn't strictly filtered, you can specify a custom set of key files and specify that the web application use that key set to verify the jwt.
- `X5U` : Allows an attacker to specify the public-key certificate or certificate chain used to verify the jwt, similar to the `JKU` attack exploitation method.
### Other methods
- JWT ensures integrity rather than confidentiality during data transmission.
- Because the payload is base64url encoded, it's equivalent to transmitting cleartext. If the payload carries sensitive information (such as the file path where the key pair is stored) and the payload is base64url decoded, then the information carried in the payload can be read.
