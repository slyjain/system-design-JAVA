# Session 2: database latency, locks and WAL

Read after [Request latency debugging](RequestLatencyDebuggingDocs.md) and [Connections and queues](ConnectionsAndQueuesDocs.md). This note expands the database portion of `HLD/session2/Notes.md`. The SQL examples use PostgreSQL; our counter app uses MongoDB. Shared ideas transfer, but their commands and implementation details differ.

## 1. Locate the wait before changing the query

The DBMS/storage-engine distinction is covered in [Database internals](../Core-CS/DatabaseInternalsDocs.md). Here the question is operational: **which part of a database interaction became slow?**

```text
Application
  |
  +-> acquire connection from pool             may wait here
  +-> establish/authenticate connection        only if needed
  +-> send statement over the network
  |
  v
Database
  parse / analyze / rewrite / plan
  -> execute: scans, joins, filters, sorts
       + waits: locks, I/O, CPU scheduling
  -> transaction completion / commit work
  |
  v
Transfer results -> driver decoding -> application / browser
```

This is a conceptual map, not a rigid sequence for every operation. Prepared statements can reuse work; a transaction may contain many statements; rows can stream before the full operation finishes. Query execution, lock acquisition and I/O can interleave. An autocommit statement has a transaction boundary even without an explicit client `COMMIT`.

“Connect, execute, commit” is a useful high-level grouping, not the only three things a database does. A slow pool checkout is not necessarily a slow new connection, and a slow result transfer is not necessarily a slow query plan.

Before investigating joins, establish whether database-side execution time actually increased. Compare application-side timings, database activity, query plans and relevant waits for the same workload.

## 2. SQL describes a result; the optimizer chooses the work

For a simple grouped `SELECT`, a useful **logical** model is:

```text
FROM / JOIN -> WHERE -> GROUP BY -> HAVING
            -> SELECT -> DISTINCT -> ORDER BY -> LIMIT
```

This helps explain semantics: `WHERE` filters input rows; `HAVING` filters groups. It is not an instruction that the engine must materialize every intermediate table in that order. Window functions and other SQL constructs add further stages.

The **physical plan** may push filters towards scans, reorder eligible joins, choose an index, or avoid sorting because an index already provides order. Rewrites must preserve the query's meaning; for example, outer joins constrain which transformations are valid.

### Connect joins to your C++ knowledge

| Physical operation | Familiar algorithm idea | What changes its cost? |
|---|---|---|
| Sequential scan | Iterate through a collection | Rows/pages scanned, caching and filter cost |
| Index lookup/range scan | Navigate an ordered search structure | Selectivity, tree/page visits and fetching matching rows |
| Nested-loop join | For each outer row, find inner matches | Outer row count and inner lookup cost; an index may make each lookup cheap |
| Hash join | Build a hash table, then probe with another input | Input sizes, skew and enough memory for the hash structure |
| Merge join | Advance through two sorted inputs | Existing order, sorting cost and duplicate/output row counts |

“A join is slow” is not a sufficient explanation. A nested loop over a few indexed matches may be excellent. A huge join result can be expensive regardless of the algorithm. Even a sequential scan can be cheaper than many scattered index-driven reads when most rows are needed.

Possible regressions without changing the SQL include data growth, changed parameter distribution, stale statistics, cache changes, missing indexes, concurrent traffic and a different chosen plan. Statistics help the optimizer estimate selectivity: how many rows a condition will match.

## 3. Read a plan instead of guessing

Assume a PostgreSQL `orders` table with `id`, `customer_id` and `created_at`. This example is separate from the MongoDB counter schema:

```sql
EXPLAIN
SELECT id, created_at
FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC
LIMIT 50;
```

`EXPLAIN` shows the estimated plan without executing the statement. `cost` values are planner units, **not milliseconds**. Estimated `rows` describe output rows for a plan node, not necessarily all rows it examines.

