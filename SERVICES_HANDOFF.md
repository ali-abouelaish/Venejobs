# Services + Add-ons feature — handoff for UI polish

End of the implementation phase. The full Services marketplace flow is built
end-to-end on the backend, plus **minimal functional pages** for every screen
in the user journey. The next session's job is to **replace the minimal pages
with the production UI** (layouts, design system, navigation, polish) without
changing endpoint contracts.

This document is self-contained. Read it before touching code.

---

## What this feature does

VeneJobs has two parallel marketplace flows now:

1. **Contracts** (existing, unchanged) — custom hourly/project work between a
   client and a freelancer in a conversation.
2. **Services** (this feature) — fixed-price Fiverr-style gigs. Freelancer
   publishes a service with a base price + add-ons, client buys instantly
   through Stripe Embedded Checkout, work is delivered, client accepts,
   freelancer is paid via Stripe Transfer. Mid-order add-on purchases are
   supported as separate PaymentIntents.

The two flows share users, the messaging system, and the R2 upload pipeline.
Everything else is isolated. The Services flow does **not** touch the
`contracts`, `messages`, `proposals`, `jobs`, or `orders` tables.

---

## Stripe model (read this before changing anything in lib/transfers.ts)

We use **Stripe Connect** in the **separate charges + transfers** pattern (NOT
destination charges). The throwaway `/api/stripe-test/*` routes use the
opposite (destination charges) pattern — they're scaffolding, not production.

Flow:

1. Buyer pays via **Embedded Checkout** (`ui_mode: 'embedded_page'`) — funds
   land on the **platform balance**, no `transfer_data`, no
   `application_fee_amount`.
2. `checkout.session.completed` webhook creates the `service_orders` row in
   state `'paid'`.
3. Freelancer delivers, client accepts.
4. `stripe.transfers.create({ destination: connect_acct, amount: net })`
   sends the freelancer's cut (gross minus platform fee) to their Connect
   account. Idempotency key: `order:<order_id>:transfer:<accepted_at_ms>`.
5. `transfer.created` / `transfer.updated` webhook moves state to
   `'completed'`.

Refunds work cleanly because no transfer happened until acceptance. Cancel
before delivery → refund the charges directly, no clawback from the connected
account.

---

## State machine (`service_orders.state`)

```
paid → in_progress | delivered | cancelled
in_progress → delivered | cancelled
delivered → revision_requested | accepted | auto_accepted | disputed
revision_requested → in_progress | disputed
accepted → completed
auto_accepted → completed
cancelled → refunded
disputed → completed | refunded
```

Terminal states: `completed`, `refunded`.

**All state changes go through `transitionServiceOrder(orderId, fromState,
toState, patch, exec?)` in `frontend/src/lib/orders.ts`.** It does atomic
compare-and-swap on `state` so concurrent transitions can't double-fire.
Don't write raw `UPDATE service_orders SET state=...` anywhere else.

`status` on `services` (separate state machine):

```
draft → pending_review
pending_review → published | rejected
rejected → pending_review        (via submit-for-review)
```

`services.status` is **not** managed by `transitionServiceOrder`. Each
endpoint that mutates it does its own state guard inline.

---

## Database

All Service tables are owned by **Drizzle**, not Sequelize. See
[`MIGRATION.md`](./MIGRATION.md) for the ORM boundary rules.

Schema files:
- [`frontend/src/lib/db/schema/services.ts`](./frontend/src/lib/db/schema/services.ts)
  — 7 tables: `services`, `service_addons`, `service_orders`,
  `service_order_addons`, `service_order_deliveries`,
  `service_order_revisions`, `service_order_disputes`.
- [`frontend/src/lib/db/schema/stripe.ts`](./frontend/src/lib/db/schema/stripe.ts)
  — 2 tables: `stripe_connect_accounts`, `stripe_events`.

Critical column rules:
- All money columns are **integer in the smallest currency unit (pence)**.
  Never use floats for money.
- User FKs (`freelancer_id`, `client_id`, `raised_by`, `resolved_by`) are
  `integer` matching legacy `users.id`. Service-level PKs are `uuid`.
- `state`, `status`, `resolution` are plain `text` (no `pgEnum`, no `CHECK`)
  so app code can evolve valid values without DDL.
- All timestamps are `timestamptz`.
- `service_order_addons.addon_id` is **nullable** (future custom one-off
  addons). `type`, `name`, `price` are snapshotted at purchase time so
  historical orders survive addon edits.

