# Bharat Carbon · Supplier ESG Portal

```
frontend/   React + TypeScript + Vite + Ant Design — the web app (static site)
backend/    Express API — holds the MongoDB Atlas connection
shared/     Domain model and business rules used by both (types, risk & maturity
            rules, change commands, sample data). No dependencies of its own.
supplier-esg-portal-redesign.html   original prototype, kept for reference
```

The frontend never talks to MongoDB directly (that would expose the database password to every
browser). It calls the backend, which applies each change with the same rules
(`shared/src/domain/commands.ts`) and saves it to Atlas.

## Run locally

```
npm run install:all      # installs root, frontend and backend
cp backend/.env.example backend/.env   # then put your MONGODB_URI in it
npm run dev              # API on :8787 + app on http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | API + web app together |
| `npm run dev:mock` | Web app only, in-browser sample data, no database |
| `npm run build` | Production build of the frontend + type-check of the backend |
| `npm test` | Domain, store and colour-contrast tests |
| `npm run db:reset` | Wipe the database and reseed the sample data (dev only) |

## Hosting

> **Security first.** There is no user sign-in yet. Before the portal is reachable on the
> internet, set `BASIC_AUTH_USER` and `BASIC_AUTH_PASSWORD` on the backend so every request
> needs a password. Also add the host's outbound IP addresses to **Atlas → Network Access**.

### Option A — one service (recommended while there's no sign-in)

The backend serves the built frontend, so everything is on one address and the password gate
covers both. Works on Render, Railway, Azure App Service, a VM, etc.

- **Build command:** `npm run install:all && npm run build`
- **Start command:** `npm start`
- **Environment variables:**
  - `NODE_ENV=production`
  - `MONGODB_URI=…` (from Atlas)
  - `SERVE_FRONTEND_DIR=../frontend/dist`
  - `BASIC_AUTH_USER=…`, `BASIC_AUTH_PASSWORD=…`
- The platform's `PORT` is used automatically. Health check path: `/api/health`.

### Option B — frontend and backend hosted separately

- **Frontend** (Vercel, Netlify, Azure Static Web Apps, S3 + CloudFront …)
  - Root directory: `frontend` · Build: `npm install && npm run build` · Output: `dist`
  - Set `VITE_API_URL=https://<your-api-domain>/api` at build time
  - Add a rewrite of all routes to `/index.html` (single-page app)
- **Backend** (Render, Railway, Azure …)
  - Root directory: `backend` · Build: `npm install` · Start: `npm start`
  - `NODE_ENV=production`, `MONGODB_URI=…`, `CORS_ORIGIN=https://<your-frontend-domain>`
- Both need access to the `shared/` folder, so deploy from the whole repository with the
  root directory set as above (the default on these platforms).
- The Basic-auth gate is designed for Option A; with separate domains, protect the frontend
  with your host's access controls until user sign-in is built.

All backend settings are documented in `backend/.env.example`; frontend build settings in
`frontend/.env.example`.
