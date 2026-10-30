# Session 2: finding where a slow request spends its time

Expanded from `HLD/session2/Notes.md`. Read this first, then [Connections and queues](ConnectionsAndQueuesDocs.md), then [Database performance](DatabasePerformanceDocs.md). The [session 1 notes](SystemDesignFundamentalsDocs.md) introduce the broader system-design requirements.

## 1. Start with a measurable symptom

The orders component used to load quickly; today it takes five minutes. “Database joins” is a possible hypothesis, but it is not yet a diagnosis. The useful question is: **which part of the user's wait became longer, and what evidence distinguishes its causes?**

The rough notes mention both “5 milliseconds” and “under one second.” First establish a comparable baseline. A database query taking 5 ms and an entire page taking five minutes are measurements of different things. If the same operation really changed from 5 ms to 300,000 ms, that is a 60,000-fold increase.

Ask a few high-value questions, explain why they matter, then propose the next measurement:

| Question | How the answer narrows the investigation |
|---|---|
| What takes five minutes: initial page load, an API request, or rendering the returned orders? | Establishes the measurement boundary |
| Who is affected: everyone, one region, one account, or accounts with many orders? | Separates shared infrastructure from client/data-specific problems |
| Is it constant, intermittent, or periodic? When did it start? | Helps compare with deployments, traffic peaks and scheduled jobs |
| Does it eventually succeed? Which HTTP status, timeout or error appears? | Distinguishes slow success from retries and failed attempts |
| What changed: code, configuration, traffic, data volume, indexes or dependencies? | Identifies candidates, including changes outside our repository |
| What does the actual request path look like, and what telemetry exists? | Determines where we can measure rather than inventing components |

For distributions, **p50** is the median and **p95** is the value at or below which roughly 95% of observations fall. Compare the same route, population and time window. An acceptable average can hide a slow minority; a p95 value does not describe one particular user's request.

```text
Latency over time; each sketch is a different incident

Brief spike:       ____/\________________
Sustained change:  ____/-----------------
Periodic problem: ____/---\____/---\_____
                      time ------------>
```

These shapes suggest questions, not causes. Periodic spikes could come from a scheduled report, recurring traffic or resource cleanup; the graph alone does not identify which.

## 2. Draw the real architecture

One possible architecture for a browser-rendered application is:

```text
                      static HTML / JavaScript / CSS
Browser <-----------> CDN <-----------> static origin
   |
   | API request issued by JavaScript
   v
API gateway --> reverse proxy / load balancer
                               |
                    +----------+----------+
                    v          v          v
                 API #1     API #2     API #3
                    \          |          /
                     +------ Database ---+
```

This is an example, not a definition of a “normally configured website.” A CDN can also proxy API traffic. Server-side rendering may generate HTML in a backend. Gateway, reverse-proxy and balancing features can live in one product.

Our counter app is simpler: Render's ingress forwards traffic to Express, which serves both the built frontend files and `/api` routes. Express accesses Atlas. See [Counter architecture](CounterArchitectureDocs.md) for that deployment's state ownership.

## 3. Find the first slow boundary

For a browser-visible issue, DevTools is a useful starting point. Open **Network**, reproduce the operation and inspect the specific orders request, its initiator, timing, status and response size. Look for several attempts instead of assuming the five-minute wait was one request.

```text
Orders appear late
  |
  +-- API request starts late?
  |     -> inspect JavaScript, dependency waterfalls and main-thread work
  |
  +-- Request starts promptly but completes late?
  |     -> inspect connection timing, TTFB, transfer and server evidence
  |
  +-- Response completes promptly but UI appears late?
        -> inspect parsing, React work, layout and rendering
```

**TTFB** means time to first byte. It includes waiting for the first response byte, not just database execution. Browser “Waiting” can include network round trips, proxy/backend queuing and application work. A browser timing cannot by itself split those internal stages.

Browser queueing/stalling also does not directly measure Linux's accept queue. These are different observation points; the queue distinctions are in the next note.

“Always debug front to back” is a useful starting habit, not an absolute rule. If an incident alert already identifies database lock waits, investigate that evidence while checking user impact. One fast sample does not eliminate an intermittent failure.

### A timing command to remember

This makes one read request to our app:

```bash
curl --http1.1 --silent --show-error --output /dev/null \
  --write-out 'dns=%{time_namelookup}s connect=%{time_connect}s tls=%{time_appconnect}s first_byte=%{time_starttransfer}s total=%{time_total}s status=%{http_code}\n' \
  https://samyak-counter-lab.onrender.com/api/counter
```

- `--write-out` prints selected measurements after the request; `%{...}` names a curl measurement. The times shown are **cumulative seconds**, not separate phase durations to add together.
- `--http1.1` selects HTTP/1.1 for this TCP-oriented example. `--silent --show-error` hides the progress meter while keeping errors visible; `--output /dev/null` discards the response body.
- For a fresh, direct HTTPS connection without redirects, `time_connect - time_namelookup` approximates TCP setup, and `time_appconnect - time_connect` approximates TLS negotiation. Proxies and connection reuse change interpretation.
- Curl measures its own request, not React rendering or the browser's cached connections. Compare like-for-like requests and account for free-host cold starts.

## 4. Give logs, metrics and traces different jobs

### Logs: inspect a particular event

A useful structured log might contain a timestamp, service/instance, route, status, duration and correlation ID. Search the affected time window and route, then compare slow and fast instances. An isolated `console.log("called")` rarely explains a delay.

