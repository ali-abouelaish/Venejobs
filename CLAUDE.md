# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## ⚠️ Migration Freeze (Active — read before doing anything)

This project is mid-migration from a 3-service architecture to a unified
Next.js app + standalone WebSocket server (Path B). Until the migration is
complete, the following rules are STRICT.

### Actual current structure (what's on disk)

- `backend/` — Express + Sequelize REST API. **FROZEN.** Maintenance only.
  No new routes, controllers, models, migrations, services, or validators.
  This entire folder will be deleted at the end of the migration.
- `frontend/` — Next.js 15 app (App Router). Contains both the UI and a
  partial set of API route handlers under `src/app/api/` (contracts,
  conversations, messages, proposals, ws-token, upload/presign). Will become
  the single unified app.
- `frontend/src/app/api/` — **FROZEN** for new routes until Phase 1 is
  complete (ORM choice + folder conventions). Existing routes can be
  bug-fixed but not extended.
- `frontend/migrations/` — Raw SQL migrations for messaging and contracts
  (`001_messaging_v2.sql`, `002_contracts.sql`). **FROZEN.** The chosen ORM
  will own migrations going forward.
- `frontend/src/lib/` — Shared backend logic for the Next.js side:
  `assertions.ts` (assertAccess helper), `auth.ts`, `contracts.ts`, `db.ts`.
  This is where new shared logic will live once Phase 1 establishes
  conventions.
- `ws-server/` — Standalone TypeScript WebSocket server. **ACTIVE.** Safe
  to modify, but schema/auth changes must stay compatible with the upcoming
  unified schema and the shared `JWT_SECRET`.

### Deleted / do not recreate

- `frontend/Venejobs/` — Dead nested Next.js prototype with its own git
  repo, removed in Phase 0. Likely the origin of the stray `localhost:5173`
  CORS entry in the legacy backend (a Vite-era artifact). If references to
  it appear in old commits, search results, or backups, they are stale.
  **Do not restore.**

### If asked to add a feature touching frozen areas

Stop and tell the user the area is frozen for migration. Do not work around
the freeze by adding the feature in a different frozen location. Do not
"temporarily" add it to `backend/` with a plan to port later — that defeats
the freeze. The correct response is to confirm with the user whether the
migration step that unblocks this work should happen first.

### Migration plan

See `MIGRATION.md` for the full Phase 0–5 plan. Do not start a new phase
without confirming with the user.

---

## Frontend (`frontend/`) — the future unified app

### Commands

```bash
cd frontend
npm run dev       # Start dev server [VERIFY port — run once and update]
npm run build     # Production build
npm run start     # Production server
npm run lint      # Run ESLint
```

No test suite exists in the frontend.

### Environment Variables

Single file: `frontend/.env.local`. Currently includes at least:
NEXT_PUBLIC_API_URL=http://localhost:4000/api    # points at legacy Express backend
DATABASE_URL=postgresql://...                     # Neon, used by frontend's own API routes
JWT_SECRET=...                                    # shared with ws-server

[VERIFY: open `frontend/.env.local` and list the actual keys here. Do not
commit the values, just the key names.]

### UI architecture

Uses Next.js App Router (`src/app/` directory). Key UI areas:

- `src/app/page.jsx` — Landing page
- `src/app/auth/` — Signup/signin pages
- `src/app/client/` — Client dashboard routes
- `src/app/freelancer/` — Freelancer dashboard routes
- `src/app/components/` — Shared UI components (large tree, organised by
  domain: `auth/`, `Chat/`, `Client/`, `Freelancer/`, `jobs/`, `messages/`,
  `profile/`, etc.)
- `src/app/conversations/`, `src/app/inbox/`, `src/app/messages/` — Messaging
  UI surfaces (talk to both `src/app/api/conversations|messages` and the
  ws-server)
- `src/app/routes.js` — Centralized route path definitions
- `src/svgIcons/` — Inline SVG components
- `src/hooks/` — `useClickOutside.js`, `useEscapeKey.js`
- `src/app/hooks/useMessages.ts` — Messaging hook (also mirrored at
  `src/hooks/useMessages.ts` — duplication to be resolved during migration)

### Two parallel `lib/` directories — important

There are **two** `lib/` folders in the frontend, and they serve different
purposes. Do not confuse them:

