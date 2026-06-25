# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Repo layout

`D:\Venejobs\` is the monorepo. Single git repo, single remote
`https://github.com/ali-abouelaish/Venejobs.git`, default branch `main`.
No git submodules — `frontend/` was absorbed long ago.

npm workspaces (root `package.json`):

- `frontend/` — Next.js 16 App Router. UI **and** the bulk of the API
  surface (Drizzle-backed). This is where new server code lives.
- `backend/` — Express 5 + Sequelize. Still serves auth, jobs, proposals,
  orders, lookups, and freelancer-profile CRUD for the React client. Not
  frozen — still receives bug fixes — but new features go in the Next.js
  app.
- `ws-server/` — Standalone TypeScript WebSocket relay.

Commits go in this single repo. `git` from the root handles everything;
do not `cd` into a workspace to commit.

```bash
npm install   # installs all three workspaces
npm run dev   # concurrently runs frontend + backend + ws-server
```

Companion docs:

- `PROJECT_NOTES.md` — **start here.** Living-context doc: current state,
  load-bearing invariants, verified drift from this file, and open
  questions. Confidence-graded and dated; keep it updated.
- `README.md` — first-time setup and env var template.
- `MIGRATION.md` — Drizzle ↔ Sequelize ownership boundary and the
  rules for generating migrations.
- `SERVICES_HANDOFF.md` — Services-marketplace (Fiverr-style) feature
  reference: state machine, endpoints, Stripe flow, test quirks.

## Services and how to start them

| Service   | Port  | Start (from root)                | Notes |
|-----------|-------|----------------------------------|---------|
| frontend  | 5173  | `npm -w frontend run dev`        | `next dev -p 5173` |
| backend   | 4000  | `npm -w backend run dev`         | `nodemon server.js`; auto-runs Sequelize migrations in `NODE_ENV=development` |
| ws-server | 4002  | `npm -w ws-server run dev`       | Public WebSocket port |
| ws internal | 4001 | (same as ws-server)             | HTTP server for internal broadcast + presence; not user-facing |

Or all three at once: `npm run dev` from the root.

Production build for frontend: `npm -w frontend run build` then
`npm -w frontend run start` (binds to 3001).

## Frontend (`frontend/`)

Next.js 16.0.7, React 19, App Router, Tailwind 4, MUI 7, Zustand, Stripe
JS/React, Drizzle ORM 0.45, postgres.js, AWS S3 SDK (for R2), zod,
jsonwebtoken, bcryptjs.

### Commands

```bash
npm -w frontend run dev          # next dev -p 5173
npm -w frontend run build        # next build
npm -w frontend run start        # next start -p 3001
npm -w frontend run lint         # ESLint
npm -w frontend run db:generate  # drizzle-kit generate (needs TTY)
npm -w frontend run db:migrate   # apply migrations (scripts/db-migrate.ts)
npm -w frontend run db:studio    # drizzle-kit studio
```

**E2E test suite** at `scripts/e2e/` (root-level, not inside a workspace):
- `run-all.mjs` — sequential runner; reads `frontend/.env.local`
- `01_auth` → `07_uploads` — covers auth, freelancer profile, jobs, proposals, messaging, contracts, uploads
- `check-migrations.mjs` — verifies migration state
- Run: `node --env-file=frontend/.env.local scripts/e2e/run-all.mjs`

### Environment variables (`frontend/.env.local`)

Required:
- `DATABASE_URL` — Postgres (Neon), `sslmode=require`
- `JWT_SECRET` — must match `backend/.env` and `ws-server/.env`
- `WS_SECRET` — must match `ws-server/.env`
- `WS_INTERNAL_SECRET` — must match `ws-server/.env`
- `WS_INTERNAL_URL` — e.g. `http://localhost:4001`
- `NEXT_PUBLIC_BASE_URL` — e.g. `http://localhost:4000`
- `NEXT_PUBLIC_WS_URL` — e.g. `ws://localhost:4002`
- R2: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
  `R2_BUCKET`, `R2_PUBLIC_URL`
