# System Design Fundamentals: Foundational Ideas

Complete notes from *System Design Live: Week 1 (Foundational Ideas)*.

---

## 1. Example Application Context

To understand system design, we use a standard web application stack:
- **Frontend:** React
- **Backend:** Express
- **Database:** MongoDB running in Docker

Any developer can build this locally, but making it handle real-world scale and traffic requires system design.

---

## 2. Engineer Career Progression: What Gives You an Edge?

```
Learner (DEV) ──> Junior Engineer (DEV + CLOUD) ──> Mid/Senior Engineer (DEV + CLOUD + System Design)
```

| Role | Skill Set | Focus |
|---|---|---|
| **Learner (DEV)** | HTTP/HTTPS, Client-Server model, REST APIs, SQL/NoSQL basics, Auth, Git | Building working features locally |
| **Junior (DEV + CLOUD)** | 1 Cloud Platform (AWS/GCP/Azure), Debugging, Logging, Hosting, Env vars, Testing | Deploying features to the cloud |
| **Senior (DEV + CLOUD + System Design)** | Scaling, Failure handling, Latency, Trade-offs, Architecture | Designing reliable systems under scale |

### The 4 Layers of Software Knowledge
1. **Basic Programming + DSA**
2. **Development (Web/App/Backend)**
3. **Core CS (OS, Computer Networks, Database Internals)**
4. **System Design (Architecture, Distributed Systems)**

---

## 3. Data Flow: Junior View vs Senior View

### Example Feature: `counter = 2`
- Endpoint: `GET /counter`
- Database Query: `SELECT * FROM counter`

```
Client ──(GET /counter)──> Server ──(SELECT * FROM counter)──> Database
  │                                                                │
  └───────────────── Returns count = 2 ◄───────────────────────────┘
```

* **Junior Engineer View:** Sees only the happy path data flow (API call ──> DB query ──> Return count ──> Render on UI).
* **Senior Engineer View:** Sees potential failure modes and asks critical questions:
  * *"If 1,000,000 users call `GET /counter` simultaneously, what breaks?"*
  * *"If 100 users hit `POST /increment` at the exact same millisecond, do we get race conditions?"*
  * *"What if the Database is slow or completely down?"*
  * *"Is `counter = 2` guaranteed to be accurate after network retries?"*

---

## 4. Requirements Framing (The Critical First Step)

Before designing any system, framing requirements is mandatory.

A requirement defines:
1. **Behavior:** What the system must do.
2. **Quality Constraints:** How well it must do it.
3. **Conditions:** Under what scale, security, and failure modes it operates.

* **Vague Requirement (Bad):** *"The system should be fast."*
* **Precise Requirement (Good):** *"p95 latency < 100ms at 5,000 QPS."*

### Requirement Types
* **Functional Requirements (FR):** System features and API specifications.
  * `GET /counter` returns current count.
  * `POST /increment` increments count by 1.
  * *Other examples:* User can upload PDFs, Search returns top 10 results.
* **Non-Functional Requirements (NFR):** Quality attributes that define engineering seniority.

---

## 5. Non-Functional Requirements (NFR) Master Table

| NFR | Definition | Example Metric / Goal | Primary Architecture Solution |
|---|---|---|---|
| **Performance (Latency)** | Response speed per request | `GET /counter` p95 < 100ms | In-memory Caching (Redis), CDN |
| **Throughput (Capacity)** | Requests handled per second (QPS) | Handle 10,000 GET QPS + 2,000 POST QPS | Horizontal Scaling, Load Balancer |
| **Scalability** | Smooth growth handling | Prevent single-row DB bottlenecks | Sharding, Decoupled Queues |
| **Availability (Uptime)** | Continuous operation despite crashes | 99.99% uptime | Health checks, Multi-AZ failover |
| **Reliability** | Correctness under network/system faults | Avoid double increments on retry | Idempotency Key Store |
| **Consistency** | Data uniformity across nodes | Strong vs Eventual consistency | Primary Reads vs Async Replicas |
| **Durability** | Zero data loss once acknowledged | Persistent commit logs | Durable Message Queues (Kafka) |
| **Security** | Auth & abuse protection | Prevent DDoS, rate limit bad actors | API Gateway (Auth, Throttling) |
| **Observability** | Visibility into internal state | Instant alert on error spikes | Metrics, Logs, Distributed Tracing |
| **Operability** | Safe deployments & changes | Zero-downtime releases | CI/CD, Feature Flags, Canary deploys |

---

## 6. Fundamentals: Single Computer & Operating System

Before scaling across distributed machines, understand how a single computer works:

