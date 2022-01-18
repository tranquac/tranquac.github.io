+++
title = "[Java Deserialization] Thảo luận về cơ chế Serialize và Deserialize trong Java"
description = ""
type = ["posts","post"]
tags = [
    "infosec",
    "java",
]
date = "2022-01-18"
categories = [
    "infosec",
    "java",
]
series = ["java"]
[ author ]
  name = "Quac Tran"
+++

Lỗ hổng bảo mật liên quan đến Java Deserialization (Deser) là khó đối với tôi. Tôi đã mất nhiều thời gian để tìm hiểu nó. Và tôi không dừng lại. Tôi muốn tìm hiểu những thứ mới và tìm hiểu sâu hơn về nó. Bài viết đầu tiên này tôi sẽ giải thích cơ chế Serialize và Deserialize trong Java. Cũng chỉ như những gì tôi ghi chép lại cho việc mình đã học.

Tôi thật sự ngưỡng mộ một số anh chị đi trước đã có những nghiên cứu sâu về lỗ hổng này cũng như có rất nhiều CVE phức tạp liên quan tới nó: Anh Jangg, chị Quỳnh Lê.
### Serialization là gì?
Java cung cấp cơ chế serialize đối tượng: một đối tượng có thể được biểu diễn dưới dạng một chuỗi byte bao gồm dữ liệu của đối tượng, thông tin về kiểu của đối tượng và kiểu dữ liệu được lưu trữ trong đối tượng. Sau khi đối tượng được serialize được ghi vào file, nó có thể được đọc từ file và được giải mã, nghĩa là thông tin kiểu của đối tượng, dữ liệu của đối tượng và kiểu dữ liệu trong đối tượng có thể được sử dụng để tái tạo lại đối tượng đó. Toàn bộ quá trình này là độc lập với JVM, nghĩa là một đối tượng được serialize trên một nền tảng có thể được deserialize trên một nền tảng hoàn toàn khác.

Serialization: Quá trình chuyển đổi một đối tượng thành một chuỗi các byte.

Deserialization: Quá trình khôi phục một chuỗi byte thành một đối tượng.
### Serialize được tạo ra để làm gi?
- Nó có thể giải quyết vấn đề sự khác biệt giữa các nền tảng. Ví dụ: sau khi serialize một đối tượng được tạo trên Windows và chuyển nó sang Linux thông qua mạng, đối tượng có thể được giải mã trực tiếp để lấy đối tượng mà không cần lo lắng về việc biểu diễn dữ liệu trên các máy và hệ thống khác nhau.
- RMI cần thiết cho các cuộc gọi phương thức từ xa. RMI làm cho các đối tượng tồn tại trên các host khác được sử dụng giống như các đối tượng trên host hiện tại, khi gửi thông tin đến các đối tượng ở xa, cần truyền các tham số và trả về giá trị thông qua serialize đối tượng.
- Bắt buộc đối với Java Bean. Khi sử dụng Bean, thông tin trạng thái của nó thường được cấu hình trong giai đoạn thiết kế, những thông tin trạng thái này cần được lưu và khôi phục sau đó khi chương trình khởi động, được thực hiện bởi cơ chế deserialization.
- Thuận tiện để lưu thông tin đối tượng để có thể sử dụng trực tiếp khi JVM được bắt đầu vào lần sau.
### Điều kiện để serialize?
Để một đối tượng lớp được tuần tự hóa, hai điều kiện phải được đáp ứng:
- Class đó phải implements java.io.Serializable.
- Tất cả các thuộc tính của class phải được serialize. Nếu một thuộc tính không thể serialize, thì thuộc tính đó phải được đánh dấu là transient
### Làm thế nào để serialize?
Để Serialize một đối tượng, trước tiên tạo một đối tượng OutputStream, đóng gói nó trong một đối tượng ObjectOutputStream, sau đó chỉ cần gọi writeObject() để serialize đối tượng và gửi nó đến OutputStream (Objects are byte based, so use InputStream and OutputStream to inherit the hierarchy).

