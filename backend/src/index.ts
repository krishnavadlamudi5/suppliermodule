/**
 * Supplier ESG portal API.
 *
 *   GET  /api/health      → database reachable? (never behind the password gate, for host health checks)
 *   GET  /api/programme   → the whole PortalData
 *   POST /api/commands    → apply one PortalCommand and persist it
 *   POST /api/reset       → wipe and reseed with sample data (development only)
 *
 * Configuration comes from environment variables, or backend/.env locally (git-ignored).
 * See backend/.env.example for the full list.
 *
 * SECURITY: there is no user sign-in yet. Before exposing this on the internet,
 * set BASIC_AUTH_USER and BASIC_AUTH_PASSWORD so every request needs a password.
 */
import { existsSync } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { applyCommand } from '@shared/domain/commands';
import type { PortalCommand } from '@shared/domain/commands';
import type { PortalData } from '@shared/domain/types';
import { createSampleData } from '@shared/fixtures/sampleData';
import { connectPortalDb } from './db';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);

const env = process.env;
const isProd = env.NODE_ENV === 'production';
const uri = env.MONGODB_URI;
const dbName = env.MONGODB_DB ?? 'supplier_portal';
// Locally use API_PORT (dev tools often set PORT for the web server).
// Hosting platforms (Render, Railway, Azure, …) set PORT, which is honoured in production.
const port = Number(env.API_PORT ?? (isProd ? env.PORT : undefined) ?? 8787);
// Loopback locally; all interfaces in production so the platform can route traffic in
const host = env.HOST ?? (isProd ? '0.0.0.0' : '127.0.0.1');
// Origins allowed to call the API from a browser when the frontend is hosted separately
const corsOrigins = (env.CORS_ORIGIN ?? '').split(',').map((o) => o.trim()).filter(Boolean);
const basicUser = env.BASIC_AUTH_USER;
const basicPassword = env.BASIC_AUTH_PASSWORD;
// Optional: serve the built frontend from this server (single deployment, single origin)
const frontendDir = env.SERVE_FRONTEND_DIR ? path.resolve(env.SERVE_FRONTEND_DIR) : null;

if (!uri) {
  console.error('MONGODB_URI is not set. Put it in backend/.env (see backend/.env.example) or the host environment.');
  process.exit(1);
}
if (isProd && !(basicUser && basicPassword)) {
  console.warn('WARNING: running in production without BASIC_AUTH_USER / BASIC_AUTH_PASSWORD. Anyone who can reach this server can read and change supplier data.');
}

const db = await connectPortalDb(uri, dbName).catch((e: Error) => {
  // Never log the URI — it contains the password
  console.error(`Could not connect to MongoDB: ${e.message}`);
  console.error('A timeout usually means this server’s IP address is not in Atlas → Network Access (IP Access List).');
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
app.disable('x-powered-by');
if (isProd) app.set('trust proxy', 1);
app.use(express.json({ limit: '100kb' }));

/* ---------- Basic security headers ---------- */
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

/* ---------- CORS (only when the frontend is on another domain) ---------- */
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && corsOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

/* ---------- Health check (open, so the host can monitor the service) ---------- */
app.get('/api/health', async (_req, res) => {
  await db.ping();
  res.json({ ok: true });
});

/* ---------- Optional password gate over everything else ---------- */
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
if (basicUser && basicPassword) {
  app.use((req, res, next) => {
    const [scheme, encoded] = (req.headers.authorization ?? '').split(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString();
      const i = decoded.indexOf(':');
      if (i > 0 && same(decoded.slice(0, i), basicUser) && same(decoded.slice(i + 1), basicPassword)) {
        next();
        return;
      }
    }
    res.setHeader('WWW-Authenticate', 'Basic realm="Supplier ESG Portal", charset="UTF-8"');
    res.status(401).send('Authentication required');
  });
}

/* ---------- API ---------- */
app.get('/api/programme', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
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

if (!isProd) {
  app.post('/api/reset', async (_req, res) => {
    await serial(() => db.save(null, createSampleData()));
    res.json({ ok: true, reset: dbName });
  });
}

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

/* ---------- Optional: serve the built frontend (SPA) ---------- */
if (frontendDir) {
  if (!existsSync(path.join(frontendDir, 'index.html'))) {
    console.error(`SERVE_FRONTEND_DIR is set but ${frontendDir}/index.html was not found. Build the frontend first (npm run build).`);
    process.exit(1);
  }
  app.use(express.static(frontendDir, { index: false, maxAge: '1h' }));
  // Every non-API route returns the app; React Router handles it in the browser
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(frontendDir, 'index.html'));
  });
}

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  void _next;
  console.error(err.message);
  res.status(500).json({ error: 'Server error' });
});

const server = app.listen(port, host, () => {
  console.log(
    `Supplier portal API on http://${host}:${port} · database "${dbName}"` +
      (frontendDir ? ' · serving frontend' : '') +
      (basicUser && basicPassword ? ' · password gate ON' : ''),
  );
});

const shutdown = () => server.close(() => void db.close().then(() => process.exit(0)));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