```
Source Code (test.c) ──(gcc -S)──> Assembly (test.s) ──> CPU Execution
```

### Why the OS Exists
When multiple programs run concurrently on a single machine:
1. **Fair CPU Scheduling:** Allocates CPU slices fairly across competing processes.
2. **Hardware Mediation:** Controls access to shared hardware (RAM, Disk, Network).
3. **Isolation & Security:** Prevents one process or user from crashing or reading another process's memory.

---

## 7. Deep-Dive: Architectural Solutions by NFR

### A. Performance & Latency Reduction

#### Latency Sources Breakdown
1. **Client ──> Server (Network & TLS):**
   * Same region / good network: `10 – 50 ms`
   * Cross-country / mobile: `50 – 200+ ms`
   * New TLS handshake: Adds `20 – 100 ms`
2. **Server ──> Database (Data Center / VPC):**
   * Same VPC / same Availability Zone: `0.2 – 2 ms`
   * Across Availability Zones: `1 – 5 ms`
   * Outside VPC / Public Internet: `10 – 50 ms` *(Anti-pattern: keep DB in private VPC!)*

#### Redis In-Memory Cache
* Runs in RAM (nanosecond access time).
* Supports ACID properties and ready-made data structures (Strings, Hashes, Lists, Sets, Sorted Sets).
* Reduces DB query latency from milliseconds to sub-millisecond.

---

### B. Throughput & Scaling Capacity

#### QPS Rule-of-Thumb Benchmark (per EC2 / Compute Instance)

| Instance Size | CPU-Only Endpoint (`GET /health`) | DB Read Endpoint (`GET /count`) | DB Write Endpoint (`POST /increment`) |
|---|---|---|---|
| **1 vCPU** | 500 – 5,000 QPS | 100 – 800 QPS | 50 – 400 QPS |
| **2 vCPU** | 1,000 – 10,000 QPS | 200 – 1,500 QPS | 100 – 800 QPS |
| **4 vCPU** | 3,000 – 20,000 QPS | 500 – 3,000 QPS | 250 – 1,500 QPS |
| **8 vCPU** | 8,000 – 50,000 QPS | 1,000 – 6,000 QPS | 500 – 3,000 QPS |

*Note: For DB read/write endpoints, the DB connection pool or DB CPU usually becomes the bottleneck before the application server CPU does.*

#### Scaling Approaches
* **Vertical Scaling (Scale Up):** Upgrading CPU/RAM of a single machine (has hard hardware limits and single point of failure).
* **Horizontal Scaling (Scale Out):** Adding more server instances behind a **Load Balancer** (redirects traffic across target groups).

---

### C. Scalability (Hotspots)

* **The Problem:** 10,000 concurrent requests calling `POST /increment` hit the **exact same database row** (`counter`), creating a major row-lock bottleneck.
* **Solution:** Aggregate increments in memory or use asynchronous message queues before writing to the database.

---

### D. Availability (Uptime & Health Checks)

* **The Problem:** Server instances or DB nodes fail due to hardware faults, memory leaks, or network splits.
* **Solution:**
  * **Load Balancer Health Checks:** Continuously polls instances and automatically redirects traffic away from unhealthy instances.
  * **Database Failover:** Primary-Replica setups where a backup replica is automatically promoted if the primary fails.

---

### E. Reliability & Retries (Idempotency)

* **The Risk:** Client calls `POST /increment`, server processes it, but the network drops before the response reaches the client. Client retries the call ──> **Double Increment!**
* **Solution (Idempotency Key Store):** Client passes a unique `Idempotency-Key` header. The server checks an in-memory store (e.g. Redis) before processing. If the key was already processed, it returns the cached response without re-executing.

---

### F. Consistency Models

* **Option A: Strong Consistency (Read Primary)**
  * Reads are always routed to the Primary DB node.
  * *Pros:* Guaranteed most recent data.
  * *Cons:* High read load on Primary node; harder to scale geographically.
* **Option B: Eventual Consistency (Async Replicas)**
  * Writes go to Primary; Reads go to Read Replicas updated asynchronously.
  * *Pros:* Extremely fast and horizontally scalable.
  * *Cons:* Temporary replica lag (a read right after a write might briefly return stale data).

---

### G. Durability (Durable Queues)

* **The Problem:** If the server crashes after accepting a request but before writing to disk/DB, data is lost.
* **Solution:** Use a **Durable Message Queue** (e.g. Kafka, RabbitMQ) as a commit log point. Once the event is persisted to the durable queue log, the client gets an ACK. Workers pull from the queue asynchronously.

---

### H. Security & The API Gateway