Để deserialize một đối tượng, cần đóng gói InputStream trong ObjectInputStream, rồi gọi readObject()

**ObjectInputStream / ObjectOutputStream**

Các class ObjectInputStream và ObjectOutputStream là high-level data streams có chứa các phương thức (method) deserialize và serialize các đối tượng.

Lớp ObjectOutputStream chứa nhiều phương thức để ghi các kiểu dữ liệu khác nhau, được sử dụng để serialize một đối tượng và gửi nó đến output stream:

```public final void writeObject(Object x) throws IOException```

Tương tự như vậy, class ObjectInputStream chứa một phương thức readObject() để deserialize một đối tượng, được sử dụng để lấy đối tượng từ input stream và deserialize đối tượng, giá trị trả về của nó là Object, vì vậy nó cần được chuyển đổi sang kiểu dữ liệu thích hợp:

```public final Object readObject() throws IOException, ClassNotFoundException```
### Demo
Class User implements Serializable, trong đó trường address đặt từ khóa **transient**:

```
import java.io.Serializable;
public class User implements Serializable {
    public String name;
    public transient String address;
    public int number;
    public void info(){
        System.out.println("Name: " + name + "\nAddress: " + address + "\nNumber: " + number);
    }
}
```
Một class khác thực hiện việc serialize:
```
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.ObjectOutputStream;

public class test {
    public static void serialize_test(){
        User user = new User();
        user.name = "tranquac";
        user.address = "VietNam";
        user.number = 2711;
        user.info();
        try {
            FileOutputStream fos = new FileOutputStream("user.ser");
            ObjectOutputStream obs = new ObjectOutputStream(fos);
            obs.writeObject(user);
            obs.close();
            fos.close();
            System.out.println("[*]User serialized to user.ser");
        } catch (IOException e){
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        serialize_test();
    }
}

```
Sau khi chạy, kiểm tra kết quả, gán thành công đối tượng User và lưu nó vào tệp đích:

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/introduce-java-deser/1.jpg)

Xem file user.ser dưới dạng Hex

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/introduce-java-deser/2.jpg)

Thêm chức năng deserialization vào test.class:
```
import java.io.*;

public class test {
    public static void serialize_test(){
        User user = new User();
        user.name = "tranquac";
        user.address = "VietNam";
        user.number = 2711;
        user.info();
        try {
            FileOutputStream fos = new FileOutputStream("user.ser");
            ObjectOutputStream obs = new ObjectOutputStream(fos);
            obs.writeObject(user);
            obs.close();
            fos.close();
            System.out.println("[*]User serialized to user.ser");
        } catch (IOException e){
            e.printStackTrace();
        }
    }

    public static void deserialize_test(){
        User user = null;
        try {
            FileInputStream fis = new FileInputStream("user.ser");
            ObjectInputStream ois = new ObjectInputStream(fis);
            user = (User)ois.readObject();
            ois.close();
            fis.close();
        } catch (IOException e){
            e.printStackTrace();
        } catch (ClassNotFoundException e){
            e.printStackTrace();
        }
        System.out.println("[*]User.ser deserialized：");
        user.info();
    }

    public static void main(String[] args) {
        //serialize_test();
        deserialize_test();
    }
}

```

Ta có khối try/catch trong phương thức readObject () cố gắng bắt ngoại lệ ClassNotFoundException. Để JVM có thể deserialize một đối tượng, nó phải là một class mà mã bytecode có thể được tìm thấy. Nếu JVM không thể tìm thấy trong quá trình deserialize đối tượng, thì một ClassNotFoundException sẽ được throw ra.

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/introduce-java-deser/3.jpg)

