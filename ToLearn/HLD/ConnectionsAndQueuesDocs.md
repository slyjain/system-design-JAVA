# Session 2: connections, queues and runtime bottlenecks

Read after [Request latency debugging](RequestLatencyDebuggingDocs.md). This note expands the socket, worker, garbage-collection and pooling ideas from `HLD/session2/Notes.md`. Continue with [Database performance](DatabasePerformanceDocs.md) once you have located the wait near the database.

## 1. A socket is an OS-managed communication endpoint

For a TCP server on Linux, application code asks the operating system to create a socket and returns a **file descriptor**: an integer handle, familiar from C/C++. The descriptor refers to kernel-managed state; it is not the network data itself.

```text
Server startup                       For each accepted connection

socket() -> bind(address, port)       accept(listening_fd)
                  |                         |
               listen()                     v
                  |                  new connected_fd
                  v                         |
             listening_fd              read / write
                  |                         |
       remains available for             close()
       other incoming connections
```

The listening socket is like a reception desk. `accept()` returns a separate socket for a conversation, leaving the reception desk open. A blocking `accept()` waits when no completed connection is available; a nonblocking server uses readiness notifications and can handle many sockets without one waiting thread per socket.

A TCP connection is distinguished by its local and remote IP addresses and ports. Thousands of clients can connect to the same server port because the other parts of that tuple differ. Express/Node hides most of these system calls behind `server.listen()` and its networking runtime.

## 2. The TCP handshake and two Linux queues

For an ordinary new TCP connection, ignoring optimizations such as TCP Fast Open:

```text
Client                          Server kernel
   |                                  |
   | -------- SYN ------------------> | track incomplete handshake
   | <------- SYN + ACK ------------- | (SYN queue)
   | -------- ACK ------------------> | handshake completes
   |                                  | (accept queue)
   |                                  v
   |                            application accept()
   |                                  |
   | <------ application bytes ------>| accepted connection
```

`SYN` synchronizes sequence numbers; `ACK` acknowledges received information. For HTTPS over TCP, TLS negotiation also occurs before ordinary HTTP application data. A reverse proxy may terminate the browser's TLS connection and open a separate upstream connection; there is not necessarily one socket all the way from browser to database.

| Queue | What is waiting? | Relevant Linux setting |
|---|---|---|
| SYN queue | Incomplete incoming TCP handshakes | `net.ipv4.tcp_max_syn_backlog`; SYN cookies change the behavior under pressure |
| Accept queue, sometimes called the ACK queue | Completed connections not yet accepted by the application | The application's `listen(backlog)`, capped by `net.core.somaxconn` |

These are associated with listening sockets in the kernel. They are not simply “queues inside the NIC,” and their entries are not parsed HTTP requests. NIC packet rings, TCP queues and application queues are separate structures.

If the application is too slow to accept connections, the accept queue can fill. Overflow behavior depends on the kernel and configuration: drops, retransmission delays, failed connections or timeouts can result. A successful client-side connection establishment does not prove an application handler has begun executing.

## 3. Not every HTTP request creates a connection

```text
One established HTTP/1.1 connection

handshake -> request A / response A -> request B / response B -> ...

One HTTP/2 connection

handshake -> stream A: request / response
         -> stream B: request / response   (can overlap)
```

HTTP/1.1 normally supports persistent connections. HTTP/2 multiplexes multiple streams over a connection. HTTP/3 uses QUIC over UDP, so the TCP queue diagram does not directly describe it. Connection reuse means requests can be slow even when no new handshake occurs.

Three similarly named mechanisms solve different problems: HTTP connection reuse avoids repeated setup; TCP keepalive probes help detect dead idle peers; our GitHub keep-alive workflow sends application HTTP requests to reduce Render's idle sleeps. See [Scheduled GitHub Actions](../Developer-Tools/GitHubActionsDocs.md) for the last one.

## 4. Buffers store bytes; queues organize waiting work

A **buffer** is memory temporarily holding data, such as received TCP bytes waiting for the application to read them. A **queue** organizes items awaiting service. Those items might be connections, callbacks, jobs or requests for a database connection. A request can encounter several of these waits.

```text
Incoming connection
  -> SYN queue -> accept queue
  -> accepted socket's receive buffer
  -> HTTP parsing / application scheduling
  -> handler -> database-pool wait -> DB operation
  -> response buffering / network transmission
```