- Stripe: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
  `STRIPE_WEBHOOK_SECRET`
- `CRON_SECRET` — header value `/api/cron/*` checks

### App Router layout (`src/app/`)

Pages:
- `page.jsx` — landing
- `auth/{signin,signup,forgot-password}/`
- `client/` — client dashboard: `jobpost`, `freelancerList`, `FreelancerProfile`,
  `HireFreelancer`, `HireFreelancer/[userId]` (dynamic — needed for "Hire me" links),
  `HirePayment`, `InviteTalent`, `JobDetail`, `Service`,
  `ServiceDetail`, `orders`, `chat`, `billingMethod`
- `freelancer/` — freelancer dashboard: `home`, `jobSearch`, `JobDetail`,
  `AllContract`, `profileData`, `addProfileDetails`, `AddService`,
  `services`, `orders`, `onboarding`, `finances`, `chat`,
  `profile/edit` (single-page profile editor, replaces the old multi-step flow)
- `services/` (public browse) + `services/[id]`
- `services-ui/` — shared services UI components, lib, theme tokens
- `contracts/[contractId]` — contract detail
- `orders/[id]` — service-order detail (used by both participants)
- `admin/` — `services`, `disputes`, `disputes/[id]`, `contract-disputes`,
  `contract-disputes/[id]`, `users`, `finances`, `orders`, `accept-invite`.
  `disputes/[id]` and `contract-disputes/[id]` include a `DisputeChat` panel
  for admin ↔ participant messaging.
- `conversations/`, `inbox/`, `messages/` — chat surfaces
- `profile/`, `about/`

Shared UI: `src/app/components/` (organised by domain — `auth/`, `Chat/`,
`Client/`, `Freelancer/`, `Header/`, `Footer/`, `home/`, `jobs/`,
`messages/`, `navbar/`, `profile/`, `reviews/`, `Skeletons/`, etc.).
Admin-only shared component: `src/app/admin/_components/DisputeChat.tsx`
(real-time admin ↔ participant chat, reused by both dispute detail pages).
Layouts in `src/app/layout/` (`ClientLayout.jsx`, `FreelancerLayout.jsx`,
`ClientProfileLayout.jsx`, `FreelanceProfileLayout.jsx`). Routes table
centralised in `src/app/routes.js`.

Stores in `src/app/store/` (Zustand + `persist` middleware):
`userStore.js`, `jobStore.js`, `freelancerStore/`, `freelancerApiStore.js`,
`LoadingStore.js`, `toastStore.js`.

Hooks: `src/app/hooks/useMessages.ts` and `src/hooks/`
(`useClickOutside.js`, `useEscapeKey.js`, `useMessages.ts`).

### Two `lib/` directories — keep straight

- `src/app/lib/` (JavaScript) — Axios clients for the legacy Express
  backend. `api.js` plus `auth/`, `freelancer/`, `jobs/`, `search/`.
  Replaced piecewise as routes move into the Next app.
- `src/lib/` (TypeScript) — server-side helpers used by Next.js route
  handlers. New backend code goes here.

`src/lib/` modules:

