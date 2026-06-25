# Venejobs — Project Notes (living context)

> **Read this after `CLAUDE.md`.** `CLAUDE.md` is canonical for architecture and
> conventions; this file is the *living layer* it lacks: current state,
> load-bearing invariants, verified drift, and open questions — so a fresh
> Claude session doesn't relearn the codebase or break what already works.
>
> **Confidence tags used below:**
> `✅ verified` — checked by direct inspection · `📄 per docs` — from project
> docs, not re-verified · `❓ open` — unverified / genuinely unknown.
>
> **Last meaningful update:** 2026-06-25. Keep this lean. If a section goes
> stale, fix or delete it — a wrong note is worse than no note.

---

## How to work safely here

- This is a **live product with real payment flows (Stripe Connect)**. Make the
  smallest change that solves the task; don't refactor working code on a hunch.
- When you're unsure whether something is intentional, **flag it — don't "fix" it.**
  (Confidence-graded honesty is preferred over confident guessing.)
- Before shipping, see **"Verify before shipping"** at the bottom.

## Mental model (one screen)

- Monorepo, npm workspaces, single git repo + single remote
  (`ali-abouelaish/Venejobs`), default branch `main`. Three services: 📄
  - **`frontend/`** — Next.js 16 App Router. **New server code goes here**
    (`src/lib/*.ts` + `src/app/api/`). Dev `:5173`, prod `:3001`. ✅ (ran tooling here)
  - **`backend/`** — Express 5 + Sequelize. Still owns auth/login, jobs,
    proposals, orders, lookups, freelancer-profile CRUD. `:4000`. 📄
  - **`ws-server/`** — WebSocket relay. `:4002` public, `:4001` internal. 📄
- **Two ORMs, one Postgres (Neon).** Sequelize owns the legacy core tables
  (`users`, `jobs`, `proposals`, `orders`, freelancer_*, lookups). Drizzle owns
  messaging, contracts, services marketplace, Stripe, reviews, disputes.
  Boundary rules live in `MIGRATION.md`. 📄

## Load-bearing invariants — break these and you break prod

Pre-flight checklist. Most are also in `CLAUDE.md`; collected here so they're
in one place.

- **Order/contract state changes go ONLY through `transitionServiceOrder()` /
  `transitionContractOrder()`** (atomic compare-and-swap on `state`). Never write
  raw `UPDATE ... SET state`. ✅ (seen in the resolve-dispute routes)
- **Money is integer pence/cents** on every Drizzle-owned table and in every
  Stripe call. The shared `PriceInput` component already emits pence; format to
  dollars only at render. ✅
- **Stripe = separate charges + transfers** (not destination charges).
  Idempotency keys are load-bearing; the transfer key is salted with
  `accepted_at` — don't remove the salt. 📄 (`SERVICES_HANDOFF.md`)
- **Broadcast to ws-server only AFTER the DB commit**, never inside the
  transaction. 📄 ✅
- **JWT has a legacy triple-shape payload**; `frontend/src/lib/auth.ts` already
  tolerates all three forms. Don't change the shape on one side without the other
  (`backend/` issues it, `frontend/` + `ws-server/` verify it). 📄
- **Per-resource access** lives in `frontend/src/lib/assertions.ts`. Extend those
  helpers rather than inlining ownership SQL in routes. ✅

## Current state (2026-06-25)

- **Disputes feature — complete & wired end-to-end.** ✅ (reviewed this session,
  commit `23f5c54` "disputes enhancments")
  - Evidence attachments (`attachments jsonb`) added to both
    `service_order_disputes` and `contract_order_disputes` (migration
    `0011_dispute_evidence`). Raising a dispute now **requires ≥1 evidence file**,
    and both raising UIs (`orders/[id]/page.tsx`, `ContractSidePanel.tsx`) upload
    and send them.
  - Admin case pages: `/admin/disputes/[id]` and `/admin/contract-disputes/[id]`
    — full evidence trail, embedded chat (`admin/_components/DisputeChat.tsx`),
    pay / refund / split resolution.
  - Resolve endpoints (`admin/{service-orders,contract-orders}/[id]/resolve-dispute`)
    do Stripe side-effects *before* the DB state transition, with idempotency, so
    a Stripe failure leaves the order `disputed` for safe retry.
  - **⚠ Open item:** the `assertConversationAccess` change grants admins more than
    read access — see Open Questions.
- **e2e harness exists** under `scripts/e2e/` — 7 suites (auth, freelancer
  profile, jobs, proposals, messaging, contracts, uploads) + `run-all.mjs` +
  `check-migrations.mjs`. `DEBUG_LOG.md` records **114/114 passing on 2026-05-24**.
  ✅ (files exist) / ❓ (not re-run this session)
- **Frontend typecheck baseline:** `cd frontend && npx tsc --noEmit` is clean
  **except 2 known-benign errors** — CSS side-effect imports in
  `services-ui/components/Layouts.tsx` (`tokens.css`, `theme.css`, error TS2882).
  These are not real type errors; don't chase them. ✅

## Deploy readiness (checked 2026-06-25)

**Verified this session:**
- **Frontend `next build` succeeds** end-to-end with env present — every page +
  API route compiles, Next's TS check is fully clean. ✅ (Raw `tsc --noEmit`
  shows 2 benign CSS-import errors, but the *Next build* TS step does not hit them.)
