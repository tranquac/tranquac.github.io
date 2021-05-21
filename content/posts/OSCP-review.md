+++
title = "Getting the OSCP Certification: 'Offensive Security Certified Professional' (PEN-200) review"
description = ""
type = ["posts","post"]
tags = [
    "oscp",
    "infosec",
]
date = "2021-04-21"
categories = [
    "oscp",
    "infosec",
]
series = ["OSCP"]
[ author ]
  name = "Quac Tran"
+++

### 28-4-2021 / 21 Year Old
- Hôm nay tôi ngồi đây để viết những dòng suy nghĩ này khi tôi vừa nhận được email thông báo tôi đã vượt qua kì thi OSCP của offensive security.Đây chỉ là một bài viết đơn giản để tôi có thể chia sẻ những suy nghĩ,cảm nhận và hành trình tôi đạt đượt chứng chỉ OSCP trong lần thi đầu tiền . Đó là cả một quá trình gian nan, cố gắng hết mình của tôi trong 3 tháng.
![](https://raw.githubusercontent.com/tranquac/OSCP-Journey/main/pass.png)
## OSCP là gì?
- OSCP là một chương trình chứng chỉ mà tập trung vào những kỹ năng tấn công và kiểm thử bảo mật. Nó bao gồm 2 phần: một bài thi pentest trong vòng 23h45p. Kết quả thi sau đó phải được viết thành báo cáo bằng Tiếng Anh, thẩm định trong 7 ngày trước khi chính thức công bố kết quả.
- Chứng chỉ OSCP nằm trong TOP 5 chứng chỉ thâm nhập và kiểm thử đáng mơ ước cho các chuyên gia bảo mật và là một trong những chứng chỉ đòi hỏiphần thi thực hành. Tại kỳ thi, các kỹ sư phải thể hiện khả năng nghiên cứu hệ thống mạng, phát hiện các lỗ hổng hay điểm yếu về bảo mật trong hệ thống ứng dụng từ đó giúp các chuyên gia đánh giá được mức độ rủi ro cũng như xây dựng các phương pháp ứng phó và khắc phục sự cố.Có thể nói, đánh giá quan trọng nhất trong kỳ thi chính là tư duy nhạy bén và kỹ năng thực thi dưới áp lực lớn.

## Tại sao tôi lại đăng kí OSCP?
- Đầu tiên là để học hỏi nâng cao kiến thức lẫn kĩ năng về kiểm thử bảo mật, hacking cộng với đó là lòng quyết tâm, niềm đam mê trong tôi. 
- Thứ 2 là vì công việc.                                                                                                                                                          - Thứ 3 là tăng lương thì chúng ta không nói đến ở đây nhé :)))                                                                               
##  Giai đoạn đăng kí học và chuẩn bị
- Để thi bạn phải trải qua khóa học PWK (PENETRATION TESTING WITH KALI LINUX), nó có 3 sự lựa chọn: 30,60 hoặc 90 ngày. Đến thời điểm hiện tại offensive đã tung ra gói mới có thời gian 1 năm với giá 2147$. Lúc đó tôi đã lựa chọn gói 90 ngày với giá 1350$.
- Khi đăng kí bạn sẽ nhận được những tài liệu: một sách lý thuyết 800 trang, một bộ video (kiến thức cũng tương tự nhưng không kĩ bằng sách), một gói kết nối tới VPN của họ và đây cũng chính là thứ giá trị nhất mà chúng ta có thể thực hành và rèn luyện.
- Tôi bắt đầu đăng kí học chính thức là vào 26 tết. Khi đó gần với kì nghỉ Tết Nguyên Đán. Do ở quê Tết đến cũng khá nhiều việc, bận rộn nên trong khoảng thời gian 20 ngày đầu tôi chỉ đọc sách mà cũng không thực hành được gì mấy. Qua đợt nghỉ Tết và đọc hòm hòm sách lý thuyết tôi bắt đầu thực hành. Tôi bắt đầu với 2 máy alpha và beta và tôi khuyên các bạn cũng nên bắt đầu từ 2 máy này. Vì đây là 2 máy duy nhất offensive hướng dẫn đầy đủ để chúng ta có thể tham khảo. 
- Tôi khuyên thật sự trước khi đăng kí bạn cũng nên chuẩn bị tinh thần cũng như kiến thức phù hơp, nếu không bạn sẽ bị ngợp, choáng với lượng kiến thức mà bạn sẽ được tiếp xúc. Và tôi nghĩ đây không phải là khóa học dành cho người mới bắt đầu (theo quan điểm của tôi).
- Có thể tôi sẽ liệt kê một số kiến thức sẽ là cần thiết cho bạn:
  - Hệ điều hành Linux và Windows. Bạn nên quen thuộc với cả 2 loại. Đặc biết là linux. Bạn nên thành thạo với việc sử dụng terminal, command trên linux vì nó là cái chúng ta sẽ   sử dụng chính cho việc làm lab và kì thi.
  + các kỹ năng lập trình để có thể đọc hiểu khai thác và modify tùy vào trường hợp. Các khai thác chủ yếu được viết bằng python,perl...Bạn không cần viết một khai thác cho một   bài toán cụ thể nhưng bạn sẽ cần hiểu nó và tùy chỉnh nó.
  + Các web attack vector phổ biến như: SQLi, Command Injection, LFI, RFI, Upload File...
  + Đã từng thực hành với labs là một lợi thế. Bạn có thể làm các labs trên hackthebox, tryhackme, vulnhub trước khi đến với PWK. Trước khi đến với khóa học tôi cũng thực hành     được một ít trên các nền tảng này nhưng không được nhiều lắm. Ở đây có một list các bài trên hackthebox và vulnhub like OSCP của TJNULL. Nếu hoàn thành nó hết trước khi làm     lab OSCP. Bạn chắc chắn sẽ tự tin hơn tôi nhiều:                                                                                               
  https://docs.google.com/spreadsheets/d/1dwSMIAPIam0PuRBkCiDI88pU3yzrqqHkDtBngUHNCw8/edit#gid=1839402159
  + Cuối cùng một số công cụ mà bạn không thể không biết sử dụng: nmap, burpsuite, nc, metasploit ...  
