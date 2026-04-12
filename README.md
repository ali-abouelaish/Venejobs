# Venejobs

Freelance marketplace. Next.js frontend, Express backend, WebSocket relay.

## Prerequisites

- Node.js 20+
- npm 10+
- A Neon (PostgreSQL) database
- Git

## Repo structure

```
venejobs/
  frontend/      Next.js app (UI + newer API routes) — git submodule
  backend/       Express auth + legacy CRUD
  ws-server/     WebSocket relay + internal broadcast
  migrations/    Raw SQL migrations for frontend-owned tables
  scripts/       Utility scripts (apply SQL, etc.)
```

## First-time setup

Clone with submodules:

```bash
git clone --recurse-submodules https://github.com/YOUR_USERNAME/venejobs.git
cd venejobs
```

If you already cloned without submodules:

```bash
git submodule update --init --recursive
```

Install all workspace dependencies:

```bash
npm install
```

This installs `frontend/`, `backend/`, and `ws-server/` in one go via npm workspaces.

## Environment variables

Each service has its own `.env` or `.env.local` file. These are gitignored — never commit them.

### `frontend/.env.local`

```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
WS_SECRET=<shared-with-ws-server>
WS_INTERNAL_SECRET=<shared-with-ws-server>
WS_INTERNAL_URL=http://localhost:4001
NEXT_PUBLIC_BASE_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4002
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
R2_PUBLIC_URL=...
```

### `backend/.env`

Copy `backend/.env.example` and fill in. Typically:

```
DATABASE_URL=<same as frontend>
JWT_SECRET=<any-long-random-string>
PORT=4000
```

### `ws-server/.env`

Copy `ws-server/.env.example` and fill in:

```
DATABASE_URL=<same as frontend>
WS_SECRET=<matches frontend>
WS_INTERNAL_SECRET=<matches frontend>
WS_PORT=4002
WS_INTERNAL_PORT=4001
```

### Generating secrets

For `WS_SECRET`, `WS_INTERNAL_SECRET`, and `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Generate each independently. Don't reuse across variables.

`WS_SECRET` and `WS_INTERNAL_SECRET` **must match exactly** between frontend and ws-server.

## Running locally

From the repo root:

```bash
npm run dev
```

This starts all three services concurrently:

| Service   | Port  | URL                     |
|-----------|-------|-------------------------|
| frontend  | 5173  | http://localhost:5173   |
| backend   | 4000  | http://localhost:4000   |
| ws-server | 4002  | ws://localhost:4002     |
| ws internal | 4001 | http://localhost:4001 (not user-facing) |

Logs are prefixed with the service name. Ctrl+C stops all three.

### Running services individually

```bash
npm -w frontend run dev
npm -w backend run dev
npm -w ws-server run dev
```

## Database

The live schema is owned by two sources:

- `backend/migrations/` — Sequelize-owned tables (users, jobs, proposals core, freelancer profiles, categories, skills, etc.)
- `migrations/` — raw SQL for frontend-owned tables (messaging, contracts)

Both are already applied to the production Neon DB.

To apply a new raw SQL migration:

```bash
cd frontend
npx tsx scripts/apply-sql.ts migrations/003_example.sql
```

To regenerate the Drizzle schema from the live DB:

```bash
cd frontend
npx drizzle-kit pull
```

## Testing the full flow

1. Start all services with `npm run dev`
2. Log in as a client in one browser, a freelancer in another (or use incognito)
3. Client posts a job → freelancer submits proposal → client accepts → chat + contract flow

See `CLAUDE.md` for internal architecture notes.

## Common issues

**Login fails** — backend is not running. Start it or check `backend/.env`.

**Messages don't appear live** — ws-server isn't running, or `WS_SECRET`/`WS_INTERNAL_SECRET` don't match between frontend and ws-server.

**`DATABASE_URL not set`** — check the right `.env` file exists in the right service folder.

**Port already in use** — kill whatever's on 4000/4001/4002/5173.

## Deployment

Not yet configured. Each service deploys independently; they don't need to share infrastructure.

## License

Private.