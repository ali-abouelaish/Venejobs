# MIGRATION.md

Path B migration notes for VeneJobs. Lives at the monorepo root.

## Two ORMs, one database

Until the legacy Express backend is retired (end of Path B), the same
Postgres database is touched by two ORMs. Boundary rules below are
**load-bearing** — silent drift is the single biggest risk during the
migration.

### Sequelize-owned tables (frozen)

Owned by `backend/migrations/*.js`. **No Drizzle migration is allowed
to ALTER, DROP, or otherwise modify these tables.** Drizzle's `schema.ts`
mirrors them so the Next.js app can read them via Drizzle, but the
schema definitions there are descriptive, not authoritative.

- `SequelizeMeta`
- `roles`
- `users`
- `budget_types`
- `project_sizes`
- `durations`
- `experience_levels`
- `freelancer_profiles`
- `freelancer_experiences`
- `freelancer_educations`
- `freelancer_languages`
- `freelancer_portfolios`
- `freelancer_skills`
- `categories`
- `skills`
- `jobs`
- `proposals`
- `orders`

### Drizzle-owned tables

Owned by `frontend/src/lib/db/drizzle-migrations/*.sql` and the schema
modules under `frontend/src/lib/db/schema/` (one file per feature) plus
the legacy mirror at `frontend/src/lib/db/schema.ts`. Drizzle is the
sole writer for these tables.

Messaging v2 / contracts (created earlier via raw SQL under
`frontend/migrations/`, ownership transferred to Drizzle going forward):

- `conversations`
- `messages`
- `message_attachments`
- `message_reactions`
- `message_reads`
- `contracts`
- `contract_revisions`
- `contract_signatures`

Services + Stripe (Path B Phase 0+):

- `stripe_connect_accounts` (Phase 0)
- `services` (Phase 1)
- `service_addons` (Phase 1)
- `service_orders` (Phase 1)
- `service_order_addons` (Phase 1)
- `service_order_deliveries` (Phase 1)
- `service_order_revisions` (Phase 1)
- `service_order_disputes` (Phase 1)
- `stripe_events` (Phase 1)

## Foreign-key type rules

`users.id` is `serial` (integer) because Sequelize owns it. **Any new
table that references `users.id` must use `integer` for that column.**
This applies to `client_id`, `freelancer_id`, `raised_by`, `resolved_by`,
and any other user FK on a Drizzle-owned table.

Primary keys on new Drizzle-owned tables use `uuid DEFAULT gen_random_uuid()`
unless there is a specific reason not to (e.g., `stripe_connect_accounts`
is keyed by `user_id` because it is 1:1 with `users`; `stripe_events`
is keyed by the Stripe event ID string).

## Schema layout

- `frontend/src/lib/db/schema.ts` — legacy mirror. Holds the Drizzle
  definitions of all the Sequelize-owned tables plus the older
  messaging/contracts tables. **Do not split or refactor this file
  during the migration.**
- `frontend/src/lib/db/schema/<feature>.ts` — one module per new
  feature. Currently:
  - `schema/stripe.ts` — Stripe Connect onboarding state.
  - `schema/services.ts` — to be added in Phase 1.
- `frontend/src/lib/db/drizzle.ts` — merges both into the `db` export.
- `frontend/drizzle.config.ts` — schema glob covers both the legacy
  file and the feature modules.

## Generating and applying migrations

Both commands run from the `frontend/` workspace.

```bash
npm -w frontend run db:generate   # diff schema vs last snapshot, emit SQL
npm -w frontend run db:migrate    # apply pending migrations to DATABASE_URL
```

Notes:

- `db:generate` (drizzle-kit) requires a TTY because its column-rename
  resolver prompts interactively even for purely additive changes. In a
  non-TTY environment (CI, agent, piped shell) the command will exit
  with `Error: Interactive prompts require a TTY terminal`. When this
  happens, hand-write the migration SQL in the format drizzle-kit emits
  and add the corresponding entry to `meta/_journal.json`. The matching
  `meta/<n>_snapshot.json` can be regenerated from a real terminal
  later with `npx drizzle-kit pull` against the live DB.

- `db:migrate` is implemented in `frontend/scripts/db-migrate.ts` using
  `drizzle-orm/postgres-js/migrator`. It tracks applied migrations in
  `drizzle.__drizzle_migrations`.

- The baseline migration `0000_colorful_marauders.sql` is a no-op
  (`SELECT 1`). It exists only to anchor the journal; the schema it
  represents already exists on the live DB because Sequelize created
  it. The original introspected DDL is preserved in the corresponding
  snapshot at `meta/0000_snapshot.json` for diffing.

### Reconciliation drift against Sequelize-owned tables

Until Sequelize fully retires, every `drizzle-kit generate` run will
detect what looks like drift on the Sequelize-owned tables — defaults
formatted slightly differently, FK action wording, generated index
names, enum value reordering, etc. — and emit redundant DDL targeting
those tables. This is not real schema change; it is the diff between
Drizzle's idea of "exact" and what Sequelize actually produced.

**Standard procedure**: before applying a generated migration, open
the SQL file and wrap every statement that touches a Sequelize-owned
table (see the ownership list above) in idempotent guards:

- `CREATE TABLE ... IF NOT EXISTS`
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- `ALTER TABLE ... DROP CONSTRAINT IF EXISTS` followed by the recreate
- `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;`
  for `CREATE TYPE`

Statements that target Drizzle-owned tables stay as-is — they are the
authoritative changes. The wrapping makes the redundant Sequelize-side
DDL safe to replay against a database that already matches.

The pain decreases as the schema stabilizes and Sequelize-side
mutations slow down. Once Express retires and Sequelize is removed,
this section can be deleted.

## Webhook & state tables

- `stripe_events.id` is the Stripe event ID itself (`evt_...`), used as
  the dedupe key in webhook handlers. Inserts use `ON CONFLICT (id) DO
  NOTHING`.
- All Stripe Transfer and Refund API calls use idempotency keys derived
  from internal IDs, e.g. `order:<uuid>:transfer`,
  `order:<uuid>:refund:<charge_id>`.

## What to do when the boundary moves

When a Sequelize table is being retired (Express route ported to Next.js
and the underlying table is no longer read/written by Sequelize):

1. Port the writers first; verify in production that Sequelize is no
   longer writing.
2. Move the table's row in the lists above from "Sequelize-owned" to
   "Drizzle-owned".
3. Subsequent ALTERs flow through Drizzle.
4. Drop the corresponding Sequelize migration only when the Express
   backend is deleted.