Instrument meaningful boundaries: handler entered, pool checkout requested, checkout completed, database call completed, response finished. **Entry and exit logs measure elapsed time, not necessarily CPU time.** Use a monotonic clock such as Node's `performance.now()` for durations inside a process; wall clocks on different machines can disagree.

Our counter's `server/app.ts` logs method, path, status and elapsed time when the response emits `finish`. That event means the response was handed to the underlying system for transmission, not that the browser received or rendered it. It also excludes waits before the Express middleware ran. The app does not currently instrument separate pool/query spans or generate application request IDs.

### Metrics: see how a population changes

Useful measurements include request rate, error rate, latency histograms, CPU, memory, active database connections and queue depth. A **counter** accumulates events; a **gauge** records a current level; a **histogram** groups observations such as durations into buckets.

Prometheus normally **scrapes** an HTTP metrics endpoint at intervals. The application's instrumentation updates measurements; it does not have to push a network message to Prometheus for every request. Push-based pipelines exist, but are not the default Prometheus model.

Use bounded labels such as route templates and status classes. Putting every request UUID into a metric label creates a new time series for each request: high **cardinality**, which consumes storage and processing. Request IDs belong in logs/traces instead. Grafana commonly visualizes operational metrics; Metabase is primarily a business-intelligence/querying tool, not a replacement for distributed tracing.

### Traces: follow a particular operation across boundaries

A **span** describes one timed unit of work: an HTTP handler, authentication call, pool checkout or database operation. It has a start, end, span ID and context. A **trace** connects related spans, commonly through parent/child relationships, under one trace ID.

```text
Illustrative trace: GET /orders, 300 seconds total

request span   [=============================================]
  app overhead [2 s]
  pool checkout     [297.95 s waiting.......................]
  DB query                                                  [0.05 s]
```

Here the pool wait dominates; “the database query took five minutes” would be misleading. Pool exhaustion might itself be caused by other requests holding connections for slow queries. Follow that next link rather than immediately enlarging the pool.

Parent durations include their children. Parallel children overlap: two simultaneous 100 ms calls can contribute about 100 ms, not 200 ms, to the critical path. **Do not sum all spans.** Missing instrumentation or sampled-out traces also leave gaps in the evidence.

Request IDs are not automatically present and need not be UUIDs. A request ID is an application's correlation convention; a tracing system also carries trace and span context. Instrumentation propagates that context across boundaries, commonly using W3C's `traceparent` HTTP header. Giving every service an unrelated new ID breaks the chain unless the relationship is recorded.

## 5. Gateway, reverse proxy and load balancer: roles can overlap

| Role | Responsibility | What to measure when it is slow |
|---|---|---|
| API gateway | API policies such as authentication, authorization, rate limits and routing | Policy duration, identity-provider/cache calls, limit decisions and retries |
| Reverse proxy | Accept client requests and forward them to upstream servers | Upstream connection wait, retries, buffering, TLS work and upstream timing |
| Load balancer | Distribute traffic across eligible targets | Per-target traffic, connections, latency, health and capacity |

A reverse proxy can implement HTTP load balancing; a gateway can implement both roles. A TCP-level load balancer need not inspect an HTTP path. “Different service = gateway; same service = load balancer” is a helpful introductory example, not a strict technical boundary.

Authentication asks **who are you?** Authorization asks **may you do this?** A gateway can validate a signed token locally using a cached trusted key, or consult an identity service/session store. Registration usually persists identity data somewhere, possibly at an external provider; it does not imply every API authentication hits our application's database. Login may also involve password verification, network calls and session creation.

A limiter often rejects excess traffic promptly with HTTP `429`. Some systems queue or delay it. Even a quick rejection can lead to a long user-visible wait if the client repeatedly backs off and retries. Check actual responses and retry policy.

If one of three API instances is slow, inspect each instance rather than trusting the aggregate average. Sticky sessions, uneven connection reuse and routing weights mean the slow fraction is not necessarily one-third. A health probe that returns `200` may still miss a route-specific problem.

**A proxy's total request duration includes time waiting for its upstream.** A slow gateway access log alone does not prove slow gateway computation. Compare its own processing/connect times with backend spans for the same request.

## 6. Turn evidence into a convincing answer

An interview opening could be:

> “First, I'd clarify whether five minutes is API latency or time until the orders render, and which users are affected. Then I'd confirm the request path and recent changes. I'd inspect one slow browser request and correlate it with gateway/backend timings to locate the dominant wait before proposing a fix.”

Use this investigation loop:

```text
Observe -> form a hypothesis -> choose a discriminating measurement
   ^                                      |
   +----- compare before/after <- change <-+
```

For example, “large accounts are slow” suggests checking result size, query plan and rendering cost. “All routes spike on one instance” suggests investigating that instance's resources. Both statements narrow the search without claiming proof.

During a real incident, restore service when justified: roll back a correlated deployment, drain a confirmed unhealthy target, or reduce admitted load. Then verify latency, errors and correctness under comparable traffic. Mitigation and root-cause explanation are different outcomes.

Small, single-purpose PRs make review and rollback easier. “Under 300 lines” is a heuristic, not a correctness rule: generated files, mechanical changes and a complex 20-line algorithm have very different review costs.

## References

- [Chrome DevTools: request timing](https://developer.chrome.com/docs/devtools/network/reference#timing-explanation)
- [curl: write-out variables](https://curl.se/docs/manpage.html#-w)
- [OpenTelemetry: traces and spans](https://opentelemetry.io/docs/concepts/signals/traces/)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [Prometheus: architecture and pull model](https://prometheus.io/docs/introduction/overview/)