| File / dir | Purpose |
|---|---|
| `db/index.ts` | postgres.js clients: `sql` (pooled) and `listenSql` (single, for LISTEN/NOTIFY) |
| `db/drizzle.ts` | Drizzle `db` instance, merges all schema modules |
| `db/schema.ts` | Legacy mirror — Sequelize-owned tables in Drizzle form |
| `db/schema/{stripe,services,reviews,contracts,adminInvites}.ts` | Drizzle-owned tables, one module per feature |
| `db/relations.ts` | Drizzle relations |
| `db/drizzle-migrations/*.sql` + `meta/` | Migration history (0000–0011) |
| `auth.ts` | `auth()` reads `token` cookie, verifies with `JWT_SECRET`, returns `{ user: { id, name, email } } \| null`. Blocks suspended users. Tolerates the legacy triple-shape JWT payload. |
| `assertions.ts` | Per-resource access checks: `assertConversationAccess`, `assertJobOwnership`, `assertProposalClientAccess`, `assertServiceAccess`, `assertServiceOrderAccess`, `assertServiceOrderParticipant`, `assertAdminAccess` |
| `stripe.ts` | Configured `Stripe` client |
| `connect.ts` | Stripe Connect onboarding helpers (`getOrCreateConnectAccount`, `syncConnectAccount`, `assertConnectReady`) |
| `orders.ts` | Service-order state machine: `transitionServiceOrder`, `VALID_TRANSITIONS`, `InvalidTransitionError` |
| `transfers.ts` | `createTransferForOrder`, `createSplitTransferForOrder`, `computeOrderPayout`, `TransferError` |
| `refunds.ts` | `refundFullOrder`, `refundPartialOrder`, `RefundError` |
| `proposals.ts` | Proposal helpers |
| `contracts.ts` | Contract helpers (creation, sign, decline, revisions) |
| `ws.ts` | Internal-broadcast HTTP helper (POSTs to ws-server `/internal/broadcast`) |
| `webhooks/stripe.ts` | Per-event handlers dispatched by `/api/webhooks/stripe` |
| `email/{client,notifications,presence,recipients,templates}.ts` | Email notifications (with presence-aware skip) |
| `config/fees.ts` | `PLATFORM_FEE_PCT = 10.00` — single source of truth |

### Auth

JWT issued by the Express backend (login/signup), stored in the `token`
cookie (and localStorage on the client). The Next.js `auth()` helper and
the ws-server both verify with the same `JWT_SECRET`. No refresh tokens;
7-day expiry. The JWT payload has a legacy triple-fallback shape
(`userId` as object, `userId` as number, top-level `id`) — `auth.ts`
already handles all three; keep that behaviour when touching it.

Suspension: `users.suspended_at IS NOT NULL` blocks `auth()` from
returning a session.

### Next.js API surface (`src/app/api/`)

| Path | Notes |
|---|---|
| `auth/*` | (Express still owns login/signup; no /api/auth here yet) |
| `users/me/avatar`, `users/me/profile`, `users/[id]/reviews` | User-facing reads/writes; `me/profile` is GET+PUT for client profile (avatar + DOB + address) |
| `freelancer/profile` | GET+PUT authenticated freelancer profile (Drizzle, transactional, zod-validated). Replaces Express `/api/freelancer/` save. |
| `freelancer/[userId]/profile` | Public GET — mirrors the Express shape for the client-side profile view |
| `jobs/[jobId]/proposals` | Job-scoped proposals |
| `proposals/`, `proposals/mine`, `proposals/[id]/{accept,decline}` | Proposal CRUD. On POST, cover letter is seeded as the freelancer's first message in the conversation. |
| `conversations/direct`, `conversations/[id]/{messages,read}`, `conversations/[id]/messages/[messageId]` | Messaging. GET messages now returns `conversation: { id, proposal_id, freelancer_id, client_id }` metadata. POST enforces a one-message gate for freelancers in proposal-bound chats until the client replies (`code: 'FREELANCER_AWAITING_CLIENT'`, 403). |
| `inbox/` | Inbox listing |
| `contracts/`, `contracts/my`, `contracts/[contractId]/{sign,decline,cancel,submit,deliver,accept,dispute,request-revision,checkout,revisions}` | Contracts + contract-order flow |
| `contracts/[contractId]/dispute` | File a dispute with optional evidence attachments (same `{ r2Key, filename, size, mime }[]` shape as deliveries) |
| `contracts/[contractId]/dispute-attachments` | Presign / upload evidence files for an open contract dispute |
| `services/`, `services/mine`, `services/[id]/{addons,submit-for-review}` | Services marketplace |
| `service-orders/checkout`, `service-orders/{incoming,outgoing}`, `service-orders/[id]/{accept,deliver,cancel,dispute,request-revision,buy-revisions,attachments,reviews}` | Service-order lifecycle. `dispute` now accepts evidence attachments. |
| `connect/{account,onboarding-link,dashboard-link,status}` | Stripe Connect for freelancers |
| `webhooks/stripe` | Stripe webhook (signature + dedupe via `stripe_events`) |
| `cron/auto-accept` | Auto-accept past-deadline orders. Requires `x-cron-secret: $CRON_SECRET` |
| `upload/presign` | R2 presigned upload URLs |
| `download/` | Authenticated R2 downloads |
| `finances/{summary,activity,stripe}` | Earnings/transactions for the freelancer dashboard |
| `ws-token/` | Issues short-lived WS tokens signed with `JWT_SECRET` |
| `set-token/` | Cookie writer (used by backend login redirect) |
| `admin/{users,services,service-orders,contract-orders,disputes,contract-disputes,finances,overview,invites,orders}` | Admin panel API, gated by `assertAdminAccess` |
| `admin/disputes/[id]`, `admin/disputes/[id]/messages` | Per-dispute detail and admin↔participant messaging for service-order disputes |
| `admin/contract-disputes/[id]`, `admin/contract-disputes/[id]/messages` | Same for contract-order disputes |

