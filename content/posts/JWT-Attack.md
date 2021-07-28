+++
title = "JWT Attack"
description = ""
type = ["posts","post"]
tags = [
    "infosec",
    "web",
]
date = "2021-07-28"
categories = [
    "infosec",
    "web",
]
series = ["web"]
[ author ]
  name = "Quac Tran"
+++
* [Jwt là gì](#jwt-la-gi)
    * [Header](#header)
    * [Payload](#payload)
    * [Signature](#signature)
    * [Ví dụ jwt](#vi-du-jwt)
* [Phương thức tấn công](#phuong-thuc-tan-cong)
    * [Thuật toán mã hóa](#thuat-toan-ma-hoa)
    * [Brute force secret key](#brute-force-secret-key)
    * [Sửa đổi thông số KID](#sua-doi-thong-so-kid)
    * [Sửa đổi thông số JKU / X5U](#sua-doi-thong-so-jku-hoac-x5u)
    * [Các phương pháp khác](#cac-phuong-phap-khac)
## Jwt la gi
- Tên đầy đủ của JWT là Json Web Token. Nó tuân theo định dạng JSON và mã hóa thông tin người dùng vào token. Máy chủ không lưu trữ bất kỳ thông tin người dùng nào, chỉ thông tin chính và xác minh token bằng cách sử dụng một thuật toán mã hóa cụ thể và xác minh danh tính của người dùng thông qua token. Xác thực dựa trên token có thể thay thế phương pháp xác thực cookie + session truyền thống.
- JWT bao gồm ba phần: `header`.`payload`.`signature`.
### Header
- Hai trường thường được sử dụng nhất trong phần tiêu đề là `alg` và `typ`, `alg` chỉ định thuật toán được sử dụng để mã hóa token (thường được sử dụng nhất là thuật toán `HMAC` và `RSA` ) và kiểu khai báo `typ` là JWT
```json
{
    "alg" : "HS256",
    "typ" : "jwt"
}
```
### Payload
- Payload là dữ liệu người dùng và một số khai báo liên quan đến dữ liệu để khai báo quyền hạn của người dùng. Ví dụ: dữ liệu sau có thể được truyền trong quá trình đăng nhập
```json
{
    "user_role" : "1",    //người dùng đã đăng nhập
    "iss": "admin",          //admin hay user ...
    "iat": 1573423433,        //thời gian bắt đầu
    "exp": 1573932423,        //thời gian hết hạn
    "domain": "tranquac.com",   //scope
    "jti": "slkdfj343ekhdclsnd923redcdhfsd9s"   //token
}
```
### Signature
- Chức năng của Signature là để bảo vệ tính toàn vẹn của jwt.
- Phương pháp tạo là kết nối hai phần header và payload, sau đó tính toán signature thông qua thuật toán được chỉ định trong phần header.
- Tóm tắt thành một công thức là:\
`signature = HMAC-SHA256(base64urlEncode(header) + '.' + base64urlEncode(payload), secret_key)`
### Vi du jwt
- Ví dụ sử dụng python hay jwt.io đều cho ra jwt tương ứng
```python
import jwt

encoded_jwt = jwt.encode({'user_name': 'admin'}, 'secret_key', algorithm='HS256')
print(encoded_jwt)
print(jwt.decode(encoded_jwt, 'key', algorithms=['HS256']))
```
![https://raw.githubusercontent.com/tranquac/Blog_Image/master/jwt/jwt.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/jwt/jwt.PNG)
- jwt được tạo tương ứng:
`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJhZG1pbiJ9.jBrzPBuyrCIYNdAqeQZn9-696uNQoghaCQMnC33GQ9Y`
## Phuong thuc tan cong
### Thuat toan ma hoa
**Thuật toán mã hóa rỗng**
- JWT hỗ trợ việc sử dụng thuật toán mã hóa null, bạn có thể chỉ định `alg` trong tiêu đề thành `None`
- Trong trường hợp này, miễn là chữ ký được đặt thành trống (nghĩa là trường chữ ký không được thêm vào) và được gửi đến máy chủ, thì bất kỳ mã thông báo nào cũng có thể vượt qua xác minh của máy chủ. Ví dụ:
```json
{
    "alg" : "None",
    "typ" : "jwt"
}

{
    "user" : "Admin"
}
```
- Mã thông báo hoàn chỉnh được tạo là `ew0KCSJhbGciIDogIk5vbmUiLA0KCSJ0eXAiIDogImp3dCINCn0.ew0KCSJ1c2VyIiA6ICJBZG1pbiINCn0`
- Mục đích ban đầu của thuật toán mã hóa trống là được sử dụng để gỡ lỗi\

**Sửa đổi thuật toán mã hóa RSA thành HMAC**\
- Hai thuật toán được sử dụng phổ biến nhất trong JWT là HMACtổng RSA.
- https://skysec.top/2018/05/19/2018CUMTCTF-Final-Web/#Pastebin/
### Brute force secret key
- Như người ta nói, nơi nào có xác minh mật khẩu, nơi đó có brute force XD.
- Tuy nhiên, việc brute force của JWT cần phải được thực hiện trong một số cơ sở nhất định:
    + Biết thuật toán mã hóa được JWT sử dụng
    + jwt hợp lệ, đã ký
    + Khóa ký không phức tạp (khóa yếu)
- Vì vậy trên thực tế, việc brute force JWT có những hạn chế lớn.
- Công cụ liên quan: c-jwt-cracker (https://github.com/brendan-rius/c-jwt-cracker)
`./jwtcrack eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJhZG1pbiJ9.jBrzPBuyrCIYNdAqeQZn9-696uNQoghaCQMnC33GQ9Y`
### Sua doi thong so KID
- `kid` Nó là một tham số tùy chọn trong tiêu đề jwt, tên đầy đủ là key ID, nó được sử dụng để chỉ định khóa của thuật toán mã hóa
```json
{
    "alg" : "HS256",
    "typ" : "jwt",
    "kid" : "/home/jwt/.ssh/pem"
}
```
- Bởi vì thông số này có thể được nhập bởi người dùng, nó cũng có thể gây ra một số vấn đề về bảo mật.\

**Đọc tệp tùy ý**
- `kid` : Các tham số được sử dụng để đọc tệp khóa, nhưng hệ thống không biết liệu người dùng có muốn đọc tệp khóa hay không, do đó, nếu các tham số không được lọc, kẻ tấn công có thể đọc hệ thống bất kỳ tệp nào.
```json
{
    "alg" : "HS256",
    "typ" : "jwt",
    "kid" : "/etc/passwd"
}
```

**SQL injection**
- `kid` : Bạn cũng có thể trích xuất dữ liệu từ cơ sở dữ liệu. Tại thời điểm này, nó có thể gây ra các cuộc tấn công chèn SQL. Bạn có thể lấy dữ liệu bằng cách tạo câu lệnh SQL hoặc bỏ qua xác minh chữ ký.
```json
{
    "alg" : "HS256",
    "typ" : "jwt",
    "kid" : "key1234' || union select 'secretkey' -- "
}
```

**Command inject**
- `kid` : Việc lọc không đầy đủ các tham số cũng có thể gây ra các vấn đề về inject command, nhưng các điều kiện sử dụng đòi hỏi nhiều hơn. Nếu phần máy chủ sử dụng Ruby và các open chức năng được sử dụng khi đọc tệp khóa, thì việc chèn lệnh có thể được gây ra bởi các tham số.\
`"/ path / to / key_file | whoami"`
- Đối với các ngôn ngữ khác, chẳng hạn như php, nếu code sử dụng exec hoặc system đọc tệp khóa, nó cũng có thể gây ra hiện tượng chèn lệnh. Tất nhiên, khả năng này là tương đối nhỏ.
### Sua doi thong so JKU hoac X5U
- `JKU` : Tên đầy đủ của là "JSON Web Key Set URL", được sử dụng để chỉ định một tập hợp các URL được sử dụng để xác minh jwt. Tương tự `kid`,từ `JKU` người dùng cũng có thể chỉ định dữ liệu đầu vào. Nếu dữ liệu đó không được lọc chặt chẽ, bạn có thể chỉ định một tập hợp các tệp khóa tùy chỉnh và chỉ định rằng ứng dụng web sử dụng tập hợp khóa để xác minh jwt.
- `X5U` : Cho phép kẻ tấn công chỉ định chứng chỉ khóa công khai hoặc chuỗi chứng chỉ được sử dụng để xác minh jwt, tương tự như `JKU` phương pháp khai thác tấn công.
### Cac phuong phap khac
- JWT đảm bảo tính toàn vẹn hơn là tính bảo mật trong quá trình truyền dữ liệu.
- Vì payload được encode base64url nên nó tương đương với truyền bản rõ. Nếu payload mang thông tin nhạy cảm (chẳng hạn như đường dẫn tệp nơi lưu trữ cặp khóa) và phần payload được base64url decode , thì thông tin được mang trong payload có thể được đọc .

