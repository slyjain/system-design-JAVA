# Practice: shared counter lab

Code and commands: `HLD/counter-app/README.md`. Theory: `ToLearn/HLD/CounterArchitectureDocs.md`. Tick each point after you try or explain it yourself.

- Run the local Docker-backed app. Follow one increment through React, Express and the MongoDB document.
- Open two browser windows. Click in one and observe when the other sees the change. Explain why the delay occurs.
- Note the value, stop and restart Express, then refresh. Explain which process owns the persistent value.
- Stop and restart Docker MongoDB without deleting its volume. Check the value and explain why replacing a container need not replace its data.
- Run the integration tests. Explain what the 100-concurrent-increments test proves and what it does not prove.
- Stop MongoDB while the Docker-backed app is running. Inspect `/api/health` and the UI, then restore MongoDB and refresh.
- Explain why a timed-out increment request must not be blindly repeated, even though the update uses `$inc`.
- After deployment, open the HTTPS app from another device and verify that both devices share the counter.
