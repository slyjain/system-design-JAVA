# Counter lab: decisions behind the code

Implementation: `HLD/counter-app/`. Use its README for setup commands and deployment settings.

## One deployment, two responsibilities

The browser runs React. Express serves its built HTML/JavaScript files and handles `/api` requests from the same origin: the combination of scheme, host and port. Relative URLs such as `/api/counter` therefore work locally and on Render without hard-coding a backend address or adding cross-origin configuration.

During development, Vite and Express are separate processes. Vite's proxy forwards `/api` calls to Express, preserving the browser's same-origin view. Atlas credentials are read by the server; React never connects directly to MongoDB.

## Decide where state belongs

React's displayed number is a snapshot. MongoDB is the authoritative saved value. Restarting the API discards its memory but leaves the database document intact. Startup uses `$setOnInsert`, so it initializes a missing document without resetting an existing counter.

The fixed `_id: 'global'` identifies the single shared counter, and MongoDB's unique `_id` index prevents two documents with that identity. Each update uses `$inc`; see [Database internals — coordination](../Core-CS/DatabaseInternalsDocs.md#why-coordination-matters-for-a-counter) for the lost-update example.

## Concurrent operations and uncertain outcomes

One Node process does not make a read-then-write sequence safe: while a request awaits database I/O, another request can run. A mutex inside Express would only coordinate that process; it would not coordinate a second API instance. The operation that changes shared database state must be coordinated at the database.

An atomic increment solves lost updates, but not duplicate HTTP submissions. If MongoDB saves `+1` and the response is lost, the browser cannot tell whether it happened. This app reports uncertainty and refreshes instead of automatically repeating the POST. MongoDB driver's retryable writes can retry an eligible database command with its operation identity; a new browser POST is a separate application operation.

For the broader retry/idempotency problem, see [System design fundamentals — reliability](SystemDesignFundamentalsDocs.md#e-reliability--retries-idempotency).

## Polling is a deliberate trade-off

Each visible browser tab reads once every five seconds. Other people's clicks become visible on a later read; this is polling rather than a real-time push channel. With `N` continuously visible tabs, periodic reads alone average roughly `N / 5` requests per second. Hidden tabs pause polling. A visible tab continues creating traffic, which can keep a free-hosted service awake.

## Persistence has a boundary

Docker maps its `/data/db` directory to a named volume. Recreating the container can preserve the database because its data lives in that volume. Deleting the volume removes that persistence; a volume is not a backup.

Render's application filesystem is ephemeral, so the hosted app keeps persistent state in Atlas instead. Our tests verify HTTP concurrency and restart behavior; they do not establish a maximum production throughput or prove survival of every database failure.
