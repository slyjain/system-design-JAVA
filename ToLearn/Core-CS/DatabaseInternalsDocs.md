# Database internals

Study reference: *Database Internals* by Alex Petrov, Chapter 1. The chapter introduces database architecture, storage layouts, indexes and storage-engine trade-offs. These notes start with its architecture section (PDF pages 27–32).

## A database is more than a file

A program can save data using a file. A database management system (DBMS) builds additional behavior around stored data: it accepts requests, chooses how to retrieve records, coordinates operations and provides recovery mechanisms. Exact guarantees depend on the database and its configuration; a database does not make every multi-step application operation automatically safe.

Files are still useful for simple, controlled workloads. The need for a DBMS becomes clearer when multiple clients access data, queries need to search efficiently, or the system must recover after a crash.

## From request to data

For your counter app, a simplified read path is:

```text
Browser → Express → database driver → DBMS → result → Express → browser
```

Inside a DBMS, a request may pass through these responsibilities:

1. **Transport:** accepts the connection and request.
2. **Query processing:** interprets and validates the request. For SQL, this includes parsing the query.
3. **Optimizer:** considers possible ways to retrieve data and chooses a plan using estimates such as statistics. It does not always choose an index or guarantee the best possible plan.
4. **Execution:** carries out the plan and gathers results.
5. **Storage engine:** reads or updates records using storage structures and memory buffers. Transaction, concurrency and recovery mechanisms cooperate with it.

This is a mental model, not a universal implementation diagram. Some databases combine components, skip steps for simple requests, or execute work across multiple machines.

The **DBMS** is the overall database system; the **storage engine** is the part concerned with storing and retrieving its data. For example, MongoDB uses the WiredTiger storage engine by default in typical installations.

## Why coordination matters for a counter

Suppose the value is `0` and two requests both read it before either writes. Each calculates `0 + 1` and writes `1`. The final value can be `1`, even though two increments were requested: a **lost update**.

A database primitive can perform the update atomically instead of asking the application to read and then write. For example, MongoDB's `$inc` is atomic within a single document. Atomicity for concurrent updates is separate from handling duplicate requests after a network retry.