To measure this example on a representative test database:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, created_at
FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC
LIMIT 50;
```

`ANALYZE` here **executes** the statement and reports actual timing/row counts; with a modifying statement it would modify data. `BUFFERS` adds page-access information. Look for:

- Large gaps between estimated and actual rows: the optimizer may have chosen a plan using inaccurate cardinality assumptions.
- A repeated inner operation with many `loops`: reported actual times/rows are per-loop averages, so repetition matters. Parent-node timings include children; do not add the whole tree as independent work.
- Large “Rows Removed by Filter” counts: much work may be discarded, but this alone does not prove an index would be cheaper.
- Sorts or hashes spilling to disk, and unexpectedly large page reads. A shared-buffer miss may still be served by the OS cache; it is not proof of a physical disk read.

A candidate index for this access pattern is `(customer_id, created_at DESC)`, but validate it against the plan and the wider workload. Indexes occupy space and add maintenance to writes. Our aim is a better measured trade-off, not “index every column.”

`EXPLAIN ANALYZE` also adds measurement overhead and does not send the normal query result set to the client. A fast reported execution does not establish fast result transfer or UI rendering. Tiny test data and warm caches may not reproduce the original incident.

## 4. Many small queries can be one large delay

An **N+1 query pattern** fetches N orders with one query and then makes another query for each order's related data. If those calls execute sequentially, 1,001 calls each taking 5 ms already total about five seconds before other work.

Inspect the query count per request, not just the slowest single query. Batching, appropriate joins or carefully chosen parallelism can help. Unlimited parallel queries can instead exhaust the connection pool or overload the database; use the pool-budget reasoning from the previous note.

Unbounded results also cost time after the query: transmission, object allocation, JSON encoding/decoding and rendering. Pagination and selecting only needed columns can reduce work along that entire path.

## 5. Locks: a query can be waiting rather than computing

A transaction is a unit of work with a commit or rollback boundary. Locks coordinate conflicting operations so concurrency does not violate the database's guarantees. A fast statement inside a long transaction may hold locks long after that statement itself completes.

```text
Time ------------------------------------------------------>

Transaction A: BEGIN -> update order 42 -> other work -> COMMIT
                         [row lock held................]

Transaction B:                 update order 42
                               [wait.................] -> proceeds
```

For ordinary row updates, the conflicting row lock is generally held until transaction end. An external HTTP call inside that transaction can therefore make unrelated callers wait on the database. Shortening the transaction's scope may help more than adding a server.

PostgreSQL uses **MVCC (multiversion concurrency control)**: readers can see row versions appropriate to their snapshot. Ordinary reads generally do not wait for row-level write locks in the way competing writes do. `SELECT ... FOR UPDATE` explicitly requests row locks, and table-level DDL locks can block ordinary reads. “Any row lock blocks every reader” is incorrect.

Row and table locks are not a simple “small is good, large is bad” choice: operations require different lock modes. A **deadlock** is a cycle of waits; PostgreSQL detects it and aborts a participating transaction. Ordinary lock waiting is not automatically a deadlock.

### Inspect active waits

Run on a PostgreSQL instance where your role can inspect the relevant activity; visibility of other sessions depends on privileges:

```sql
SELECT pid,
       now() - query_start AS elapsed,
       wait_event_type,
       wait_event,
       pg_blocking_pids(pid) AS blockers
FROM pg_stat_activity
WHERE state = 'active'
  AND pid <> pg_backend_pid()
ORDER BY query_start
LIMIT 20;
```

`pid` identifies a backend process. `pg_blocking_pids` returns lock-blocking process IDs. `wait_event_type`/`wait_event` help distinguish lock, I/O and other waits; a null wait event is not by itself proof of high CPU usage. Correlate samples with system metrics.

The query lists active requests. Their blockers can be **idle in transaction**: no statement is running, but the transaction is still open. Investigate those blocker PIDs and their transaction age rather than assuming an idle connection holds no locks. An ordinary idle connection outside a transaction is a different state.

## 6. Memory affects scans, joins and sorts differently

Database memory has several jobs: cached table/index pages, execution workspace for sorts/hashes, and connection/process overhead. The OS also caches file data. Available RAM is therefore not one giant per-query buffer.

In PostgreSQL, `work_mem` is a base budget for individual execution operations such as sorts, with additional rules for hashes. It is not one global cap or necessarily one allocation per query. Multiple operations, concurrent queries and parallel workers can multiply memory consumption.

```text
More concurrent expensive queries
            |
            v
More execution memory / competition for cached pages
            |
            +--> sort/hash spills --> temporary disk I/O
            +--> system pressure --> paging or memory failures
```

Inspect actual spill reports, temporary-file activity, memory pressure and I/O latency. Increasing `work_mem` may help a measured spill but hurt the whole instance when many queries run together. Moving work into RAM does not eliminate CPU cost, locks or network delays.

## 7. WAL explains an important part of durability

**WAL = write-ahead log.** Updating a database changes in-memory pages and generates recovery records. The write-ahead rule requires the WAL describing a page change to reach durable storage **before that changed data page is written to durable storage**.

For an ordinary logged write transaction with synchronous local durability enabled:

```text
Modify pages in memory + generate WAL records
                     |
                     v
Flush WAL through the transaction's commit record
                     |
          +----------+---------------------+
          v                                v
Acknowledge commit                 write dirty data pages
                                   over time / checkpoints