- `src/app/lib/` (JavaScript) — **API client code** for talking to the
  legacy Express backend. Contains `api.js` (Axios instance with JWT
  interceptor) and per-domain modules in `auth/`, `freelancer/`, `jobs/`.
  Will be deleted as each domain is ported off Express.
- `src/lib/` (TypeScript) — **Shared backend logic** for the Next.js API
  routes. Contains `assertions.ts`, `auth.ts`, `contracts.ts`, `db.ts`.
  This is the *new* location for shared server-side code.

### State management

`src/app/store/` — Zustand stores with `persist` middleware
(localStorage-backed). Key stores: `userStore.js` (auth/profile),
`jobStore.js`, `freelancerStore/` (multi-step form state),
`freelancerApiStore.js`, `LoadingStore.js`, `toastStore.js`.

### Auth

JWT decoded client-side via `jwt-decode`, stored in localStorage and
cookies. Root middleware redirects unauthenticated users away from
`/client` and `/freelancer` routes. No refresh token mechanism. The same
`JWT_SECRET` is used by the ws-server to verify connection tokens issued
from `src/app/api/ws-token`.

### UI libraries

MUI v7, Tailwind CSS, Flowbite React, React Hook Form, React Toastify,
SweetAlert2, react-datepicker/flatpickr.

### Backend code currently living in the frontend (migration scope)

These exist inside `frontend/` but are backend concerns. They will either
stay (Next.js route handlers, the new home) or be consolidated with ported
Express code:

- `src/app/api/contracts/` — Contract CRUD, sign, decline, cancel,
  revisions, approve-revision
- `src/app/api/conversations/[id]/` — Messages, read, stream (SSE)
- `src/app/api/messages/` — Message CRUD
- `src/app/api/proposals/` — Proposals
- `src/app/api/jobs/[jobId]/proposals/` — Job-scoped proposals
- `src/app/api/inbox/` — Inbox listing
- `src/app/api/upload/presign/` — Presigned upload URLs (object storage —
  decision pending in Phase 1: R2 vs UploadThing vs S3)
- `src/app/api/ws-token/` — Issues short-lived tokens for ws-server
- `src/app/api/set-token/` — Auth cookie helper
- `migrations/001_messaging_v2.sql`, `migrations/002_contracts.sql` — Raw
  SQL for the above. Will be replaced by ORM-managed migrations.
- `scripts/migrate.ts` — Runner for the raw SQL migrations above.

---

## Legacy Backend (`backend/`) — FROZEN, being migrated away from

The following describes the Express backend as it exists today. It is
accurate as a reference for porting work, but **no new code should be added
here**. See the freeze rules at the top of this file.

### Commands

```bash
cd backend
npm run dev          # Start dev server with nodemon (port 4000)
npm run db:migrate   # Run pending Sequelize migrations
npm run db:seed      # Seed lookup data
npm run db:reset     # Full reset: undo all migrations, re-migrate, re-seed
npm run setup:dev    # Install + migrate + seed + start dev server
```

Copy `.env.example` to `.env` before first run. No real test suite
(`npm test` just starts the server in test mode).

### Environment Variables
DATABASE_URL=postgresql://...
PORT=4000
JWT_SECRET=...                   # must match frontend + ws-server
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@venejob.com
ADMIN_PASSWORD=Admin@123
BREVO_API_KEY=...                # email service; falls back to console in dev
RUN_SEEDS=true                   # controls whether seeders run on startup

### Architecture

**Entry point**: `server.js` — sets up Express middleware (helmet, cors,
morgan, json parsing), mounts routes, runs auto-migrations (dev/test only),
upserts the admin user, and initializes project options on every startup.

**Request flow**: `routes/` → `controllers/` → `services/` (business
logic) → `models/` (Sequelize ORM)

**API routes**:

| Prefix | Purpose |
|--------|---------|
| `/api/auth/` | Signup, login, email verification (6-digit code, 10 min expiry), password reset |
| `/api/jobs/` | Job CRUD, status management |
| `/api/freelancer/` | Freelancer profile management |
| `/api/proposals/` | Proposal submit, list, accept/reject |
| `/api/orders/` | Direct orders |
| `/api/skills/` | Skills |
| `/api/lookup/` | Reference data (categories, budget types, project sizes, etc.) |
| `/uploads/` | Static file serving for uploaded files (local disk — will not survive migration to Vercel) |

**API response shape** — all responses use:

```json
{ "success": true, "message": "...", "data": { ... } }
```

The unified app should preserve this shape during porting to avoid frontend
churn.

