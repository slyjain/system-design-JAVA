import express from 'express';
import type { ErrorRequestHandler } from 'express';
import { performance } from 'node:perf_hooks';
import { CounterLimitError } from './store.js';
import type { CounterStore } from './store.js';

type Options = { staticDir?: string; log?: (entry: Record<string, unknown>) => void };

export function createApp(store: CounterStore, options: Options = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    const started = performance.now();
    res.on('finish', () => options.log?.({
      event: 'request', method: req.method, path: req.path,
      status: res.statusCode, durationMs: Math.round(performance.now() - started),
    }));
    next();
  });
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.get('/api/health', async (_req, res) => {
    await store.ping();
    res.json({ status: 'ok', database: 'connected' });
  });
  app.get('/api/counter', async (_req, res) => {
    res.json({ value: await store.read() });
  });
  app.post('/api/increment', async (_req, res) => {
    // No client-provided value: one accepted request asks for exactly +1.
    res.json({ value: await store.increment() });
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found' }));
  if (options.staticDir) app.use(express.static(options.staticDir));
  app.use((_req, res) => res.status(404).type('text').send('Not found'));
  const onError: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    if (error instanceof CounterLimitError) {
      res.status(409).json({ error: 'Counter limit reached' });
      return;
    }
    // Do not expose driver errors, connection strings or credentials in logs/responses.
    options.log?.({ event: 'database_request_failed' });
    res.status(503).json({ error: 'Database unavailable. Try refreshing shortly.' });
  };
  app.use(onError);
  return app;
}