Có thể thấy rằng đối tượng được deserialize, ngoại trừ thuộc tính Address, các giá trị thuộc tính khác đều được deserialize thành công để có được đối tượng gần giống như trước khi Serialize. Thuộc tính Address ở đây là do từ khóa transient được thiết lập. Nguyên tắc cụ thể sẽ được giải thích bên dưới.
### serialVersionUID
serialVersionUID là số phiên bản được serialize, phù hợp với cơ chế serialize của Java. Nói một cách đơn giản, cơ chế serialize của Java xác minh tính nhất quán của phiên bản bằng cách đánh giá serialVersionUID. Khi deserialize, JVM sẽ so sánh serialVersionUID trong incoming byte stream với serialVersionUID của lớp thực thể tương ứng . Nếu chúng giống nhau, chúng được coi là nhất quán và có thể được deserialize. Nếu không, một phiên bản được serialize sẽ xuất hiện. Exception không nhất quán là InvalidCastException.

**serialVersionUID được tạo theo hai cách:**

Một là 1L mặc định, ví dụ: 

```private static final long serialVersionUID = 1L;```

Thứ hai là tạo trường băm 64 bit dựa trên tên class, tên interface, các method thành phần và thuộc tính, ví dụ:

```private static final long serialVersionUID = xxxxL;```

**Việc xác định rõ ràng serialVersionUID phục vụ hai mục đích:**

- In some cases, different versions of a class are expected to be compatible with serialization, so it is necessary to ensure that different versions of a class have the same serialVersionUID;
- In some cases, you do not want different versions of a class to be serializable, so you need to ensure that different versions of a class have different serialVersionUIDs.\
(Này do mình thấy để tiếng anh đọc dễ hiểu hơn)
### kiểm soát việc serialize
Trong một số trường hợp, chúng ta có thể cần kiểm soát quá trình serialize, chẳng hạn như phần nào không cần được deserialize, v.v. Trong trường hợp này, Serializable interface có thể được thay thế bằng  Externalizable interface để thực hiện việc kiểm soát quy trình serialize.

**Externalizable**

Externalizable interface kế thừa Serializable interface và thêm hai phương thức: writeExternal () và readExternal (), sẽ tự động được gọi trong quá trình serialize và deserialize, để thực hiện một số thao tác đặc biệt nhằm đạt được kiểm soát quy trình.

**Từ khoá transient**

Khi chúng ta thực hiện serialize, có thể có một số đối tượng con đặc biệt mà ta không muốn tự động lưu và khôi phục. Ví dụ, các đối tượng con đại diện cho thông tin nhạy cảm. Mặc dù thông tin trong đối tượng là thuộc tính riêng tư, nhưng sau khi serialize, mọi người có thể lấy thông tin một cách bất hợp pháp bằng cách đọc tệp hoặc chặn gói dữ liệu.

Lúc này ta có thể sử dụng từ khoá transient để ngăn không cho thuộc tính đó được serialize giống như ví dụ ban đầu.

**Tự mình thực hiện Serializable**

Nếu bạn không muốn lắm để sử dụng các method serialize và deserialize có sẵn, bạn cũng có thể tự implements Serializable interface và thêm các phương thức writeObject() và readObject() vào class của mình, các phương thức này sẽ tự động được gọi sau khi đối tượng được serialize và deserialize. Điều đáng chú ý là chúng ta đang nói về "thêm" chứ không phải "ghi đè", nghĩa là miễn là chúng ta cung cấp hai phương thức này, chương trình sẽ sử dụng hai phương thức này thay vì cơ chế Serialize mặc định.

```private void writeObject(ObjectOutputStream stream) throws IOException```

```private void readObject(ObjectInputStream stream) throws IOException, ClassNotFoundException```

Lưu ý rằng các phương thức này được định nghĩa là private.

Khi gọi ObjectOutputStream.writeObject (), đối tượng Serializable được truyền vào sẽ được kiểm tra để xem liệu writeObject() của chính nó có được implements hay không. Nếu nó được implements, quá trình Serialize thông thường sẽ skip và writeObject() đã được implements của chính nó sẽ được gọi. Nó cũng tương tự đối với phương thức readObject()