**Data model hierarchy**:
User → Role (admin/client/freelancer)
User → FreelancerProfile → [Education, Experience, Language, Skill, Portfolio]
User → Job (client posts jobs)
Job → Proposal → Order

**Middleware** (`backend/middleware/`):

- `auth.js` — `authenticateToken` (required) and `optionalAuth` JWT verification
- `requireRole.js` — Factory middleware for role-based access control
- `adminOrFreelancer.js` — Allows admin or freelancer roles
- `sanitizeUser.js` — Strips sensitive fields from responses
- `validateFreelancerProfile.js` — Profile validation

**Validators** (`backend/validators/`): Uses `express-validator`. Rules
defined per domain (`auth.validator.js`, `job.validator.js`,
`freelancerProfile.validator.js`), applied as middleware arrays in routes.
`validationResultHandler.js` converts validation errors to consistent 400
responses. **Porting note:** these will become Zod schemas in the unified
app.

**Services** (`backend/services/`): Business logic between controllers and
models. Each domain has a service (e.g., `job.service.js` enforces
budget/size/duration combos; `proposal.service.js` enforces
one-proposal-per-freelancer-per-job). **Porting note:** preserve the
business rules verbatim — they encode product decisions, not just data
access.

**Response messages** (`backend/commonMessages/`): Centralized string
constants. Always use these rather than inline strings — they will be moved
into the unified app as part of porting.

**Utilities**:

- `utils/emailService.js` — Brevo (Sendinblue) API; logs to console in dev
  when `BREVO_API_KEY` is not set
- `utils/uploads/` — Multer config for profile pictures and job
  attachments. **Will not survive the migration** — Vercel has a read-only
  filesystem. Phase 1 picks the object-storage replacement.
- `utils/rateLimiter.js` — Rate limiting
- `utils/logger.js` — Winston logger
- `utils/helpers.js` — `hashPassword`, `comparePassword`, `generateToken`
- `utils/createAdmin.js` — Upserts admin user on every startup
- `constants/lookupData.js` — Hardcoded lookup values used by seeders

**Auth details**:

- Password requirements: 8+ chars, uppercase, lowercase, number, special character
- JWT payload contains `userId` (or `id`), expires in 7 days

**Database**: PostgreSQL (Neon) via Sequelize. Migrations in
`backend/migrations/`, seeders in `backend/seeders/`. Dev/test environments
auto-run pending migrations on startup. `RUN_SEEDS=true` triggers seeder
execution. SSL is enabled in all environments (configured in
`config/config.js`).

**CORS**: Allows `localhost:3000`, `localhost:5173`, `venejob.com` domains,
and all `*.vercel.app` preview URLs. Credentials enabled. The `5173` entry
is a leftover from a previous Vite-based frontend (the now-deleted
`frontend/Venejobs/` prototype) and can be removed once that is confirmed
unreferenced.

---

## WebSocket Server (`ws-server/`)

Standalone TypeScript WebSocket server. Handles real-time messaging.
Originally planned as SSE through Next.js route handlers, but implemented
as a separate WS service. Has its own `package.json`, `tsconfig.json`, and
`db/queries.ts`. Connects to the same Postgres database as the main app.

### Environment Variables

`ws-server/.env.example` lists the expected keys. At minimum:
DATABASE_URL=postgresql://...    # same Neon DB as the main app
JWT_SECRET=...                   # MUST match frontend + backend

[VERIFY: open `ws-server/.env.example` and confirm exact key names.]

### Auth flow

1. Authenticated user calls `frontend/src/app/api/ws-token` to get a
   short-lived token.
2. Client opens a WebSocket connection presenting the token.
3. ws-server verifies the JWT using the shared `JWT_SECRET`.

### Migration role

Stays as a separate service post-migration. WebSockets do not belong in
Next.js route handlers on Vercel. Will eventually share the unified ORM
schema with the main app, either via a workspace package or a synced file
— decision deferred to Phase 4 of the migration.

---

## Phase 1 decisions still pending

These will be resolved before any porting work begins. Until they are,
treat any answer to "which ORM / which storage / which auth library" as
unanswered:

- **ORM**: TBD (likely Drizzle, but not committed)
- **Object storage**: TBD (R2 / UploadThing / S3)
- **Auth approach**: keeping custom JWT (not switching to Auth.js / Lucia
  mid-migration)

When any of these are decided, update this file in the same commit.