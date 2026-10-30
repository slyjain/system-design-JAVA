Try to solve this questions like interview

There is a orders component on browser 
yesterday it took 5 milliseconds 
now it takes 5 mins -> astronomically high value 
What is the reason ? 
So in HLD interviews -> dont answer the question, ask questions to the interviewer
Always ask good questions
Engineer is good or not depends on question he asks? 
What are the  questions that you will ask to the interviewer ? (Do not blabber a lot, but convince the interviewer)
My try: 
1. Database joins 
2. 

Solutuion in class:
Given , yesterday < 1 sec 
Lets assume the Website is configured normally
User -> CDN -> frontend
|
->API Gateway -> ReverseProxy -> Backend-> DB 

can we assume that this is the strucutree of the whole website 

2. Is the problem -> persistent , transient, comes in some period, How is the error actually happening 
______|-|________
____|-------|____|-------|_______


3.  What changed since yesterday ? 
   Code change , seasonal pattern , is there any news -> has something gone down 

   Can we check the logs -> before we go into logs -> we need to know what kind of logs ?

In these cases always go from front to Back -> Network tab kholo , request maaro dekjo waha se sahi chal rha hai -> Agar request API se aa rha hai sahise 
Request number is always UUID present -> jaha bhi jaa rha hai track it and see where the logs the time with UUID 
a metric is also pushed into a Metric -> Prometheus 
Traces lets us know where was time spent ? -> total request time , this much time was taken here, this much time was taken here and so on
SPan ? what is this 
Log , metric and trace -> these things to understand 
Metabase ki maa ka bhosda 
Probing : Log when the API is coming in and where is it coming out 
---------> |-------------|                              |------------------       
                            |                           |   
                            |                           |
                            |-------------------------|
So we can now figure out where the time is beign spent 
Never rule out any reason without any proper proof 
When can One thing fail?
it can fail on multiple fronts 
What can possibly fail? 
1. Gateway -> Why can gateway fail ?
What does gateway do ? 
3 key things in gateway ? ->  
1. Auth-> Authentication 
2. Traffic policy (Rate limiting) 
3. Routing 
take each of 3 peices and figure out where is it happening 
Signup cannot be caused without going to DB 
Login can be handled in some way 
1 -> Auth can be taking long
2 -> Rate limit happened on some

Always make PRs less than 300 lines to review 

Now after scoping down we have come to point that API gateway is not a choking point 
Now Gateway is not the problem ? we can GO to Reverse proxy / Load balancer

Reverse proxy can do more work than load balancer 
How can Reverse proxy or load balancing go wrong ?  
It can go to only one server , it can go to another server 
We have gone to another server thats bad 
Maybe it has 3 servers , one request go bad 
What does Reverse proxy actually doing 
Depending on API go to a different service -> API gateway
And multiple instance of same service -> Load balancer 
RP can do as both 

What can go wrong in backend or database ? 
Req to backend => kya hota hai idhar 
Bakend creates a socket - > Accept call karta hai 
What is buffer here? 

Request are coming in a queue 
Workers are going to pick the calls 
THere can be enough number of workers
Requests can be waiting => if all the request can be waiting => SYN queue and ACK queue -> Netowrk NIC -> https://www.emqx.com/en/blog/emqx-performance-tuning-tcp-syn-queue-and-accept-queue
https://blog.risingstack.com/distributed-transaction-tracing-microservices-monitoring/
TCP connection => 3 way handshake 
Networks tab handles it
SYn connection queue => sync ack => ack queue  => web server (a process in Machine)
There can be 2 bottlenecks ? 
Queue size is also a parameterised => if sync queue is small , there can be timed out 
Request can be quickly ended 
Every HTTP request goes through this 
Thrashing by OS -> too many tthreads 

Apne code ki time complexity bhi nikalna sikho 
Garbage collection 

If no body is accesing variasblre it can be cleaned 
Find the cycle and clears them 
Stop running evryhting => clear the Cycles -> Garbage collection takes time to clear all 
THis can be a major issue 
Garbage collecyion ke baare me ache se padho 
Backend to Databse problem : 
1. long lived connections  -> jab tak requestion chal rhi hai tab tak connection nbreak mat karo 
2. connection pooling 
There are only limited number of connections that are possible 
Postgre comes with 100 connections => 3 are reserved => 97 remaining 
Many web server to same database : 
on one side many connections -> long lived connections 
Connection pooler => pipes with a databse 
Backend can ask for a pipe 
connection pooling is persistent 
Socket -> where you can  connect 
HLD -> All this things are expected 
Good part fo AI is 
HW -> see how these connections are made 
Vibe code and tweak each thing  -> like sync queue and Ack queue , connection pooliong 
Database -> 
In DB there can only 3 things that can happen 
COnnect , execute and commit 
https://www.kdnuggets.com/the-essential-guide-to-sql-execution-order 

Row locking , table locking 
RAM ki memory 

Kisine WAL pe replication slot lagaya ho, air WAL ki size limit hit hogayi ho 
WAL -> Durablity in acid 

The more you read the better you become 
Appreciating good engineering 


HW : try to vibecode whole browser to end flow 

