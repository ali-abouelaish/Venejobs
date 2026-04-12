# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Repo layout — read this first

`D:\Venejobs\` is a **local-only wrapper repo** (no remote) containing three
independent nested git repos:

- `frontend/` — nested git repo, remote `github.com/rivendesu12/Venejobs.git`,
  active branch `development`. This is the real frontend history.
- `backend/` — nested git repo with its own history. Legacy Express API.
- `ws-server/` — TypeScript WebSocket server. [VERIFY: is this its own repo
  or just files? Update this line when confirmed.]

**These are NOT git submodules.** There is no `.gitmodules` in the parent.
The parent repo only tracks `CLAUDE.md` and `.claude/`. It does not track
the nested repos' contents. Do not run `git submodule` commands. When
committing code changes, `cd` into the relevant nested repo first.

The parent's single commit ("rebuilding") is a wrapper marker, not a
snapshot of the project. There is no atomic "whole project at time X"
commit anywhere. Fixing this is deferred to Phase 5.

## ⚠️ Migration Freeze (Active)

Mid-migration from 3-service architecture (Express + Next + ws-server) to
unified Next.js + standalone ws-server (Path B). Rules are strict until
the migration completes.

### Current on-disk state

- `backend/` — Express + Sequelize REST API. **FROZEN.** Maintenance only.
  No new routes, controllers, models, migrations, services, or validators.
  Deleted at end of migration.
- `frontend/` — Next.js 16.0.7 App Router. Contains UI plus API route
  handlers under `src/app/api/` (contracts, conversations, messages,
  proposals, inbox, upload/presign, ws-token). Becomes the unified app.
- `frontend/src/app/api/` — **FROZEN** for new routes until Phase 1
  completes. Bug fixes OK, extensions not OK.
- `frontend/migrations/` — Raw SQL (`001_messaging_v2.sql`,
  `002_contracts.sql`). **FROZEN.** Drizzle will own migrations going
  forward.
- `frontend/src/lib/` — Shared backend logic for Next.js routes:
  `assertions.ts` (legacy generic `assertAccess` — deprecated, replace
  per-resource in Phase 3), `auth.ts`, `contracts.ts`, `db.ts`. New shared
  logic lives here once Phase 1 conventions are established.
- `ws-server/` — Standalone TypeScript WebSocket server. Hybrid HTTP+WS on
  port 4001. **ACTIVE.** Schema/auth changes must stay compatible with the
  upcoming unified schema and shared `JWT_SECRET`.

### Deleted, do not recreate

- `frontend/Venejobs/` — dead nested Next.js prototype removed in Phase 0.
  Origin of the `:5173` Vite-era artifacts. Do not restore.

### If a feature touches a frozen area

Stop and tell the user the area is frozen. Do not work around it by adding
to a different frozen location. Do not "temporarily" add to `backend/` and
port later. The correct response is to confirm whether the migration step
that unblocks the work should happen first.

### Migration plan

`MIGRATION.md` does not yet exist. It will be created as part of Phase 1.
Do not start a new phase without confirming with the user.

## Phase 1 status — decisions made, scaffolding NOT YET done

Decisions (final, do not relitigate):

- **ORM**: Drizzle
- **Object storage**: Cloudflare R2 (already wired in existing upload code)
- **Auth**: keep custom JWT, no library swap
- **Assertion helpers**: per-resource (`assertConversationAccess`,
  `assertContractAccess`, etc.), NOT a generic `assertAccess`. Legacy
  generic helper in `src/lib/assertions.ts` is deprecated, delete in
  Phase 3.
- **Schema location**: `frontend/src/lib/schema/<table>.ts`, one file per
  table

Scaffolding state on disk (verify before trusting):

- `drizzle-orm` installed in `frontend/`. `drizzle-kit` is **NOT**
  installed.
- `frontend/drizzle.config.ts` does **NOT** exist.
- `frontend/src/lib/schema/` does **NOT** exist.
- `frontend/src/lib/db.ts` exports only `sql` and `listenSql` (postgres.js).
  No Drizzle `db` export yet.
- `MIGRATION.md` does not exist.

Phase 1 remaining work (in order):

1. Install `drizzle-kit` as a dev dependency in `frontend/`
2. Create `frontend/drizzle.config.ts`
3. Add `db` (Drizzle) export to `frontend/src/lib/db.ts` alongside existing
   `sql` and `listenSql`
4. Hand-write `frontend/src/lib/schema/users.ts` from
   `backend/migrations/20250216132510-create-users.js` + the additive
   `20251113175644_email_send_failed` migration. The roles FK **column**
   must be present even though the Drizzle relation to the roles table
   stays omitted until Phase 3.
5. Reconcile hand-written `users.ts` against `npx drizzle-kit pull` output
   until `npx drizzle-kit generate` produces an empty migration (zero drift)
6. Write the Conventions section into this file
7. Create `MIGRATION.md`

## Database layer (as of Phase 2)

**Source of truth:** `backend/migrations/*.js` (Sequelize, frozen backend). The DB is owned here.

**Frontend migrations:** `frontend/migrations/*.sql` adds messaging_v2 and contracts tables on top of the Sequelize-owned base schema. These are applied manually via `frontend/scripts/migrate.ts`'s runner.

**⚠️ `frontend/scripts/migrate.ts` contains dead `CREATE TABLE` statements** for `proposals`, `conversations`, and `messages` that use *different column names* than the real Sequelize-owned tables (e.g. `offered_price` vs real `proposed_amount`, `estimated_days` vs real `estimated_duration`, status enum `declined` vs real `rejected`). Do NOT trust migrate.ts as a schema reference. Always check `backend/migrations/` for proposals/jobs/users.

**Drizzle:** Scaffolded in Phase 1 at `frontend/src/lib/db/{schema.ts,drizzle.ts}` + `drizzle.config.ts`. **Not yet used by any route.** The current `schema.ts` was built from `scripts/migrate.ts` and is therefore **wrong for `proposals`**. Phase 1.5 will regenerate it via `drizzle-kit pull` against the live DB. Until then, keep using the raw `postgres` client from `src/lib/db`.

**`src/lib/db/` layout:** directory (not a flat file). Entry is `src/lib/db/index.ts` (the raw `postgres` client). `drizzle.ts` exports a Drizzle instance but nothing imports it yet.

**Known tsc debt (pre-existing, do not fix mid-phase):**
- `src/app/api/conversations/[id]/stream/route.ts:45` — `sql.unlisten` doesn't exist
- `src/app/api/proposals/route.ts:48,53` — TransactionSql call-signature quirk

## Frontend (`frontend/`)

### Commands

```bash
cd frontend
npm run dev       # next dev on port 5173 (Vite-era port, fix in Phase 5)
npm run build     # production build
npm run start     # next start on port 3001
npm run lint      # ESLint
```

No test suite.

**Dev port note**: `:5173` is the actual current Next.js dev port, not just
a stale CORS allowlist entry. It is set in `package.json` scripts. Do not
change it until Phase 5 — a lot of existing config assumes it.

### Environment variables

Single file: `frontend/.env.local`. [VERIFY: run `cat frontend/.env.local`
and list key names only, never values, when Phase 1 scaffolding lands.]
Expected keys at minimum: `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`,
`WS_INTERNAL_SECRET`, and R2 credentials.

### UI architecture

Next.js App Router (`src/app/`). Key areas:

- `src/app/page.jsx` — landing
- `src/app/auth/` — signup, signin
- `src/app/client/` — client dashboard
- `src/app/freelancer/` — freelancer dashboard
- `src/app/components/` — shared UI, organised by domain (`auth/`, `Chat/`,
  `Client/`, `Freelancer/`, `jobs/`, `messages/`, `profile/`, etc.)
- `src/app/conversations/`, `src/app/inbox/`, `src/app/messages/` —
  messaging UI surfaces, talk to `src/app/api/conversations|messages` and
  the ws-server
- `src/app/routes.js` — centralized route paths
- `src/svgIcons/` — inline SVG components
- `src/hooks/` — `useClickOutside.js`, `useEscapeKey.js`
- `src/app/hooks/useMessages.ts` — messaging hook, mirrored at
  `src/hooks/useMessages.ts` (duplication resolved in Phase 3)

### Two `lib/` directories — do not confuse

- `src/app/lib/` (JavaScript) — Axios client code for the legacy Express
  backend. `api.js` plus per-domain modules (`auth/`, `freelancer/`,
  `jobs/`). Deleted domain by domain as Express routes are ported.
- `src/lib/` (TypeScript) — shared server-side logic for Next.js API
  routes. `assertions.ts`, `auth.ts`, `contracts.ts`, `db.ts`. New
  server-side code goes here.

### State management

`src/app/store/` — Zustand with `persist` middleware (localStorage).
Stores: `userStore.js`, `jobStore.js`, `freelancerStore/`,
`freelancerApiStore.js`, `LoadingStore.js`, `toastStore.js`.

### Auth

JWT decoded client-side via `jwt-decode`, stored in localStorage and
cookies. Root middleware redirects unauthenticated users away from
`/client` and `/freelancer`. No refresh tokens. Same `JWT_SECRET` used by
ws-server to verify connection tokens issued from `src/app/api/ws-token`.

The JWT payload has a legacy triple-fallback shape (userId-as-object,
userId-as-number, top-level id). Collapse to a single canonical shape in
Phase 3, not now.

### UI libraries

MUI v7, Tailwind, Flowbite React, React Hook Form, React Toastify,
SweetAlert2, react-datepicker, flatpickr.

### Backend code currently in the frontend (migration scope)

All of these are committed on `origin/development` as of Phase 0 cleanup:

- `src/app/api/contracts/` — contract CRUD, sign, decline, cancel,
  revisions, approve-revision
- `src/app/api/conversations/[id]/` — messages, read, stream (SSE)
- `src/app/api/messages/` — message CRUD
- `src/app/api/proposals/` — proposals
- `src/app/api/jobs/[jobId]/proposals/` — job-scoped proposals
- `src/app/api/inbox/` — inbox listing
- `src/app/api/upload/presign/` — R2 presigned upload URLs
- `src/app/api/ws-token/` — short-lived tokens for ws-server
- `migrations/001_messaging_v2.sql`, `migrations/002_contracts.sql` — raw
  SQL, replaced by Drizzle in Phase 2+
- `scripts/migrate.ts` — runner for the raw SQL migrations

Known debts to fix in Phase 3 (record, do not fix early):

- `src/app/api/contracts/route.ts` has 6 unwrapped DB writes — wrap in
  `db.transaction()` per the Phase 1 transaction rule
- `broadcastContract` errors in the same file are silently swallowed —
  add structured error logging per the broadcast rule

## Legacy Backend (`backend/`) — FROZEN

Reference only. No new code. See freeze rules above.

### Commands

```bash
cd backend
npm run dev          # nodemon, port 4000
npm run db:migrate   # Sequelize migrations
npm run db:seed      # seed lookup data
npm run db:reset     # undo, migrate, seed
npm run setup:dev    # install + migrate + seed + dev
```

Copy `.env.example` to `.env` before first run. No real test suite.

### Environment variables

Keys (values not listed): `DATABASE_URL`, `PORT`, `JWT_SECRET`,
`JWT_EXPIRES_IN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `BREVO_API_KEY`,
`RUN_SEEDS`.

### Architecture

Entry: `server.js`. Express + helmet + cors + morgan + json. Runs
auto-migrations (dev/test), upserts admin user, inits project options on
startup.

Request flow: `routes/` → `controllers/` → `services/` → `models/` (Sequelize).

| Prefix | Purpose |
|---|---|
| `/api/auth/` | signup, login, email verification (6-digit, 10 min), password reset |
| `/api/jobs/` | job CRUD, status |
| `/api/freelancer/` | freelancer profile |
| `/api/proposals/` | submit, list, accept, reject |
| `/api/orders/` | direct orders |
| `/api/skills/` | skills |
| `/api/lookup/` | reference data |
| `/uploads/` | static file serving (local disk, will not survive Vercel) |

**Response shape** (preserve during porting):

```json
{ "success": true, "message": "...", "data": { ... } }
```

**Data model**:
User → Role (admin/client/freelancer)
User → FreelancerProfile → [Education, Experience, Language, Skill, Portfolio]
User → Job → Proposal → Order

**Middleware**: `auth.js` (authenticateToken, optionalAuth),
`requireRole.js`, `adminOrFreelancer.js`, `sanitizeUser.js`,
`validateFreelancerProfile.js`.

**Validators**: `express-validator` per domain. Port to Zod in the unified
app.

**Services**: business logic between controllers and models. Preserve
business rules verbatim when porting — they encode product decisions.

**Response messages**: `backend/commonMessages/`. Use constants, not inline
strings. Moved into unified app during porting.

**Utilities**: `emailService.js` (Brevo, console fallback),
`utils/uploads/` (Multer — will not survive Vercel, replaced by R2 in
Phase 1), `rateLimiter.js`, `logger.js` (Winston), `helpers.js`
(hashPassword, comparePassword, generateToken), `createAdmin.js`,
`constants/lookupData.js`.

**Auth**: passwords require 8+ chars with uppercase, lowercase, number,
special char. JWT contains `userId` or `id`, 7 day expiry.

**Database**: Postgres (Neon) via Sequelize. Dev/test auto-runs pending
migrations. `RUN_SEEDS=true` triggers seeders. SSL enabled in all envs.

**CORS**: allows `localhost:3000`, `localhost:5173`, `venejob.com`, and
`*.vercel.app` previews. Credentials enabled.

## WebSocket Server (`ws-server/`)

Standalone TypeScript WS server. Hybrid HTTP + WS on port 4001. Own
`package.json`, `tsconfig.json`, `db/queries.ts`. Connects to the same Neon
Postgres as the main app.

### Environment variables

[VERIFY: confirm key names from `ws-server/.env.example`.] Expected:
`DATABASE_URL`, `JWT_SECRET` (must equal frontend's), `WS_INTERNAL_SECRET`
(shared with frontend for internal broadcast HTTP calls).

### Auth flow

1. Authenticated user hits `frontend/src/app/api/ws-token` for a short-lived
   token
2. Client opens WS connection with the token
3. ws-server verifies using shared `JWT_SECRET`

### Internal broadcast

Next.js routes fan out real-time events by POSTing to ws-server's
`/internal/broadcast` endpoint, authenticated with `WS_INTERNAL_SECRET`.
Broadcast happens after DB commits, never inside a transaction. Broadcast
failures are best-effort but must be logged, never silently swallowed.

### Migration role

Stays as a separate service post-migration. WebSockets do not belong in
Next.js route handlers on Vercel. Schema sharing between frontend and
ws-server is a Phase 4 decision (workspace package vs synced file).