Migrations applied: `0000`–`0004` in `frontend/src/lib/db/drizzle-migrations/`.
`db:generate` requires a TTY; `db:migrate` does not. See `MIGRATION.md`
"Reconciliation drift" for the idempotent-guard wrapping pattern.

---

## Environment variables required

In `frontend/.env.local`:

```
# Already present from prior work:
DATABASE_URL=...
JWT_SECRET=...
NEXT_PUBLIC_API_URL=...
R2_*=...

# This feature:
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...    # printed by `stripe listen`
CRON_SECRET=<any high-entropy string>
```

The webhook secret comes from running `stripe listen --forward-to
http://localhost:5173/api/webhooks/stripe` — it prints a fresh `whsec_…` each
time. Restart `npm run dev` whenever you set/change `.env.local` values.

---

## Endpoint reference (all built, all typecheck clean)

Auth uses the existing JWT in the `token` cookie via `auth()` from
`@/lib/auth`. Error shape on new routes: `{ error: "...", code?: "..." }`
with HTTP status codes. `code` only present where the frontend needs to
programmatically detect a case.

### Freelancer (auth required)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/services/mine` | Their own services |
| POST | `/api/services` | Create draft |
| PATCH | `/api/services/:id` | Edit (draft/rejected only) |
| POST | `/api/services/:id/submit-for-review` | Clears rejection_reason |
| POST | `/api/services/:id/addons` | Add addon |
| PATCH | `/api/services/:id/addons/:addonId` | Edit addon |
| DELETE | `/api/services/:id/addons/:addonId` | Remove addon (204) |
| POST | `/api/connect/account` | Idempotent ensure |
| POST | `/api/connect/onboarding-link` | Stripe-hosted URL |
| GET | `/api/connect/status` | Live sync + return |
| POST | `/api/service-orders/:id/deliver` | Body: `{ message?, attachments: [...] }` |
| GET | `/api/service-orders/incoming` | Orders where I'm the freelancer |

### Client (auth required)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/services` | Public browse (filters: category, minPrice, maxPrice, maxDeliveryDays, limit, offset). Anonymous allowed. |
| GET | `/api/services/:id` | Detail + addons. Public for `published`; owner can see their own. Anonymous allowed. |
| POST | `/api/service-orders/checkout` | Body: `{ serviceId, addons: [{ addonId, quantity }] }`. Returns `{ clientSecret }` for Embedded Checkout. |
| POST | `/api/service-orders/:id/request-revision` | Body: `{ message }`. **402 with `code: 'revisions_exhausted'`** + `availableAddons` when revisions used up. |
| POST | `/api/service-orders/:id/buy-revisions` | Body: `{ addons: [...] }`. Returns `clientSecret` for the addon Checkout. |
| POST | `/api/service-orders/:id/accept` | Triggers Stripe Transfer |
| POST | `/api/service-orders/:id/cancel` | Only if past delivery deadline. Returns `code: 'cannot_cancel_yet'` otherwise. |
| POST | `/api/service-orders/:id/dispute` | Body: `{ reason }` |
| GET | `/api/service-orders/outgoing` | Orders where I'm the client |
| GET | `/api/service-orders/:id` | Detail (either participant). Returns `{ order, addons, deliveries, revisions, disputes, viewerRole }` |

### Admin (auth + role='admin' required)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/services?status=pending_review` | Review queue (status filter) |
| POST | `/api/admin/services/:id/approve` | **Live Connect gate**: 422 with `code: 'connect_missing'` or `'connect_not_ready'` + details if freelancer isn't payable |
| POST | `/api/admin/services/:id/reject` | Body: `{ reason }`; persists `rejection_reason`, `rejected_at` |
| GET | `/api/admin/disputes` | Open by default; `?resolved=true` includes resolved |
| POST | `/api/admin/service-orders/:id/resolve-dispute` | Body: `{ resolution: 'refund_client' \| 'pay_freelancer' \| 'split', refundAmount?: int }`. Split requires `refundAmount` in pence. |

### Webhook + cron

| Method | Path | Notes |
|---|---|---|
| POST | `/api/webhooks/stripe` | Verifies signature, dedupes via `stripe_events`. Dispatches `checkout.session.completed` (kind=`service_base`/`service_addon`), `transfer.created`, `transfer.updated`, `charge.refunded`, `account.updated`. |
| POST | `/api/cron/auto-accept` | Header: `x-cron-secret: $CRON_SECRET`. Scans delivered orders past `auto_accept_deadline`, transitions to `auto_accepted`, creates transfer. Returns `{ scanned, processed, failed, errors }`. |

