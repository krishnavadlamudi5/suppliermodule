/**
 * Supplier ESG portal API.
 *
 *   GET  /api/health      → database reachable?
 *   GET  /api/programme   → the whole PortalData
 *   POST /api/commands    → apply one PortalCommand and persist it
 *   POST /api/reset       → wipe and reseed with sample data (development only)
 *
 * Reads MONGODB_URI from server/.env (git-ignored). Listens on 127.0.0.1 only;
 * there is no authentication yet, so don't expose it beyond this machine.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { applyCommand } from '../src/domain/commands';
import type { PortalCommand } from '../src/domain/commands';
import type { PortalData } from '../src/domain/types';
import { createSampleData } from '../src/data/fixtures/sampleData';
import { connectPortalDb } from './db';

const envPath = fileURLToPath(new URL('./.env', import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? 'supplier_portal';
// API_PORT, not PORT: dev tools often set PORT for the web server
const port = Number(process.env.API_PORT ?? 8787);
const isDev = process.env.NODE_ENV !== 'production';

if (!uri) {
  console.error('MONGODB_URI is not set. Put it in server/.env (see server/.env.example).');
  process.exit(1);
}

const db = await connectPortalDb(uri, dbName).catch((e: Error) => {
  // Never log the URI — it contains the password
  console.error(`Could not connect to MongoDB: ${e.message}`);
  console.error('A timeout usually means this machine’s public IP is not in Atlas → Network Access (IP Access List).');
  process.exit(1);
});

if (!(await db.isSeeded())) {
  await db.save(null, createSampleData());
  console.log(`Seeded database "${dbName}" with sample data.`);
}

/* Commands are applied one at a time so concurrent writes can't interleave. */
let queue: Promise<unknown> = Promise.resolve();
const serial = <T>(fn: () => Promise<T>): Promise<T> => {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
};

const app = express();
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', async (_req, res) => {
  await db.ping();
  res.json({ ok: true, database: dbName });
});

app.get('/api/programme', async (_req, res) => {
  res.json(await db.load());
});

app.post('/api/commands', async (req: Request, res: Response) => {
  const command = req.body as PortalCommand;
  if (!command || typeof command.type !== 'string') {
    res.status(400).json({ error: 'Expected a command with a "type"' });
    return;
  }
  const result = await serial(async () => {
    const prev = await db.load();
    let next: PortalData | undefined;
    try {
      next = applyCommand(prev, command);
    } catch (e) {
      return { status: 400, error: e instanceof Error ? e.message : String(e) };
    }
    if (!next) return { status: 400, error: `Unknown command type "${command.type}"` };
    await db.save(prev, next);
    return { status: 204 };
  });
  if (result.status === 204) res.status(204).end();
  else res.status(result.status).json({ error: result.error });
});

if (isDev) {
  app.post('/api/reset', async (_req, res) => {
    await serial(() => db.save(null, createSampleData()));
    res.json({ ok: true, reset: dbName });
  });
}

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  void _next;
  console.error(err.message);
  res.status(500).json({ error: 'Server error' });
});

const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Supplier portal API on http://127.0.0.1:${port} · database "${dbName}"`);
});

const shutdown = () => server.close(() => void db.close().then(() => process.exit(0)));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