### serialized binary format
![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/introduce-java-deser/4.jpg)
```
- AC ED: STREAM_MAGIC, nói lên giao thức serialize được sử dụng, từ đó bạn có thể xác định xem nội dung đã lưu có phải là dữ liệu serialize hay không.
- 00 05: STREAM_VERSION, phiên bản giao thức serialize.
- 0x73: TC_OBJECT, nói lên rằng đây là một đối tượng mới.
- 0x72: TC_CLASSDESC, nói lên rằng một lớp mới bắt đầu ở đây.
- 00 04: Độ dài của tên class, trong đó tên Class là User và độ dài là 4.
- 55 73 65 72: Tên class User.
- 64 D4 C4 D2 26 CA C4 8D: SerialVersionUID, ID được serialize, nếu không được chỉ định, một ID 8byte sẽ được tạo ngẫu nhiên bởi thuật toán.
- 0x02: khai báo rằng đối tượng hỗ trợ Serialize.
- 00 02: Số variables có trong lớp này.
- 0x49: Loại trường, 49 là viết tắt của "I", là Int.
- 00 06: Độ dài của tên biến, tên miền là number và độ dài là 6.
- 6E 75 6D 62 65 72: Mô tả tên biến, đây là number.
- 0x4C: Loại trường, 4C là viết tắt của String.
- 00 04: Độ dài của tên biến, tên biến là name và độ dài là 4.
- 6E 61 6D 65: Mô tả tên biến, đây là name.
- 0x74: TC_STRING, đại diện cho một string mới, sử dụng string để tham chiếu đến đối tượng.
- 00 12: Độ dài của string, trong đó string là "Ljava / lang / String;" và độ dài là 0x12.
- 4C 6A 61 76 61 2F 6C 61 6E 67 2F 53 74 72 69 6E 67 3B: Ký hiệu chữ ký đối tượng tiêu chuẩn của JVM, ở đây đề cập đến string là "Ljava / lang / String;".
- 0x78: TC_ENDBLOCKDATA, dấu của phần cuối của khối dữ liệu đối tượng.
- 0x70: TC_NULL, kết thúc “class description”
- 0x74: TC_STRING, đại diện cho một String mới, sử dụng String để tham chiếu đến đối tượng.
- 00 08: length của String tranquac và độ dài là 8.
- 74 72 61 6E 71 75 61 63: Mô tả tên biến, đây là "tranquac".
```
### Nối tiếp việc tự thực hiện serialize
Như đã đề cập trong phần triển khai Serializable trong tự mình thực hiện serialize ở trên, ta có thể thêm hai phương thức, writeObject() và readObject(), không thuộc về bất kỳ class hoặc interface nào, miễn là hai phương thức này được cung cấp trong lớp được Serialize. , nó sẽ tự động được gọi trong cơ chế Serialize.

Ưu điểm của triển khai tùy chỉnh là người lập trình có thể tinh chỉnh hơn hoặc tùy chỉnh việc Serialize mà họ muốn thực hiện, chẳng hạn như đảo ngược các giá trị biến name và address trong ví dụ sau. Sử dụng tính năng này, một số thông tin nhạy cảm có thể được xử lý đặc biệt trong quá trình Serialize.

User.class: hai phương thức writeObject() và readObject(), với từ khóa private được thêm vào:

```
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;

public class User implements Serializable {
    public String name;
    public String address;
    public int number;

    private void writeObject(ObjectOutputStream out) throws IOException {
        System.out.println("[*]Write Object.");
        out.writeObject(new StringBuffer(name));
        out.writeObject(new StringBuffer(address));
        out.writeInt(number);
    }

    private void readObject(ObjectInputStream in) throws IOException, ClassNotFoundException {
        System.out.println("[*]Read Object.");
        this.name = ((StringBuffer)in.readObject()).reverse().toString();
        this.address = ((StringBuffer)in.readObject()).reverse().toString();
        this.number = in.readInt();
    }
}

```

test.class