State-machine note: every transition of `service_orders.state` must go
through `transitionServiceOrder()` in `lib/orders.ts` (atomic
compare-and-swap on `state`). Never write raw `UPDATE service_orders
SET state = ...`. See `SERVICES_HANDOFF.md` for the full state diagram.

Error shape on the new (Drizzle-era) routes:
`{ error: "...", code?: "..." }` with the appropriate HTTP status.
`code` is only present where the frontend needs to programmatically
detect a case (e.g. `code: 'revisions_exhausted'` → 402).

Legacy backend response shape (preserve when porting Express routes):
`{ success: true, message: "...", data: { ... } }`.

## Backend (`backend/`) — Express + Sequelize

Still serves auth, lookups, jobs, proposals, orders, freelancer profile
CRUD, and skills. Active, not frozen.

### Commands

```bash
npm -w backend run dev          # nodemon, port 4000
npm -w backend run db:migrate   # Sequelize migrations
npm -w backend run db:seed      # seed lookup data
npm -w backend run db:reset     # undo, migrate, seed
npm -w backend run setup:dev    # install + migrate + seed + dev
```

### Environment variables (`backend/.env`)

`DATABASE_URL`, `PORT` (4000), `JWT_SECRET`, `JWT_EXPIRES_IN`,
`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `BREVO_API_KEY`, `RUN_SEEDS`.

### Architecture

Entry: `server.js`. Express 5 + helmet + cors + morgan + json. In
`NODE_ENV=development` and `test`, auto-runs `sequelize-cli db:migrate`
on startup. Always upserts the admin user via `utils/createAdmin.js`
and seeds project options via `utils/initializeProjectOptions.js`.

CORS allowlist: `localhost:3000`, `localhost:5173`, `venejob.com`,
`www.venejob.com`, `app.venejob.com`, plus `*.vercel.app` previews.

Request flow: `routes/` → `controllers/` → `services/` → `models/`
(Sequelize). Validators in `validators/` using `express-validator`.
Middleware in `middleware/` (`auth.js`, `requireRole.js`,
`adminOrFreelancer.js`, `sanitizeUser.js`, `validateFreelancerProfile.js`).
Common response strings in `commonMessages/`.

Mounted route prefixes:

| Prefix | Source | Purpose |
|---|---|---|
| `/api/auth/` | `routes/authRoutes.js` | signup, login, email verification (6-digit, 10 min), password reset |
| `/api/jobs/` | `routes/job.routes.js` | job CRUD, status. Both `getAllJobs` and `getJobsByUser` filter `is_active: true` — deactivated postings are excluded from listings. |
| `/api/lookup/` | `routes/lookup.routes.js` | reference data |
| `/api/lookup/project-options` | `routes/projectOptions.routes.js` | project sizes/durations/experience levels |
| `/api/lookup/budget-types` | `routes/budget_types.routes.js` | budget types |
| `/api/freelancer/` | `routes/freelancer.routes.js` | freelancer profile + nested education/experience/etc. |
| `/api/skills/` | `routes/skill.routes.js` | skills |
| `/api/proposals/` | `routes/proposal.routes.js` | submit, list, accept, reject |
| `/api/orders/` | `routes/order.routes.js` | direct orders |
| `/uploads/` | static | local-disk uploads (legacy, R2 is the new path) |

Sequelize models in `models/`: `user`, `role`, `job`, `proposal`,
`order`, `freelancerProfile`, `freelancerEducation`,
`freelancerExperience`, `freelancerLanguage`, `freelancerPortfolio`,
`freelancerSkill`, `category`, `skill`, `budget_types`, `projectSize`,
`duration`, `experienceLevel`.

Auth rules: passwords require 8+ chars with upper, lower, digit, special
char. JWT contains `userId` or `id`, 7-day expiry. The legacy triple
payload shape is handled by `frontend/src/lib/auth.ts` — don't change it
on either side without updating both.

Utilities: `emailService.js` (Brevo with console fallback),
`utils/uploads/` (Multer, local disk), `rateLimiter.js`,
`logger.js` (Winston), `helpers.js` (hashPassword, comparePassword,
generateToken), `createAdmin.js`, `constants/lookupData.js`.

Sequelize is the **source of truth** for the tables listed under
"Sequelize-owned" in `MIGRATION.md`. Drizzle mirrors them descriptively
in `frontend/src/lib/db/schema.ts` so the Next.js app can read them, but
schema changes to those tables go via Sequelize migrations.

## WebSocket server (`ws-server/`)

Standalone TypeScript service. Two HTTP servers:

- **WS, port `WS_PORT` (default 4002)** — public, accepts
  `ws://…?token=<jwt>&conversationId=<uuid>`. Token is verified with
  `WS_SECRET`. Decoded payload must include matching `conversationId`.