This is a conceptual journey, not a guarantee that every server has a literal queue at each arrow. **Always name the queue, what its items represent, and who removes them.** “The queue is full” is otherwise too ambiguous to guide a fix.

Suppose work arrives at 120 requests/second but the bottleneck completes only 100/second. With no rejection or abandonment, outstanding work grows by roughly 20 requests/second. Increasing queue capacity postpones failure but does not increase service capacity; requests can simply wait longer.

For a stable system over a suitable observation window, Little's Law gives `L = lambda × W`: average work in the system equals average throughput times average time in the system. At 100 requests/second and 0.2 seconds per request, the average is 20 in flight. This is an accounting relationship, not a formula that predicts latency from worker count alone.

**Backpressure** makes producers slow down, while bounded queues, admission limits and deadlines prevent unlimited waiting. Which mechanism helps depends on the measured bottleneck and whether callers can tolerate rejection, delay or asynchronous completion.

## 5. Workers and the event loop are different models

A typical blocking thread-pool server assigns work to a worker thread. If all workers wait for database responses, newly arrived work can wait even with low CPU usage. More threads may help an I/O-bound workload up to other resource limits; they do not create unlimited capacity.

In a typical single Node.js process, JavaScript callbacks execute on one main event-loop thread. Asynchronous socket I/O lets it work on other requests while MongoDB replies are pending. Certain filesystem, crypto and DNS APIs use libuv's worker pool; arbitrary JavaScript is not automatically sent to that pool.

```text
Time ------------------------------------------------------>
JS thread: [A starts I/O][B starts I/O][other callbacks][A resumes]
Network A:             [waiting for database.........]
```

Putting `async` on a function does not move a CPU-heavy loop to another thread. An `O(n²)` loop over a large order list, synchronous file access, or a huge JSON serialization can occupy the event loop and delay unrelated requests. `worker_threads` or another process can run CPU work in parallel when justified.

Connect this with DSA: if input size grows tenfold, a genuinely quadratic part may do roughly 100 times as much work. But Big-O does not include every network, lock or queue wait. Profile the actual CPU path and measure input sizes before blaming complexity.

Too many runnable OS threads can add context-switching, cache and scheduling overhead. **Memory thrashing** more specifically refers to excessive paging when active memory does not fit in RAM. Both can make a server slow, but they are different mechanisms. Inspect CPU/run queues, event-loop delay, memory and page-fault/swap activity rather than using “thrashing” for every slowdown.

## 6. Garbage collection: graph reachability, not current usage

For tracing collectors such as those in JavaScript/V8 and many JVM collectors, begin with **roots**: references held by active execution, globals/statics and runtime structures. Follow references from those roots. An object that cannot be reached through the relevant strong references is eligible for collection; reclamation need not be immediate.

```text
Roots --> live request --> order list       reachable: retain
  |
  +-----> global cache --> old order list   also retained!

          A <------> B                     unreachable cycle:
          no path from roots               eligible for collection
```

This is graph traversal, like marking vertices reachable from starting nodes in C++. An object can be unused by our business logic but still reachable from an unbounded cache. GC cannot decide to discard it just because nobody read it recently. Conversely, an unreachable cycle can be collected even though its objects still reference each other.

A simplified collector marks reachable objects and reclaims unmarked memory; some phases move/compact objects. Modern collectors use combinations of generational, incremental, parallel and concurrent techniques. Some phases pause application execution (**stop-the-world**), but “stop everything, find cycles, delete them” is not an accurate description of every collection.

High allocation rates can increase collection work even without a leak. A retained heap growing after collections can suggest unwanted retention; correlate that with heap snapshots, GC pause durations and request latency. Frequent small collections do not by themselves prove a problem.

C++ RAII ties cleanup to object lifetime through destructors; `unique_ptr` provides deterministic ownership-based cleanup. `shared_ptr` reference counting alone cannot reclaim strong-reference cycles. Java/JavaScript tracing GC follows a different model. Also, GC is not timely resource management: release pool leases and close files explicitly (`finally` / Java try-with-resources), rather than waiting for memory collection.

## 7. Database connections are reusable resources

Creating a database connection may involve DNS, TCP, TLS, authentication and server session setup. A **connection pool** maintains reusable connections so operations can borrow and return them rather than reconnecting for every query.

```text
Requests A, B, C, D
        |
        v
 [pool checkout wait]
        |
        v
 +-------------------+      Database
 | connection 1: busy | ---------------->
 | connection 2: busy | ---------------->
 | connection 3: idle | ---------------->
 +-------------------+
        ^
        +-- return connection after operation/transaction
```

