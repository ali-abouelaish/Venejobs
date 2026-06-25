# Deploying Venejobs to Render

Step-by-step deploy of the three services + cron to [Render](https://render.com),
driven by the [`render.yaml`](render.yaml) blueprint in the repo root.

Companion: see [PROJECT_NOTES.md](PROJECT_NOTES.md) for current state and the
deploy-readiness checklist.

---

## What gets deployed

| Render service  | Type | What it is | Public URL |
|-----------------|------|------------|------------|
| `venejobs-api`  | web  | Express backend (auth, jobs, proposals, orders, lookups) | `https://venejobs-api.onrender.com` |
| `venejobs-ws`   | web  | WebSocket relay (public WSS + private internal broadcast) | `wss://venejobs-ws.onrender.com` |
| `venejobs-web`  | web  | Next.js frontend + Drizzle API surface | `https://venejobs-web.onrender.com` |
| `venejobs-cron` | cron | Hits `/api/cron/auto-accept` every 15 min | — |

These stay **external and unchanged**: **Neon** (Postgres), **Cloudflare R2**
(files), **Brevo** (email), **Stripe** (payments). Render only runs the three
Node processes; the data lives where it already does.

> The exact `.onrender.com` hostnames may get a suffix if the name is taken
> (e.g. `venejobs-web-a1b2`). Use whatever Render actually assigns.

---

## ⚠️ Before you start

1. **Rotate the leaked secrets first.** The DB/JWT/Brevo/R2/admin credentials
   were shared over WhatsApp + screenshots, so treat them as compromised:
   rotate the Neon password, `JWT_SECRET`/`WS_SECRET`, Brevo key, R2 keys, and
   set a strong `ADMIN_PASSWORD`. Deploy with the **new** values.
   - Rotating `JWT_SECRET`/`WS_SECRET` logs out all current sessions — fine for
     a first deploy. Keep `JWT_SECRET`, `WS_SECRET` consistent everywhere they
     appear below.
2. **You need:** a Render account, this repo connected to it (GitHub), and the
   env values (your three `.env` files, with the rotated secrets).
3. **Decide the database.** The simplest path points at your **existing** Neon
   prod DB (it already has the schema + data). If you'd rather not touch prod
   first, create a **Neon branch** and deploy against that branch's URL to do a
   dry run, then switch.

---

## Step 0 — Safety net: branch the Neon DB

`venejobs-web` runs Drizzle migrations on every deploy (`preDeployCommand`).
They're idempotent and tracked, but before the **first** prod migration, take a
free instant **Neon branch** as a restore point (Neon dashboard → Branches →
Create branch). If anything goes wrong you can repoint `DATABASE_URL` at the
branch.

## Step 1 — Push the blueprint + the code tweak

This change adds `render.yaml`, `DEPLOYMENT.md`, and one backward-compatible
edit to `backend/server.js` (an env-driven CORS origin via `FRONTEND_URL`).

```bash
git checkout -b deploy/render
git add render.yaml DEPLOYMENT.md backend/server.js
git commit -m "Add Render deploy blueprint + env-driven CORS origin"
git push -u origin deploy/render
```

(You can deploy from this branch, or merge to `main` first — the blueprint pins
`branch: main`, so change that if you deploy from another branch.)

## Step 2 — Create the Blueprint on Render

Render dashboard → **New** → **Blueprint** → pick the `Venejobs` repo → it reads
`render.yaml` and shows the 4 services. Click **Apply**.

Render will then prompt for every `sync: false` env var. Fill the secrets now
(Step 3); leave the URL ones blank for the moment (Step 5) — first deploy may
fail/partially-work until they're set, which is expected.

## Step 3 — Fill the secret env vars

Per service, set these (values from your rotated `.env` files):

**venejobs-api**
- `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `BREVO_API_KEY`,
  `SMTP_USER`
- (`FRONTEND_URL` → Step 5)

**venejobs-ws**
- `DATABASE_URL`, `WS_SECRET`, `WS_INTERNAL_SECRET`

**venejobs-web**
- `DATABASE_URL`, `JWT_SECRET`, `WS_SECRET`, `WS_INTERNAL_SECRET`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
  **`R2_BUCKET_NAME`** (⚠ this exact name — the code reads `R2_BUCKET_NAME`, not
  `R2_BUCKET`), `R2_PUBLIC_URL`
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `CRON_SECRET`
- (`WS_INTERNAL_URL`, `NEXT_PUBLIC_*`, `STRIPE_WEBHOOK_SECRET` → Steps 5–6)

**venejobs-cron**
- `CRON_SECRET` (same value as on web)
- (`WEB_URL` → Step 5)

## Step 4 — First deploy, then grab the URLs

Let the services build. When they're up, note the public URLs Render assigned:
- web → `https://venejobs-web.onrender.com`
- api → `https://venejobs-api.onrender.com`
- ws  → `https://venejobs-ws.onrender.com`

And the ws **internal** address: open **venejobs-ws → Connect → Internal** and
copy the internal hostname (looks like `venejobs-ws-xxxx`).

## Step 5 — Wire the inter-service URLs, then redeploy web

Set these (Environment tab of each service):

**venejobs-web**
| Var | Value |
|-----|-------|
| `NEXT_PUBLIC_BASE_URL` | `https://venejobs-api.onrender.com` |
| `NEXT_PUBLIC_API_URL` | `https://venejobs-api.onrender.com/api` |
| `NEXT_PUBLIC_WS_URL` | `wss://venejobs-ws.onrender.com` |
| `WS_INTERNAL_URL` | `http://venejobs-ws-xxxx:4001` (the internal host from Step 4) |

**venejobs-api**
| Var | Value |
|-----|-------|
| `FRONTEND_URL` | `https://venejobs-web.onrender.com` |

**venejobs-cron**
| Var | Value |
|-----|-------|
| `WEB_URL` | `https://venejobs-web.onrender.com` |

> **Important:** `NEXT_PUBLIC_*` are compiled into the browser bundle at **build
> time**. After setting them, **Manual Deploy → Clear build cache & deploy** on
> `venejobs-web` so they actually take effect. (api/ws just need a restart.)

## Step 6 — Stripe webhook

1. Stripe dashboard → Developers → **Webhooks** → Add endpoint:
   `https://venejobs-web.onrender.com/api/webhooks/stripe`
2. Subscribe to the events the handler processes — check
   [`frontend/src/lib/webhooks/stripe.ts`](frontend/src/lib/webhooks/stripe.ts)
   for the full list (at minimum `checkout.session.completed` and
   `account.updated`).
3. Copy the endpoint's **Signing secret** (`whsec_…`) → set
   `STRIPE_WEBHOOK_SECRET` on `venejobs-web` → redeploy web.

Without this, payments succeed at Stripe but **no `service_orders` row is
created** (the webhook is what writes it).

## Step 7 — Verify

- **Migrations:** `venejobs-web`'s deploy log should show the Drizzle migrate
  step running (and applying `0011_dispute_evidence` if it wasn't already).
- **Smoke test:** open the web URL, sign in, send a chat message (exercises ws
  public WSS), post a job, and run a Stripe **test-mode** checkout to confirm an
  order is created (exercises the webhook).
- **Real-time:** if messages persist but don't appear live until refresh,
  `WS_INTERNAL_URL` is wrong — recheck the internal host/port from Step 4. (The
  app degrades gracefully here: data is saved, only the live push is missing.)
- **Cron:** trigger `venejobs-cron` once manually (Render → the cron service →
  Run) and confirm a 200 JSON response in its logs.

## Step 8 — Custom domain (optional, later)

`venejob.com` isn't registered/pointed yet. When ready: register it, then in
Render `venejobs-web` → Settings → Custom Domains add `venejob.com` /
`www.venejob.com` and set the DNS records Render shows. Then update
`FRONTEND_URL` (api), the `NEXT_PUBLIC_*` URLs (web, + redeploy), and the Stripe
webhook URL to the custom domain. The backend already allows `venejob.com` in
its CORS list.

---

## Env var → service reference

| Var | api | ws | web | cron | Notes |
|-----|:--:|:--:|:--:|:--:|-------|
| `DATABASE_URL` | ✅ | ✅ | ✅ | | Neon URL (same everywhere) |
| `JWT_SECRET` | ✅ | | ✅ | | must match across services |
| `JWT_EXPIRES_IN` | ✅ | | | | `7d` |
| `WS_SECRET` | | ✅ | ✅ | | signs/verifies WS tokens; must match |
| `WS_INTERNAL_SECRET` | | ✅ | ✅ | | gates the internal broadcast; must match |
| `WS_PORT` | | ✅ | | | `10000` (Render's public port) |
| `WS_INTERNAL_PORT` | | ✅ | | | `4001` (private) |
| `WS_INTERNAL_URL` | | | ✅ | | `http://venejobs-ws-xxxx:4001` |
| `NEXT_PUBLIC_BASE_URL` / `_API_URL` | | | ✅ | | point at the api service |
| `NEXT_PUBLIC_WS_URL` | | | ✅ | | `wss://…ws.onrender.com` |
| `FRONTEND_URL` | ✅ | | | | CORS — web's public URL |
| `R2_*` (incl. `R2_BUCKET_NAME`) | | | ✅ | | storage |
| `STRIPE_SECRET_KEY` / `_WEBHOOK_SECRET` | | | ✅ | | payments + webhook |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | | | ✅ | | client Stripe.js |
| `CRON_SECRET` | | | ✅ | ✅ | web verifies; cron sends |
| `WEB_URL` | | | | ✅ | web's public URL |
| `ADMIN_*`, `SMTP_*`, `BREVO_API_KEY` | ✅ | | | | admin seed + email |
| `NODE_ENV` | ✅ | | | | `production` (api only) |
| `PORT` | ❌ | ❌ | ❌ | | never set — Render injects it |

## Gotchas (why these specific settings)

- **`PORT` is Render-injected.** The backend reads `process.env.PORT`, Next uses
  `-p $PORT`, and ws binds `WS_PORT=10000` (Render's default). Setting `PORT`
  yourself (e.g. the old `PORT=4000`) breaks routing — leave it unset.
- **`--include=dev` on ws + web builds.** `tsx`, `typescript`, and `tailwind`
  are devDependencies; a production-mode install would skip them and the build
  (and the migrate step) would fail.
- **ws-server has two ports.** Public WSS on `WS_PORT` (10000) for browsers;
  internal HTTP on `WS_INTERNAL_PORT` (4001) reached only via Render's private
  network. That's why `WS_INTERNAL_URL` uses the **internal** host, not the
  public one — the public URL can't reach 4001.
- **Same region for all four.** Private networking only works within one region
  (`virginia` here, also closest to Neon us-east-1).
- **Single ws instance.** Presence/rooms live in memory, so don't scale
  `venejobs-ws` past 1 instance without adding Redis pub/sub first.
- **Migrations vs. existing prod data.** Drizzle migrate is idempotent; the
  Sequelize-owned tables already exist on prod, so you usually don't need to run
  Sequelize migrations — but if you do, `npm -w backend run db:migrate` is also
  tracked/idempotent. Branch the DB first (Step 0).

## Rough cost

3 × `starter` web ($7) + 1 cron (usage, ~$1) ≈ **$22/mo**, predictable. Neon /
R2 / Brevo on their existing plans; Stripe is per-transaction. Bump
`venejobs-web` to `standard` only if it runs out of memory.