Crash recovery: durable data pages + relevant WAL -> redo changes
```

This avoids flushing every modified table/index page at each commit. WAL is written largely sequentially, and a flush can serve multiple committing transactions (**group commit**). WAL can already be flushed during a transaction, and some dirty pages may be written before commit; the key is the write-ahead ordering, not “all data writes happen after commit.”

Commit latency can include waiting for local WAL flush and, with configured synchronous replication, a remote acknowledgement. An otherwise fast update can therefore have a slow commit. Asynchronous commit settings trade some recent acknowledged-write durability for latency; WAL's existence alone is not a guarantee under every configuration or hardware failure.

WAL is a mechanism supporting durability and recovery, not the definition of all ACID properties. It is also not a backup by itself: point-in-time recovery requires a suitable base backup and the necessary WAL history.

## 8. Replication slots can retain old WAL

A **replication slot** records progress/retention requirements for a consumer, such as a replica or logical change-data-capture reader. If that consumer stops advancing, the primary may need to retain WAL it would otherwise recycle.

```text
WAL positions: older ---------------------------------> newer
               100     200     300     400     500
                        ^                       ^
                 slot still needs here     primary now here
                        |<-- retained range --->|

Consumer stalled + primary keeps writing -> retention can grow
```

These positions are illustrative. PostgreSQL calls a WAL position an **LSN (log sequence number)**. A slot's `restart_lsn` marks the oldest WAL it may still need; for logical slots this is not necessarily the last change acknowledged by the consumer.

The possible incident is a chain: consumer falls behind, retention grows, disk space shrinks, and database work eventually fails or the instance becomes unavailable. Slot existence alone does not make every query slow. Find evidence of lag, retained WAL, disk pressure and database errors.

On the PostgreSQL primary:

```sql
SELECT slot_name, active, restart_lsn, wal_status,
       pg_size_pretty(
         pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)
       ) AS distance_from_restart
FROM pg_replication_slots;
```

`pg_wal_lsn_diff` gives the byte distance between log positions, not exact per-slot disk usage. Slots can need overlapping WAL ranges; do not sum those distances as independent storage consumption. No rows means no slots on that server; an `active` consumer can still be lagging.

In PostgreSQL 18, `max_slot_wal_keep_size = -1` allows slots to retain WAL without that configured size limit. A finite limit is enforced in relation to checkpoints: required WAL may be removed and the consumer can lose the ability to resume. It is not a guarantee that the whole WAL directory stays below that size. `max_wal_size` is also a soft checkpoint-related limit, not a hard disk-space cap.

Investigate why the consumer stopped, monitor retention and free space, and choose a recovery strategy consistent with whether it can be rebuilt. Deleting required WAL or dropping a needed slot is not a generic query-performance fix.

## 9. Bring the diagnosis back to the request

| Evidence | Next hypothesis to test |
|---|---|
| Pool checkout slow, SQL fast once submitted | All leases occupied, long transactions, leaked leases or over-admitted load |
| Many repeated small queries in one trace | N+1 access pattern or unnecessary sequential round trips |
| Estimate/actual row counts diverge greatly | Statistics, parameter skew or a changed plan |
| Active statement waits on a lock | Identify the blocking transaction and why it remains open |
| Sort/hash spills and I/O rise together | Execution workspace, query shape and concurrent memory demand |
| Commit dominates rather than execution | WAL flush latency or configured synchronous-replica wait |
| Database completes quickly, page still slow | Result size, transfer, serialization or browser work |

For our MongoDB counter, connect these ideas to its shared document, driver pool and atomic update. Its atomicity/persistence choices are already explained in [Counter architecture](CounterArchitectureDocs.md); PostgreSQL `SHOW`, `pg_stat_activity` and replication-slot queries do not run against Atlas MongoDB.

The session's central skill is turning “the database is slow” into a statement such as: **“This request spent most of its time waiting for a pool lease because other transactions held the connections while blocked on one row.”** Each part of that explanation should be supported by a measurement.

## References

- [PostgreSQL 18: reading EXPLAIN plans](https://www.postgresql.org/docs/18/using-explain.html)
- [PostgreSQL 18: explicit locking and deadlocks](https://www.postgresql.org/docs/18/explicit-locking.html)
- [PostgreSQL 18: activity and wait-event monitoring](https://www.postgresql.org/docs/18/monitoring-stats.html)
- [PostgreSQL 18: resource and memory settings](https://www.postgresql.org/docs/18/runtime-config-resource.html)
- [PostgreSQL 18: write-ahead logging](https://www.postgresql.org/docs/18/wal-intro.html)
- [PostgreSQL 18: replication settings](https://www.postgresql.org/docs/18/runtime-config-replication.html) and [slot monitoring](https://www.postgresql.org/docs/18/view-pg-replication-slots.html)
