import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { MongoClient } from 'mongodb';
import { createApp } from '../server/app.js';
import { MongoCounterStore } from '../server/store.js';

const uri = process.env.COUNTER_TEST_MONGODB_URI;
if (!uri) throw new Error('Set COUNTER_TEST_MONGODB_URI to a test MongoDB, or run npm run db:up then npm run test:local.');
const databaseName = `counter_test_${randomUUID().replaceAll('-', '')}`;
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, timeoutMS: 10000 });
const store = new MongoCounterStore(client.db(databaseName));
let server: Server;
let base: string;

async function listen(app: ReturnType<typeof createApp>): Promise<{ server: Server; base: string }> {
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  return { server, base: `http://127.0.0.1:${(server.address() as AddressInfo).port}` };
}
async function close(server: Server) {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

beforeAll(async () => {
  await client.connect();
  ({ server, base } = await listen(createApp(store)));
});
beforeEach(async () => {
  await client.db(databaseName).collection('counters').deleteMany({});
  await store.initialize();
});
afterAll(async () => {
  if (server) await close(server);
  try { await client.db(databaseName).dropDatabase(); } finally { await client.close(); }
});

describe('counter API against real MongoDB', () => {
  it('starts at zero, increments once and returns uncached saved data', async () => {
    const first = await fetch(`${base}/api/counter`);
    expect(first.headers.get('cache-control')).toBe('no-store');
    expect(await first.json()).toEqual({ value: 0 });
    const increment = await fetch(`${base}/api/increment`, { method: 'POST' });
    expect(increment.status).toBe(200);
    expect(await increment.json()).toEqual({ value: 1 });
    expect(await (await fetch(`${base}/api/counter`)).json()).toEqual({ value: 1 });
  });

  it('loses no updates for 100 simultaneous HTTP increments', async () => {
    const results = await Promise.all(Array.from({ length: 100 }, async () => {
      const response = await fetch(`${base}/api/increment`, { method: 'POST' });
      expect(response.status).toBe(200);
      return (await response.json()).value as number;
    }));
    expect(new Set(results).size).toBe(100);
    expect(await store.read()).toBe(100);
  });

  it('keeps its data when the API and database client restart', async () => {
    await store.increment();
    await close(server);
    const secondClient = new MongoClient(uri!, { serverSelectionTimeoutMS: 5000 });
    try {
      await secondClient.connect();
      const secondStore = new MongoCounterStore(secondClient.db(databaseName));
      await secondStore.initialize();
      ({ server, base } = await listen(createApp(secondStore)));
      expect(await (await fetch(`${base}/api/counter`)).json()).toEqual({ value: 1 });
      await close(server);
    } finally {
      await secondClient.close();
      ({ server, base } = await listen(createApp(store)));
    }
  });

  it('initializes concurrently without resetting or duplicating the global counter', async () => {
    await client.db(databaseName).collection('counters').deleteMany({});
    await Promise.all(Array.from({ length: 10 }, () => store.initialize()));
    await store.increment();
    await store.initialize();
    expect(await store.read()).toBe(1);
    expect(await client.db(databaseName).collection('counters').countDocuments()).toBe(1);
  });

  it('does not let GET requests or client-provided values change the counter', async () => {
    expect((await fetch(`${base}/api/increment`)).status).toBe(404);
    await fetch(`${base}/api/increment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"value":9000}' });
    expect(await store.read()).toBe(1);
  });

  it('checks database health and reports database failures without leaking credentials', async () => {
    expect(await (await fetch(`${base}/api/health`)).json()).toEqual({ status: 'ok', database: 'connected' });
    const fail = async (): Promise<never> => { throw new Error('mongodb://secret-user:secret-password@private-host'); };
    const failed = await listen(createApp({ read: fail, increment: fail, ping: fail }));
    try {
      for (const [path, method] of [['counter', 'GET'], ['increment', 'POST'], ['health', 'GET']]) {
        const response = await fetch(`${failed.base}/api/${path}`, { method });
        expect(response.status).toBe(503);
        expect(await response.json()).toEqual({ error: 'Database unavailable. Try refreshing shortly.' });
      }
    } finally { await close(failed.server); }
  });

  it('stops at the largest exactly representable JavaScript integer', async () => {
    await client.db(databaseName).collection('counters').updateOne({}, { $set: { value: Number.MAX_SAFE_INTEGER } });
    const response = await fetch(`${base}/api/increment`, { method: 'POST' });
    expect(response.status).toBe(409);
    expect(await store.read()).toBe(Number.MAX_SAFE_INTEGER);
  });
});