Long-lived describes the connection's reuse across operations, not a requirement to hold it throughout unrelated API work. In a transaction, use the same required connection/session through commit or rollback. Outside that scope, return a borrowed connection promptly. Pools replace broken or expired connections; “persistent pool” does not mean an immortal socket or durable application data.

Our counter creates one `MongoClient` at process startup and reuses it. The driver manages checkout/return, and `maxPoolSize: 10` caps each server pool's application connections. It is not a limit of ten HTTP users or exactly ten TCP sockets for the entire deployment: MongoDB clients can maintain per-server pools plus monitoring connections.

Distinguish **pool acquisition timeout** (waiting for a lease), **connection timeout** (opening a connection), **server-selection timeout** (finding a suitable MongoDB server), and **operation/statement timeout** (the operation's allowed time). A generic “database timeout” needs this extra context.

### Count connections across all instances

```text
API #1: pool up to 20 ----+
API #2: pool up to 20 ----+--> same database: up to 60 app connections
API #3: pool up to 20 ----+
                         + other apps, admin tools, overlapping deploys
```

For one pool per process to one server, a starting budget is `processes × pool maximum`, plus other consumers and headroom. Pools may grow on demand, so their maximum is not the current count. Include extra processes and per-server pools where the driver architecture requires them.

PostgreSQL commonly starts with `max_connections = 100` and `superuser_reserved_connections = 3`. PostgreSQL 16+ also has `reserved_connections` for specially privileged roles (default `0`). “97 available” describes only one default configuration, before subtracting other clients and possible provider/role/database limits. Inspect the actual instance:

```sql
SHOW max_connections;
SHOW superuser_reserved_connections;
SHOW reserved_connections; -- PostgreSQL 16+
```

`SHOW` reads configuration. Raising the limit also raises resource demands; it does not guarantee greater throughput. Pool wait can be a symptom of slow queries, long transactions or leaked leases, not simply a pool that is too small.

An external pooler such as PgBouncer adds another layer between PostgreSQL clients and server connections. Transaction pooling can reuse a server connection across clients between transactions, but session-dependent behavior needs care. An application pool and an external pooler are related mechanisms, not identical components.

## 8. Inspect the local layers with Linux commands

These are observation commands for your Linux machine. Local socket/kernel output does not describe Render's machines. Start the local API using `HLD/counter-app/README.md` if you want to see port `3001`.

```bash
ss -lntp 'sport = :3001'
ss -nt state established '( sport = :3001 or dport = :3001 )'
ss -nt state syn-recv 'sport = :3001'
sysctl net.core.somaxconn net.ipv4.tcp_max_syn_backlog
```

- Remember `ss` as **socket statistics**. `-l` selects listeners, `-n` prints numeric addresses/ports, `-t` selects TCP and `-p` shows owning processes when permitted. `sport`/`dport` filter the displayed socket's source/destination port; quote expressions so the shell does not interpret parentheses.
- `state established` inspects established TCP sockets; `state syn-recv` looks for incomplete server-side handshakes at that instant. An empty sample does not prove there was never a burst.
- On Linux TCP listeners, `Recv-Q` shows completed connections waiting for acceptance and `Send-Q` the backlog limit. On established sockets those columns describe byte queues instead, not pending HTTP request counts.
- `sysctl` reads kernel parameters here; **sys = system, ctl = control** is a memory hook. These two values are configuration, not current queue occupancy, and a large configured backlog does not prove that the application drains it quickly.

For the class lab, follow this order: observe a baseline, change one local bottleneck, predict which measurement should change, and compare. Socket backlog, event-loop blocking and a small database pool affect different waits; tuning them all at once makes the experiment hard to interpret.

## References

- [Linux `listen(2)`: backlog and SYN queue semantics](https://man7.org/linux/man-pages/man2/listen.2.html)
- [Linux `accept(2)`](https://man7.org/linux/man-pages/man2/accept.2.html) and [`ss(8)`](https://man7.org/linux/man-pages/man8/ss.8.html)
- [Node.js: avoid blocking the event loop and worker pool](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)
- [MDN: garbage collection and reachability](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management)
- [MongoDB Node driver: connection pools](https://www.mongodb.com/docs/drivers/node/current/connect/connection-options/connection-pools/)
- [PostgreSQL 18: connection settings](https://www.postgresql.org/docs/18/runtime-config-connection.html)