---

## Library / helper modules

| File | Purpose |
|---|---|
| [`src/lib/auth.ts`](./frontend/src/lib/auth.ts) | `auth()` reads JWT cookie, returns `{ user: { id, name, email } } \| null` |
| [`src/lib/assertions.ts`](./frontend/src/lib/assertions.ts) | `assertServiceAccess(serviceId, userId)`, `assertServiceOrderAccess(orderId, userId, role)`, `assertAdminAccess(userId)` |
| [`src/lib/stripe.ts`](./frontend/src/lib/stripe.ts) | Configured `Stripe` client |
| [`src/lib/connect.ts`](./frontend/src/lib/connect.ts) | `getOrCreateConnectAccount`, `syncConnectAccount`, `assertConnectReady` |
| [`src/lib/orders.ts`](./frontend/src/lib/orders.ts) | `transitionServiceOrder`, `VALID_TRANSITIONS`, `InvalidTransitionError` |
| [`src/lib/transfers.ts`](./frontend/src/lib/transfers.ts) | `createTransferForOrder`, `createSplitTransferForOrder`, `computeOrderPayout`, `TransferError` |
| [`src/lib/refunds.ts`](./frontend/src/lib/refunds.ts) | `refundFullOrder`, `refundPartialOrder`, `RefundError` |
| [`src/lib/webhooks/stripe.ts`](./frontend/src/lib/webhooks/stripe.ts) | Per-event handlers |
| [`src/lib/config/fees.ts`](./frontend/src/lib/config/fees.ts) | `PLATFORM_FEE_PCT = 10.00` — single source of truth |

---

## Minimal UI pages already written (need polish)

Pattern across all of them: `'use client'`, plain Tailwind, no
`FreelancerLayout` / `ClientLayout` wrappers, no navigation links from
existing nav, no design system integration. Functional only — they prove
the flows work end-to-end.

| Path | Role | Notes |
|---|---|---|
| `/freelancer/onboarding` | Freelancer | Connect onboarding (status + start button) |
| `/freelancer/services` | Freelancer | My services list with status badges |
| `/freelancer/services/new` | Freelancer | Create draft form |
| `/freelancer/services/[id]/edit` | Freelancer | Edit fields + addon CRUD + submit-for-review |
| `/freelancer/orders` | Freelancer | Incoming orders list |
| `/services` | Public/Client | Browse with filters |
| `/services/[id]` | Public/Client | Detail + addon picker + inline Embedded Checkout |
| `/services/[id]/checkout` | Client | **Legacy from Phase 4**, base-only checkout. Redundant; safe to delete. |
| `/services/[id]/checkout/return` | Client | Stripe return URL handler — currently just a static "received" message |
| `/client/orders` | Client | Outgoing orders list |
| `/orders/[id]` | Client + Freelancer | State-aware action buttons (deliver/accept/request-revision/cancel/dispute). Handles 402 revisions_exhausted by stashing message in sessionStorage and redirecting to buy-revisions |
| `/orders/[id]/buy-revisions` | Client | Reads sessionStorage draft, addon picker, inline Embedded Checkout |
| `/admin/services` | Admin | Review queue, approve/reject inline (uses `prompt()` for reason — should be a real modal) |
| `/admin/disputes` | Admin | Disputes list, three-button resolve (uses `prompt()` for split amount) |

Existing stub pages from before this feature, still on disk and **not used**
by the new flow:
- `/freelancer/AddService/` and `/freelancer/AddService/form/` (12-60 line stubs)
- `/client/Service/` and `/client/ServiceDetail/` (43-70 line stubs)
- `/stripe-test/` + `/api/stripe-test/*` (Connect destination-charge throwaway)

Decide whether to delete or repurpose during the UI pass.

---

## What the UI pass needs to do

1. **Wrap pages in the existing layouts.** `FreelancerLayout` for
   `/freelancer/*`, `ClientLayout` for `/client/*`, something appropriate for
   `/services/*`, `/orders/*`, and `/admin/*` (admin layout doesn't exist
   yet — may need creating).
2. **Add navigation links** in the existing sidebars/headers. None of the
   new pages are reachable from the current nav. Update
   `frontend/src/app/routes.js` if you want them centralized there.