- **ws-server typechecks clean** (`tsc --noEmit`, exit 0). ✅
- **`backend/server.js` parses** (`node --check`). ✅ — shallow: entry-file
  syntax only, not the whole app or its runtime behavior.
- **Build hard-requires env:** `lib/stripe.ts` throws at *import time* if
  `STRIPE_SECRET_KEY` is unset, so `next build` fails at "collect page data"
  with no env. Set all vars from CLAUDE.md in the build/deploy environment.
- **No live public web deployment found (checked 2026-06-25).** The intended
  domains (`venejob.com`, `www.`, `app.`) return **NXDOMAIN** — not in DNS. No
  deploy config in the repo (no `vercel.json` / Dockerfile / CI workflows). The
  app env shared by the owner uses `localhost` URLs (local-dev config). The
  **production Neon DB and R2 bucket ARE live** (managed infra), independent of
  any app deployment. Can't rule out a private deploy URL not referenced in repo
  (couldn't check GitHub deployments — `gh` not installed). ✅

**Not yet verified — gates to a confident "deploy-ready":**
- ❓ **Runtime correctness** — a green build is not a working app. The e2e suite
  (`scripts/e2e/`) is the real gate; last known-good 2026-05-24, *before* the
  disputes changes. Re-run it against a live stack.
- ❓ **Is migration `0011_dispute_evidence` applied to the prod DB?** The disputes
  feature reads/writes the new `attachments` column; if it's missing, dispute
  create/query breaks in prod.
- ❓ Env configured on the actual deploy target.
- ⚠ **Stray lockfile:** both `package-lock.json` (root) and
  `frontend/package-lock.json` exist; Next warns about it. npm workspaces want a
  single root lockfile — consider removing the frontend one to avoid drift.

## Hosting (decided 2026-06-25)

- **Target: Render** (over Railway/VPS/AWS) — chosen for native cron, predictable
  fixed pricing (~$22/mo), and a one-file blueprint, all fitting the
  3-services-one-needs-persistent-WS shape. Both Render and Railway handle the
  ws-server's two-port design natively (verified Render docs: secondary ports are
  reachable on the private network except a few reserved ones).
- **Scaffolding added (uncommitted):** [`render.yaml`](render.yaml) blueprint
  (3 web services + 1 cron) and [`DEPLOYMENT.md`](DEPLOYMENT.md) step-by-step.
  One backward-compatible code change: `backend/server.js` CORS now also allows
  `process.env.FRONTEND_URL` (comma-separated) so the deployed frontend origin
  can call the API.
- **Render-specific wiring baked into the blueprint:** bind `$PORT` (ws uses
  `WS_PORT=10000`, web uses `next start -p $PORT`, api reads `process.env.PORT` —
  never set `PORT`); `--include=dev` on ws+web builds (tsx/typescript are
  devDeps); ws start drops `--env-file=.env`; `WS_INTERNAL_URL` points at the ws
  service's **private** address `:4001`; Drizzle migrate runs as web's
  `preDeployCommand`; all four services in `region: virginia` for private
  networking. ❓ Not yet executed — these are design-correct but unverified on a
  live Render apply.

## Corrections to CLAUDE.md (verified drift) ✅

`CLAUDE.md` is mostly accurate but has drifted in three small spots:

1. **"No test suite"** is outdated — `scripts/e2e/` is an integration suite (run
   via `node scripts/e2e/run-all.mjs`, not `npm test`).
2. **R2 bucket env var:** CLAUDE.md lists `R2_BUCKET`, but the actual code uses
   **`R2_BUCKET_NAME`** in every route. Use `R2_BUCKET_NAME`.
3. **Repo path:** CLAUDE.md says the monorepo is `D:\Venejobs\` (Windows); the
   current working copy is `/Users/giacog/Desktop/Venejobs` (macOS).

## Open questions / NOT known for sure ❓

- **Admin conversation access scope.** `assertConversationAccess` now returns
  `true` for admins at the top of the function. That helper guards the message
  **GET, POST, and mark-read** routes (`api/conversations/[id]/...`), so admins
  can now *post into* and *mark read* **any** conversation — not just read it as
  dispute evidence. The disputes UI itself reads from the dedicated
  `/api/admin/disputes/[id]/messages` route and does **not** rely on this change.
  → Is admin write-access intended, or should the bypass be GET-only?
  (DELETE is safe — it has a secondary `sender_id` check.)
- **Migration `0011` on prod.** The migration file + journal entry are present;
  the prod Neon DB was not queried this session, so whether it's applied is
  unconfirmed.
- **Hosting / CI-CD.** Not confirmed this session. The backend CORS allowlist
  hints at Vercel previews + `venejob.com` / `app.venejob.com`. 📄
- **Current e2e pass state.** Last known-good is 2026-05-24 (per `DEBUG_LOG.md`);
  not re-run since.

## Verify before shipping

- `cd frontend && npx tsc --noEmit` — expect *only* the 2 CSS errors noted above.
- `npm -w frontend run lint` for lint.
- Touched a feature area? Run its `scripts/e2e/*.test.mjs`. The harness needs the
  **full stack up** (frontend + backend + ws-server, the Neon DB, R2), and for any
  payment path, `stripe listen --forward-to http://localhost:5173/api/webhooks/stripe`
  must be running or `service_orders` rows never get created.
- Stripe / services / contract-order changes: re-read `SERVICES_HANDOFF.md` first.
- Schema changes: re-read `MIGRATION.md` for the Drizzle ↔ Sequelize ownership
  boundary before generating a migration.