An **API Gateway** acts as the single entry point for client requests, handling security and cross-cutting concerns:
1. **Authentication & Authorization:** Verifies identity (JWT, API Key, OAuth) and enforces permissions.
2. **Rate Limiting & Throttling:** Controls traffic per user/IP/API key to prevent abuse and DDoS.
3. **Load Balancing & Routing:** Routes requests to the appropriate target microservice.
4. **Caching:** Caches frequent responses at the edge.
5. **Request / Response Transformation:** Rewrites headers, validates JSON schemas, converts formats.
6. **Service Discovery Integration:** Dynamically locates live microservice IP addresses.
7. **Circuit Breaking / Timeouts / Retries:** Fails fast when a backend service is struggling, preventing cascading failures across the system.

---

### I. Observability: The 3 Pillars

To diagnose failures in production:
1. **Metrics:** Aggregated numerical data (e.g., CPU usage, error rate, p95 latency).
2. **Logs:** Detailed timestamped text records of individual events.
3. **Tracing:** Tracking the end-to-end path of a single request as it hops across multiple microservices.

---

### J. Maintainability & Operability

* **CI/CD Pipelines:** Automated testing and safe zero-downtime deployment pipelines.
* **Feature Flags:** Toggling features on/off dynamically in production without redeploying application code.

---

## 8. Practical HLD Principles & The Standard 95% Architecture Blueprint

### The Golden Rules of System Design Interviews
1. **Don't get overly fancy:** Throwing excessive buzzwords or complex microservice patterns without justification will hurt you. 
2. **The 80/20 Rule:** 20% of foundational concepts (Caching, Load Balancing, Queues, Database choice, Health Checks) solve 95% of interview problems.
3. **Stateless vs. Stateful:**
   * **Servers are Stateless:** They hold no session data in local memory. You can add or destroy 100 API servers effortlessly.
   * **Databases are Stateful:** They hold persistent data. Scaling stateful databases (sharding, replication, split-brain resolution) is vastly more complex than scaling stateless servers.
4. **Connection Bottlenecks:**
   * An EC2 server CPU might handle thousands of requests, but a Database (e.g., PostgreSQL/MongoDB) has a strict limit on concurrent open socket connections (often 100 – 500 connections).
   * Connection Pooling (or intermediate proxies like PgBouncer / Redis cache) is required to prevent DB connection exhaustion.

---

### The Standard 95% Architecture Blueprint

For almost 95% of Web System Design problems, your base architecture follows this pattern:

```
                                  ┌───────────────────────────┐
                                  │      API Gateway          │
                                  │  (Auth + Rate Limiting)   │
                                  └─────────────┬─────────────┘
                                                │
                                  ┌─────────────▼─────────────┐
                                  │       Load Balancer       │
                                  │   (DNS / L7 Health Check) │
                                  └─────────────┬─────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 │                              │                              │
          ┌──────▼──────┐                ┌──────▼──────┐                ┌──────▼──────┐
          │ API Server 1│                │ API Server 2│                │ API Server 3│ (Stateless)
          └──────┬──────┘                └──────┬──────┘                └──────┬──────┘
                 │                              │                              │
                 └──────────────────────────────┼──────────────────────────────┘
                                                │
                                  ┌─────────────▼─────────────┐
                                  │    Durable Message Queue  │
                                  │     (Kafka / RabbitMQ)    │
                                  └─────────────┬─────────────┘
                                                │
                                  ┌─────────────▼─────────────┐
                                  │     Background Workers    │
                                  └──────┬──────────────┬─────┘
                                         │              │
                           ┌─────────────▼──┐        ┌──▼─────────────┐
                           │ In-Memory Cache│        │   Database     │
                           │    (Redis)     │        │ (SQL / NoSQL)  │
                           └────────────────┘        └────────────────┘
```

---

## 9. Homework & Practical Lab (Week 1)

1. **Vibe Code & Deploy:** Build the simple counter website (Frontend: React, Backend: Express, DB: MongoDB/Docker) and host/deploy it on AWS EC2 or App Runner.
2. **Concepts to Master:**
   * **TLS Handshake & HTTPS:** How asymmetric key exchange transitions to symmetric encryption.
   * **vCPU vs Physical Core:** vCPU equals one hardware hyperthread (e.g. AWS `t3` uses 2 hyperthreads per physical core).
   * **Health Checks:** How Load Balancers poll endpoints (e.g., 3 consecutive `200 OK` passes mark server as healthy; consecutive failures route traffic away).

---

## 10. Ultimate Objective

Mastering these foundational building blocks equips you to construct a structured **System Design Interview Framework** to tackle complex distributed system problems step-by-step.