3. **Replace ad-hoc forms with the project's form components.** The codebase
   uses MUI v7 + React Hook Form + Flowbite. The minimal pages use raw
   `<input>` / `<select>` / `<textarea>`. Pick one stack and standardize.
4. **Replace `prompt()` / `confirm()` calls** in the admin pages with proper
   modals. Same for the cancel-confirmation in `/orders/[id]`.
5. **Add an R2 attachment upload widget to the delivery flow.** Right now
   `/orders/[id]` allows freelancer to "deliver" with a message only. The
   endpoint accepts `attachments: [{ r2Key, filename, size, mime }]` but
   there's no upload UI. Use the existing R2 presign route (`/api/upload/presign`).
6. **Polish the return page** (`/services/[id]/checkout/return`) to actually
   look up the created order by `session_id` and link to it. Currently
   shows a static message and relies on the user navigating away.
7. **Real-time updates**: order state changes are not pushed. The ws-server
   already broadcasts for messaging; add order events. Internal broadcast
   pattern: `POST {WS_INTERNAL_URL}/internal/broadcast` with
   `x-internal-secret: $WS_INTERNAL_SECRET`. Wire into the key transitions
   in `lib/orders.ts` (or the route handlers that call it).
8. **Empty / loading / error states.** All pages have basic states but
   they're text-only. Skeletons, illustrations, retry buttons would help.
9. **Mobile responsive.** The minimal pages use `max-w-*` + grids that
   collapse but haven't been tested below 640px.
10. **Stamp prices everywhere through a single formatter.** Inline
    `formatPrice` is copied across several files; consolidate to a util.

---

## Test mode gotchas (we hit these — save yourself time)

These are **Stripe test-mode** quirks. None of them affect production.

### 1. Webhooks don't reach the server unless `stripe listen` is running

In a dedicated terminal, leave running:
```
stripe listen --forward-to http://localhost:5173/api/webhooks/stripe
```
The first line prints `whsec_xxx…` — copy the **full** string into
`STRIPE_WEBHOOK_SECRET` in `.env.local` and restart `npm run dev`.

If you skip this, payments will succeed in Stripe but `service_orders` rows
will never be created — the freelancer's "incoming orders" page will say
"No orders".

### 2. Regular test cards put money in `pending`, not `available`

Test charges with `4242…` go to **pending** platform balance. Transfers can
only draw from **available**. To populate `available` for testing:

```
stripe charges create --amount=10000 --currency=gbp --source=tok_bypassPending
```

Verify with `stripe balance retrieve` — the `available` array should show
the amount. The first Accept after deploying transfers will otherwise fail
with `balance_insufficient`.

### 3. Stripe idempotency keys cache failed responses for 24h

When `stripe.transfers.create` fails (e.g. insufficient balance), the
response is cached against the idempotency key. Retrying with the same key
returns the **same cached failure** even after fixing the underlying issue.

The fix is already in `transfers.ts` — `createTransferForOrder` salts the
idempotency key with `accepted_at` milliseconds:

```ts
const idemKey = order.acceptedAt
  ? `order:${order.id}:transfer:${new Date(order.acceptedAt).getTime()}`
  : `order:${order.id}:transfer`;
```

So if a transfer fails and you reset the order back to `delivered` (clearing
`accepted_at`), the next Accept produces a fresh `accepted_at` and therefore
a fresh idempotency key. **Don't remove this salt** — production won't hit
the cache issue, but dev will.

### 4. Recovery from a stuck `accepted` order

If a transfer fails after the state already moved to `accepted`:

```sql
UPDATE service_orders
SET state = 'delivered', accepted_at = NULL
WHERE id = '<uuid>';
```

Then fix the underlying issue and click Accept again. The state machine
doesn't allow `accepted → delivered` so this has to be a manual SQL fix —
a small admin "retry transfer" endpoint would be a worthwhile follow-up.

### 5. Cron is not scheduled anywhere

`/api/cron/auto-accept` exists but nothing is hitting it. Point Vercel
Cron / GitHub Actions / Hostinger cron / cron-job.org at it with the
`x-cron-secret` header. Daily at 03:00 UTC is fine.

---

## Test flow that exercises everything

With `stripe listen` running and platform balance topped up:

1. **Freelancer A**: `/freelancer/onboarding` → Start onboarding → complete
   on Stripe (`4242…` etc.) → return → status shows both flags green.
2. **Freelancer A**: `/freelancer/services/new` → fill form → submit →
   redirect to edit page → add a `revision`-type addon → "Submit for review".