```
import java.io.*;

public class test {
    public static void serialize_test(){
        User user = new User();
        user.name = "tranquac";
        user.address = "vietnam";
        user.number = 2711;
        try {
            FileOutputStream fos = new FileOutputStream("user.ser");
            ObjectOutputStream obs = new ObjectOutputStream(fos);
            obs.writeObject(user);
            obs.close();
            fos.close();
            System.out.println("[*]User serialized to user.ser");
        } catch (IOException e){
            e.printStackTrace();
        }
    }

    public static void unserialize_test(){
        User user = null;
        try {
            FileInputStream fis = new FileInputStream("user.ser");
            ObjectInputStream ois = new ObjectInputStream(fis);
            user = (User)ois.readObject();
            ois.close();
            fis.close();
        } catch (IOException e){
            e.printStackTrace();
        } catch (ClassNotFoundException e){
            e.printStackTrace();
        }
        System.out.println("Name: " + user.name + "\nAddress: " + user.address + "\nNumber: " + user.number);
    }

    public static void main(String[] args) {
        serialize_test();
        unserialize_test();
    }
}

```

Chạy và xem, thực sự là thông qua hai phương thức writeObject() và readObject() do chính tôi viết để nhận được các hoạt động serialize và deserialize mà tôi mong muốn:

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/introduce-java-deser/5.jpg)

Name và Address được đảo ngược là do đã thực hiện deserialize với readObject() mà tôi thêm trong class User.

**What’s more?**

Lỗ hổng Java deserialization thường nằm trong code logic của phương thức readObject() được implement tùy chỉnh, có thể kích hoạt lỗ hổng deserialization. Trên thực tế, điều này tương tự như nguyên tắc của lỗ hổng deserialize trong PHP. PHP là một magic method, nếu có code bị lỗi, có thể có nguy cơ dẫn tới lỗ hổng deserialization, tương tự như hàm readObject () được thực hiện bởi tùy chỉnh trong Java. Ví dụ sau đây chỉ thêm Runtime.getRuntime().Execute() trong câu lệnh if từ ví dụ trước:

```
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;

public class User implements Serializable {
    public String name;
    public String address;
    public int number;

    private void writeObject(ObjectOutputStream out) throws IOException {
        System.out.println("[*]Write Object.");
        out.writeObject(new StringBuffer(name).reverse());
        out.writeObject(new StringBuffer(address).reverse());
        out.writeInt(number);
    }

    private void readObject(ObjectInputStream in) throws IOException, ClassNotFoundException {
        System.out.println("[*]Read Object.");
        this.name = ((StringBuffer)in.readObject()).reverse().toString();
        this.address = ((StringBuffer)in.readObject()).reverse().toString();
        this.number = in.readInt();
   //Lỗ hổng ở đây
        if (this.number == 2711){
            Runtime.getRuntime().exec(name);
        }
    }
}

```

test.class

```
import java.io.*;

public class test {
    public static void serialize_test(){
        User user = new User();
        //thay trường name thành "calc"(lệnh bật calculator trên windows)
        user.name = "calc.exe";
        user.address = "England";
        //thoả mãn if
        user.number = 2711;
        try {
            FileOutputStream fos = new FileOutputStream("user.ser");
            ObjectOutputStream obs = new ObjectOutputStream(fos);
            obs.writeObject(user);
            obs.close();
            fos.close();
            System.out.println("[*]User serialized to user.ser");
        } catch (IOException e){
            e.printStackTrace();
        }
    }

    public static void unserialize_test(){
        User user = null;
        try {
            FileInputStream fis = new FileInputStream("user.ser");
            ObjectInputStream ois = new ObjectInputStream(fis);
            user = (User)ois.readObject();
            ois.close();
            fis.close();
        } catch (IOException e){
            e.printStackTrace();
        } catch (ClassNotFoundException e){
            e.printStackTrace();
        }
        System.out.println("Name: " + user.name + "\nAddress: " + user.address + "\nNumber: " + user.number);
    }

    public static void main(String[] args) {
        serialize_test();
        unserialize_test();
    }
}

```

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/introduce-java-deser/6.jpg)

Thử hình dung nếu kẻ tấn công biết được logic trong source code và tuỳ chỉnh được đầu vào của readObject() method. Như ở đây là file User.ser. Thì kẻ tấn công hoàn toàn có thể thao túng và tạo nên một input độc hại để khai thác ứng dụng.
Cảm ơn các bạn đã đọc tới đây.









