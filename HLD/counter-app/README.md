# Counter Lab

HLD session 1 homework: one public, shared counter with a React + TypeScript interface, an Express API and MongoDB persistence. Everyone reads and increments the same number. A missing counter starts at `0`; starting the server again keeps its saved value.

## Run locally

Requires Node.js 22.20+ within version 22, npm, and Docker with Compose for the local database.

```bash
cd HLD/counter-app
npm ci
npm run db:up
npm run dev:local
```

Open **http://localhost:5180**. Vite serves React and proxies `/api` requests to Express on port `3001`.

`dev:local` explicitly selects Docker MongoDB on `127.0.0.1:27018`, even if `.env.local` contains an Atlas URI. The Compose volume preserves data when MongoDB stops. Use `npm run db:stop` when finished.

### Use Atlas instead

Create `.env.local` from `.env.example` only if you don't already have it. Set `MONGODB_URI` to your Atlas connection string and `MONGODB_DB=counter_app`, then run `npm run dev`. Your current public IP must be allowed in Atlas Network Access. The existing local credentials file is ignored by Git.

### Run the production build locally

```bash
npm run build
npm run start:local
```

Open **http://localhost:3001**. Express now serves both the compiled React files and the API. To use the Atlas configuration in `.env.local`, run `npm start` instead. Stop the dev server first because both use port `3001`.

## API

| Request | Success response | Meaning |
|---|---|---|
| `GET /api/counter` | `{"value":0}` | Read the saved value |
| `POST /api/increment` | `{"value":1}` | Atomically add one; no body needed |
| `GET /api/health` | `{"status":"ok","database":"connected"}` | Verify database connectivity |

The value examples assume a fresh database. API responses use `Cache-Control: no-store`. Database failures return `503`; reaching JavaScript's safe-integer limit returns `409` for increments. Request logs contain method, path, status and duration, not database credentials.

```bash
curl --fail-with-body http://localhost:3001/api/counter
curl --fail-with-body -X POST http://localhost:3001/api/increment
```

The UI refreshes every five seconds while its tab is visible. It waits for the saved result before changing the displayed counter and prevents overlapping button submissions. A failed POST is not automatically retried; refresh first because the write might already have succeeded.

## Verify

```bash
npm run db:up
npm run test:local
npm run build
```

The seven tests use real MongoDB and HTTP requests: initial state, 100 concurrent increments, API/client restart persistence, concurrent initialization, method/body handling, health/error responses, and integer limits. Each run creates and deletes its own uniquely named test database. GitHub Actions runs the same suite using a MongoDB service container.

## Deploy on Render Free

`render.yaml` is a Blueprint configured with `plan: free`. Import this repository using **HLD/counter-app/render.yaml** as the Blueprint path and enter `MONGODB_URI` in Render's secret environment settings. Use the Hobby workspace and verify the Free instance selection in the deployment summary.

For manual web-service setup, use these same settings:

| Setting | Value |
|---|---|
| Branch | `main` |
| Root directory | `HLD/counter-app` |
| Runtime / region / instance | Node / Singapore / **Free** |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `npm start` |
| Health check | `/api/health` |
| Environment | `NODE_VERSION=22.20.0`, `NODE_ENV=production`, `MONGODB_DB=counter_app`, secret `MONGODB_URI` |

Allow the service's **outbound IP ranges** from its Render dashboard in Atlas Network Access. Confirm the Atlas cluster is the **Free** tier. Render supplies `PORT`; the app listens on all interfaces. Free web services can sleep after 15 idle minutes and take around a minute to wake. Multiple free services share the workspace's free service-hour allowance.

### Scheduled keep-alive

`.github/workflows/counter-keepalive.yml` requests `/api/health` every five minutes, with timeouts and one retry for transient failures. It checks the JSON response and does not increment the counter. The job skips until the repository variable `COUNTER_APP_URL` is set to the deployed app's HTTPS base URL.

After deployment, substitute the actual URL below:

```bash
gh variable set COUNTER_APP_URL --body 'https://YOUR-SERVICE.onrender.com'
gh workflow run counter-keepalive.yml
gh run list --workflow counter-keepalive.yml --limit 5
```

Pause it with `gh workflow disable counter-keepalive.yml`; resume with `gh workflow enable counter-keepalive.yml`. Schedule timing and free-hour limits: [Scheduled GitHub Actions](../../ToLearn/Developer-Tools/GitHubActionsDocs.md).

## Find the code

- `src/`: React UI and styles.
- `server/app.ts`: HTTP routes and error responses.
- `server/store.ts`: fixed `_id: 'global'`, insert-only initialization and MongoDB `$inc`.
- `server/index.ts`: configuration, database connection and shutdown.
- `tests/counter.test.ts`: integration checks.

Design notes: [Counter architecture](../../ToLearn/HLD/CounterArchitectureDocs.md). Learning exercises: [Counter lab](../../PracticeSheets/HLD/CounterLabTask.md). Command meanings: [Commands cheat sheet](../../ToLearn/Developer-Tools/CommandsDocs.md).
