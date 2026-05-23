import {
  pgTable,
  uuid,
  integer,
  text,
  numeric,
  timestamp,
  foreignKey,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users, contracts } from '@/lib/db/schema';

// One-off payment for a fully-signed contract. `state` is plain text by
// design — the app, not DDL, controls valid values; mirrors the service
// orders convention in src/lib/db/schema/services.ts.
export const contractOrders = pgTable(
  'contract_orders',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    contractId: uuid('contract_id').notNull(),
    clientId: integer('client_id').notNull(),
    freelancerId: integer('freelancer_id').notNull(),
    amount: integer().notNull(),
    currency: text().notNull(),
    platformFeePct: numeric('platform_fee_pct', { precision: 5, scale: 2 }).notNull(),
    state: text().notNull(),
    paymentIntentId: text('payment_intent_id').notNull(),
    transferId: text('transfer_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deliveredAt: timestamp('delivered_at', { withTimezone: true, mode: 'string' }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true, mode: 'string' }),
    autoAcceptDeadline: timestamp('auto_accept_deadline', {
      withTimezone: true,
      mode: 'string',
    }),
  },
  (table) => [
    foreignKey({
      columns: [table.contractId],
      foreignColumns: [contracts.id],
      name: 'contract_orders_contract_id_fkey',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.clientId],
      foreignColumns: [users.id],
      name: 'contract_orders_client_id_fkey',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.freelancerId],
      foreignColumns: [users.id],
      name: 'contract_orders_freelancer_id_fkey',
    }).onDelete('restrict'),
    // One paid order per contract — checkout creation also relies on this
    // to fail loudly on a double-create race.
    unique('contract_orders_contract_id_key').on(table.contractId),
    unique('contract_orders_payment_intent_id_key').on(table.paymentIntentId),
    index('idx_contract_orders_client').on(table.clientId),
    index('idx_contract_orders_freelancer').on(table.freelancerId),
    index('idx_contract_orders_state').on(table.state),
    // Cron scans for delivered contract orders past their auto-accept deadline.
    index('idx_contract_orders_auto_accept_due')
      .on(table.autoAcceptDeadline)
      .where(sql`state = 'delivered'`),
  ],
);

export const contractOrderDisputes = pgTable(
  'contract_order_disputes',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    contractOrderId: uuid('contract_order_id').notNull(),
    raisedBy: integer('raised_by').notNull(),
    reason: text().notNull(),
    resolution: text(),
    resolvedBy: integer('resolved_by'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.contractOrderId],
      foreignColumns: [contractOrders.id],
      name: 'contract_order_disputes_contract_order_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.raisedBy],
      foreignColumns: [users.id],
      name: 'contract_order_disputes_raised_by_fkey',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.resolvedBy],
      foreignColumns: [users.id],
      name: 'contract_order_disputes_resolved_by_fkey',
    }).onDelete('restrict'),
    index('idx_contract_order_disputes_contract_order').on(table.contractOrderId),
  ],
);
