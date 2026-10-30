import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';
import { createApp } from './app.js';
import { MongoCounterStore } from './store.js';

const env = fileURLToPath(new URL('../.env.local', import.meta.url));
if (existsSync(env)) process.loadEnvFile(env); // Existing process env takes precedence.
const uri = process.env.MONGODB_URI;
const database = process.env.MONGODB_DB || 'counter_app';
const port = Number(process.env.PORT || 3001);
if (!uri || !Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Set MONGODB_URI and a valid PORT before starting. See README.md.');
  process.exit(1);
}

const client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000, timeoutMS: 10000 });
const log = (entry: Record<string, unknown>) => console.log(JSON.stringify({ time: new Date().toISOString(), ...entry }));
try {
  await client.connect();
  const store = new MongoCounterStore(client.db(database));
  await store.initialize();
  const staticDir = fileURLToPath(new URL('../client-dist', import.meta.url));
  const server = createApp(store, { staticDir, log }).listen(port, '0.0.0.0', () => {
    log({ event: 'listening', port, database: 'connected' });
  });
  server.on('error', () => {
    console.error('Server failed to listen. Check whether the port is already in use.');
    void client.close().finally(() => process.exit(1));
  });
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    log({ event: 'shutdown' });
    const deadline = setTimeout(() => process.exit(1), 10000);
    deadline.unref();
    server.close(() => {
      void client.close().finally(() => { clearTimeout(deadline); process.exit(0); });
    });
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
} catch {
  console.error('Database startup failed. Check MONGODB_URI, credentials and the Atlas network access list.');
  await client.close();
  process.exitCode = 1;
}