## Ghi chép
- Tôi rành riêng một mục để nói về điều này vì thực sự nó rất quan trọng. Tôi khuyên bạn nên note cẩn thận hết lại tất cả những gì bạn học được, nghiên cứu được trong suốt quá trình học tập, thực hành. Nó thực sự giúp bạn nhớ lâu hơn và bạn sẽ biết tìm lại khi gặp một bài toán tương tự hoặc quên chẳng hạn.
- Không chỉ lý thuyết bạn hãy note lại toàn bộ quá trình bạn làm lab. Hãy ghi rõ quá trình bạn làm, cách giải quyết mỗi khi gặp lỗi,...Nó sẽ rất hữu ích đó.
- Tôi có cả một kho về những điều đó:
![](https://raw.githubusercontent.com/tranquac/OSCP-Journey/main/Capture.png)
![](https://raw.githubusercontent.com/tranquac/OSCP-Journey/main/Capture2.png)
## Kì thi
- Tính đến thời điểm trước khi và kì thi tôi đã hoàn thành tổng cộng 53 machine trên tổng số khoảng 60 machine, phần còn lại chủ yếu là tấn công active directory vì không có trong kì thi nên tôi đã quyết định làm nó sau kì thi của mình. Và bây giờ thì sẵn sàng rồi. Bắt đầu lên thớt thôi!
- Kì thi OSCP gồm có 5 machine trong đó có:                                                                                                                               
1 máy buffer overflow 25 điểm.                                                                                                                                                    1 máy 25 điểm.                                                                                                                                                                    2 máy 20 điểm.                                                                                                                                                                    1 máy 10 điểm.                                                                                                                           
- Bạn làm sao làm được 70 điểm là đủ điểm pass. Nhưng sau đó bạn phải làm report về quá trình mình làm gửi cho offensive trong 24h sau đó.
- Tôi đã đặt lịch thi vào 11h ngày 25/4/2021. Do mạng phòng trọ không ổn định nên tôi đã lên công ty thi. Và may mắn trong ngày hôm đó tôi không gặp vấn đề về mạng cũng như lỗi kĩ thuật.                                                                                                                                                                  
  10h45->11h30 -> thời gian xác thực trước khi thi.                                                                                                                      
  11h30->~7h tối tôi đã hoàn thành 4 machine. Được tổng cộng 80đ.                                                                                                         
  7h   ->7h30 tôi có một bát bún bò làm ấm lòng.                                                                                                                  
  7h30 ->12h tôi cố gắng khai thác máy cuối cùng nhưng không có kết quả gì. Nó quá khó nhai.                                                                              
  12h  ->3h thời gian để ngủ.                                                                                                                                                       3h   -> đánh răng, rửa mặt, vệ sinh cá nhân.                                                                                                             
  3h30 -> 7h sáng tôi tiếp tục cho máy cuối cùng nhưng vẫn không nhận lại được kết quả gì mặc dù tôi đã biết chính xác CVE cho ứng dụng trên máy đó.              
  7h   ->7h30 kiểm tra lại và kết thúc cho kì thì.                                                                                                          
- Tôi đã kết thúc sớm khoảng 4 tiếng. Vì tôi đã mất khoảng 10h cho máy đó nhưng không nhận lại được gì. Tôi quyết định ra về và viết report cho bài thi của mình.

## Lời kết
- Hành trình của tôi là như vậy đó. Suốt 3 tháng cố gắng, cuối cùng tôi đã được đền đáp bằng kết quả xứng đáng. 3 tháng đó quả là một quãng thời gian tôi đã vượt quá giới hạn của bản thân: ôn thi OSCP, học và kiểm tra trên trường, tôi đã đi làm cả ngày (bao gồm cả làm công việc ở công ty, ôn thi) và tối trở lại trường để học trên. Thời gian biểu của tôi trong 3 tháng đó như một vòng lặp : ngày đi làm, tối về đi học, khoảng 9h15 về đến nhà, làm việc hoặc làm labs oscp đến khoảng 12h-1h đi ngủ và hôm sau lại lặp lại. Đó quả là quãng thời gian đáng nhớ cho sự cố gắng của tôi!
- Hi vọng đây không phải bài viết cuối cùng, và tôi sẽ không dừng lại ở đó, sẽ cố gắng cho những đang dự định còn dang dở, còn rất nhiều thứ cần học hỏi ở phía trước.
- Cuối cùng tôi gửi lời cảm ơn những người bạn, đồng nghiệp đã giúp đỡ tôi, cùng tôi cố gắng trong suốt quãng thời gian đó: aishe, catmandx, minhnq22, ewind! 
                                                                                                                                           
## ĐÂY LÀ MỘT SỐ NGUỒN CỰC KÌ HỮU ÍCH TÔI ĐÃ THAM KHẢO VÀ HỌC TẬP CHO KÌ THI:
[https://github.com/swisskyrepo/PayloadsAllTheThings](https://github.com/swisskyrepo/PayloadsAllTheThings)                                                
[https://guide.offsecnewbie.com/](https://guide.offsecnewbie.com/)                                                                        
[https://sushant747.gitbooks.io/total-oscp-guide/content/](https://sushant747.gitbooks.io/total-oscp-guide/content/)                                      
[https://cd6629.gitbook.io/ctfwriteups/oscp-cheatsheet-unfinished](https://cd6629.gitbook.io/ctfwriteups/oscp-cheatsheet-unfinished)                                  
[https://blog.adithyanak.com/](https://blog.adithyanak.com/)                                                                                                                     
[https://github.com/tranquac/Linux-Privilege-Escalation](https://github.com/tranquac/Linux-Privilege-Escalation)                                             
[https://github.com/tranquac/OSCP-PWK-Notes-Public](https://github.com/tranquac/OSCP-PWK-Notes-Public)                                                                  
[https://burmat.gitbook.io/security/](https://burmat.gitbook.io/security/)                                                                                                                      
[https://guif.re/linuxeop#Post%20exploitation](https://guif.re/linuxeop#Post%20exploitation)                                                                   
#### Cảm ơn các bạn đã đọc đến đây!