3. **Admin**: `/admin/services` → Approve. (Service is now `published`.)
4. **Client B**: `/services` → click service → pick 0 revisions → "Buy now"
   → mount Embedded Checkout → pay with `4242 4242 4242 4242`, any future
   expiry, any CVC → land on return page.
5. **Verify**: `service_orders` row in `paid` state, `stripe_events` has the
   `checkout.session.completed` row.
6. **Freelancer A**: `/freelancer/orders` → click order → "Submit delivery"
   with a message → state `delivered`.
7. **Client B**: `/orders/<id>` → "Accept" → state `accepted`, `transfer_id`
   populated, then webhook flips state to `completed`. Stripe dashboard
   shows the transfer to the freelancer's account.
8. **Verify earnings**: gross 5000p − (5000 × 10%) = 500p platform fee
   (your cut), 4500p to freelancer.

For the revision-exhausted path:
9. Bring another `delivered` order with `revisions_used = revisions_purchased`.
10. As client, request a revision → 402 → auto-redirect to
    `/orders/<id>/buy-revisions` with the addons picker → pay → return to
    `/orders/<id>` → re-submit the revision → state `in_progress`,
    `revisions_used++`.

For cancellation:
11. On a `paid` order whose `delivery_deadline` is in the past, client hits
    Cancel → refunds fire → state `cancelled`. `charge.refunded` webhook →
    state `refunded`.

For disputes:
12. On a `delivered` order, client clicks "Raise dispute" with a reason →
    state `disputed`, auto-accept timer pauses (`auto_accept_deadline = null`).
13. Admin: `/admin/disputes` → "Pay freelancer" / "Refund client" / "Split"
    → resolves.

---

## Known limitations (defer or punt to follow-ups)

- **Mutual cancellation** not implemented. Spec mentions "freelancer agrees"
  path before delivery_deadline — needs request + approve/deny endpoints
  and a pending state.
- **`faster_delivery` addons** don't actually reduce `delivery_days`. The
  schema has no offset field. Cosmetic for now; freelancers just price them
  without time effect.
- **No retry-transfer endpoint**. Stuck `accepted` orders need a SQL reset.
- **No revision-draft persistence**. The revision message is stashed in
  `sessionStorage` between the 402 and the addon purchase. Closing the tab
  loses it. Promote to a `revision_drafts` table only if it bites users.
- **No per-freelancer or tiered fee structure**. `PLATFORM_FEE_PCT` is a
  single constant. Stamped onto each order at creation so historical
  invariance is fine.
- **No notifications** on state changes. Freelancer doesn't know an order
  came in until they refresh. ws-server broadcast is the natural fit.
- **No tests**. Backend has no automated test coverage. There's no test
  framework wired up in the frontend workspace yet.

---

## Don't change these things without a reason

- The discriminator key `metadata.kind` on Stripe sessions (`'service_base'`
  vs `'service_addon'`) — the webhook dispatch relies on it.
- The shape of metadata on Stripe line items (`product_data.metadata.kind`
  and `addon_id`) — the webhook reads addon snapshots from these.
- The idempotency keys on Stripe API calls — they're load-bearing for
  retry safety.
- The state machine `VALID_TRANSITIONS` in `lib/orders.ts` — every endpoint
  is built around the exact transitions allowed there.
- The integer-pence rule on money columns — anything else introduces
  rounding errors at scale.

---

## Quick-reference paths

- Backend handlers: `frontend/src/app/api/{services,service-orders,connect,admin,webhooks,cron}/`
- Frontend pages: `frontend/src/app/{services,client,freelancer,orders,admin}/`
- Shared libs: `frontend/src/lib/`
- Schema: `frontend/src/lib/db/schema/`
- Migrations: `frontend/src/lib/db/drizzle-migrations/`
- ORM boundary doc: `MIGRATION.md`
- Repo-wide instructions: `CLAUDE.md`

When you start the next session, the prompt the developer should give is
something like:

> "Read SERVICES_HANDOFF.md. The backend and minimal UI for the Services
> feature are done. Your job is to replace the bare pages under
> /freelancer/services, /freelancer/onboarding, /freelancer/orders,
> /services, /orders/[id], /orders/[id]/buy-revisions, /client/orders,
> /admin/services, /admin/disputes with the production UI using the existing
> FreelancerLayout/ClientLayout, MUI components, and project navigation.
> Do not change any endpoint contracts or DB schema."