- **HTTP, port `WS_INTERNAL_PORT` (default 4001)** — internal only,
  gated by `x-internal-secret: $WS_INTERNAL_SECRET`. Exposes:
  - `POST /internal/broadcast` — `{ conversationId, payload }` →
    fan out to all connections in that room.
  - `GET  /internal/presence?userId=N` → `{ online: boolean }`.

In-process state: `rooms: Map<conversationId, Set<Connection>>` and
`userPresence: Map<userId, refCount>` (a user is "online" iff count > 0,
so multiple tabs are handled correctly).

Inbound client message types: `ping`, `typing_start`, `typing_stop`,
`mark_read` (calls `upsertReads`), `reaction_add` / `reaction_remove`
(call `addReaction` / `removeReaction`, then broadcast updated reactions).

Files: `index.ts`, `db/queries.ts`. `package.json` scripts use `tsx`
with `--env-file=.env`.

### Environment variables (`ws-server/.env`)

`DATABASE_URL`, `WS_SECRET` (matches frontend's `JWT_SECRET`/`WS_SECRET`),
`WS_INTERNAL_SECRET` (matches frontend), `WS_PORT` (4002),
`WS_INTERNAL_PORT` (4001).

### Auth flow

1. Authenticated Next.js client POSTs `/api/ws-token` to get a
   short-lived token signed with `WS_SECRET` carrying `{ userId,
   conversationId }`.
2. Client opens `ws://localhost:4002/?token=…&conversationId=…`.
3. ws-server verifies, enforces conversationId match, joins the room.

### Internal broadcast pattern (called from Next.js routes)

`POST {WS_INTERNAL_URL}/internal/broadcast` with header
`x-internal-secret: $WS_INTERNAL_SECRET` and body
`{ conversationId, payload }`. Always after the DB commit, never inside
a transaction. Broadcast failures are best-effort but must be logged
(structured), never silently swallowed.

Presence lookup (used by email notifications to skip users who are
online): `GET {WS_INTERNAL_URL}/internal/presence?userId=N`.

## Database layer

Two ORMs, one Postgres database (Neon, SSL required). Boundary rules
are in `MIGRATION.md` — read that before changing schema.

- **Sequelize-owned (frozen for Drizzle):** `SequelizeMeta`, `roles`,
  `users`, `budget_types`, `project_sizes`, `durations`,
  `experience_levels`, `freelancer_profiles`, `freelancer_experiences`,
  `freelancer_educations`, `freelancer_languages`,
  `freelancer_portfolios`, `freelancer_skills`, `categories`, `skills`,
  `jobs`, `proposals`, `orders`. ALTERs go via
  `backend/migrations/*.js`. Drizzle mirrors them descriptively in
  `frontend/src/lib/db/schema.ts`.

  Two columns on `users` (`suspended_at`, `suspension_reason`) were
  added by Drizzle migration `0010_furry_vapor.sql` and live alongside
  the Sequelize-owned columns. Treat `users` as Sequelize-owned for
  schema purposes; Drizzle's mirror is kept in sync.

- **Drizzle-owned:** messaging (`conversations`, `messages`,
  `message_attachments`, `message_reactions`, `message_reads`),
  contracts (`contracts`, `contract_revisions`, `contract_signatures`),
  contract orders (`contract_orders`, `contract_order_disputes`),
  services marketplace (`services`, `service_addons`, `service_orders`,
  `service_order_addons`, `service_order_deliveries`,
  `service_order_revisions`, `service_order_disputes`), Stripe
  (`stripe_connect_accounts`, `stripe_events`), `reviews`,
  `admin_invites`.

Schema layout in `frontend/src/lib/db/`:

- `schema.ts` — Sequelize-mirror **plus** the older messaging/contracts
  tables. Do not split.
- `schema/stripe.ts` — `stripe_connect_accounts`, `stripe_events`.
- `schema/services.ts` — 7 services-marketplace tables (includes `attachments jsonb` on `service_order_disputes`).
- `schema/contracts.ts` — `contract_orders`, `contract_order_disputes` (includes `attachments jsonb`).
- `schema/reviews.ts` — `reviews` (polymorphic over contract OR
  service_order via an XOR check).
- `schema/adminInvites.ts` — `admin_invites`.

Foreign-key type rule: `users.id` is `serial` (integer). Any new
Drizzle-owned table that references it must use `integer` for the FK
column. New PKs are `uuid DEFAULT gen_random_uuid()` except where
domain dictates otherwise (`stripe_connect_accounts.user_id` PK because
it's 1:1; `stripe_events.id` is the Stripe event ID string).

Money columns on Drizzle-owned tables are **integers in the smallest
currency unit (pence/cents)**. Never use floats for money. (The legacy
Sequelize tables use `double precision` — historical, do not propagate.)

Service order `state`, `services.status`, `service_orders.resolution`,
and `contract_orders.state` are plain `text` by design (no `pgEnum`, no
`CHECK`) so the app state machine controls valid values without DDL.
The reviews table is the opposite — `reviewer_role`, `status`, and
`rating` are `CHECK`-constrained because their value sets are closed
schema invariants.

### Drizzle commands (run from `frontend/`)

```bash
npm -w frontend run db:generate   # diff schema vs last snapshot
npm -w frontend run db:migrate    # apply pending; tracks in drizzle.__drizzle_migrations
npm -w frontend run db:studio     # browse via drizzle-kit studio
```

`db:generate` needs a TTY (drizzle-kit's rename resolver prompts). In a
non-TTY environment, hand-write the SQL and add the journal entry — see
the "Reconciliation drift" section in `MIGRATION.md` for the
idempotent-guard wrapping pattern that lets generated SQL coexist with
Sequelize-applied state.

Migration history lives in
`frontend/src/lib/db/drizzle-migrations/` (`0000_colorful_marauders.sql`
through `0011_dispute_evidence.sql`) with snapshots in `meta/`.
`0011` adds `attachments jsonb DEFAULT '[]'` to both `service_order_disputes`
and `contract_order_disputes` for evidence files uploaded when a dispute is raised.

### Frontend scripts (`frontend/scripts/`)

- `db-migrate.ts` — runs Drizzle migrations against `DATABASE_URL`.
- `apply-sql.ts` — applies a one-off raw SQL file.
- `migrate.ts` — older raw-SQL runner for `frontend/migrations/*.sql`
  (`001_messaging_v2.sql`, `002_contracts.sql`, `003_drop_read_at.sql`,
  `004_hire_count_and_filled_status.sql`). These have already been
  applied to prod; ownership has since moved to Drizzle.
- `create-admin.ts`, `migrate-avatars-to-r2.ts` — one-off utilities.

## Stripe + Services marketplace

Read `SERVICES_HANDOFF.md` before changing anything Stripe-related.
Headline rules:

- **Separate charges + transfers** Connect model (NOT destination
  charges). Buyer pays the platform; on accept, we `transfers.create`
  the freelancer's cut.
- Idempotency keys on `stripe.transfers.create` and refunds are
  load-bearing for retry safety. The transfer key is salted with
  `accepted_at` ms — do not remove the salt.
- The discriminator `metadata.kind` on Stripe sessions
  (`'service_base'` vs `'service_addon'`) drives webhook dispatch —
  don't change it.
- `PLATFORM_FEE_PCT` lives in `frontend/src/lib/config/fees.ts` and is
  snapshotted onto each order at creation.
- `service_orders.state` transitions: only through
  `transitionServiceOrder()` in `lib/orders.ts`. A stuck `accepted`
  order with a failed transfer requires a manual SQL reset to
  `delivered` — there is no retry endpoint yet.
- `stripe listen --forward-to http://localhost:5173/api/webhooks/stripe`
  must be running during local testing, or `service_orders` rows never
  get created on payment.

The contract-orders flow (signed contract → checkout → deliver → accept
→ transfer) mirrors the services-marketplace flow at the lib/route
level but uses the `contract_orders` and `contract_order_disputes`
tables instead of the services tables.

## Conventions

- New server code goes in `frontend/src/lib/` (TypeScript) and
  `frontend/src/app/api/`. Use Drizzle (`db` from `db/drizzle.ts`) for
  Drizzle-owned tables and the raw `sql` client (`db/index.ts`) for
  cross-cutting reads against Sequelize-owned tables when a Drizzle
  query would be awkward.
- Per-resource access helpers in `src/lib/assertions.ts` — extend
  these rather than inlining ownership SQL in routes.
- Wrap multi-write routes in `db.transaction(...)`; broadcast only
  after commit.
- Use structured logs (`console.error('[contract broadcast]', err)`)
  instead of silent catches.
- Email notifications: import from `src/lib/email/notifications.ts`,
  which already skips presence-online users via the ws-server
  `/internal/presence` endpoint.
- Money in pence (integer) on Drizzle-owned tables. Use the integer
  pence values for all Stripe API calls (Stripe also uses smallest
  unit). Format only at render time.
- Centralise route paths in `frontend/src/app/routes.js` when wiring
  new pages into existing nav. Note: `freelancer.get_started` and
  `freelancer.edit_profile` both resolve to `/freelancer/profile/edit`
  (the old `/freelancer/addProfileDetails` multi-step URL is deprecated).
