import {
  pgTable,
  uuid,
  integer,
  text,
  numeric,
  timestamp,
  jsonb,
  foreignKey,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "@/lib/db/schema";

// `status` and `state` and `resolution` are intentionally plain text (no
// pgEnum and no check constraints) so the app state machine — not DDL —
// controls valid values. Adding/removing states must not require a
// migration. See MIGRATION.md and the order state machine in CLAUDE.md.

export const services = pgTable("services", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  freelancerId: integer("freelancer_id").notNull(),
  title: text().notNull(),
  description: text().notNull(),
  category: text().notNull(),
  basePrice: integer("base_price").notNull(),
  currency: text().default("gbp").notNull(),
  deliveryDays: integer("delivery_days").notNull(),
  baseRevisions: integer("base_revisions").default(0).notNull(),
  coverImageUrl: text("cover_image_url"),
  galleryImageUrls: jsonb("gallery_image_urls")
    .$type<string[]>()
    .default(sql`'[]'::jsonb`)
    .notNull(),
  status: text().default("draft").notNull(),
  // Set by admin on reject; cleared on next submit-for-review. updated_at
  // is overwritten by every edit and cannot reliably tell support / the
  // freelancer when a rejection happened.
  rejectionReason: text("rejection_reason"),
  rejectedAt: timestamp("rejected_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
}, (table) => [
  foreignKey({
    columns: [table.freelancerId],
    foreignColumns: [users.id],
    name: "services_freelancer_id_fkey",
  }).onDelete("cascade"),
  index("idx_services_freelancer_status").on(table.freelancerId, table.status),
]);

export const serviceAddons = pgTable("service_addons", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  serviceId: uuid("service_id").notNull(),
  type: text().notNull(),
  name: text().notNull(),
  description: text(),
  price: integer().notNull(),
  maxQuantity: integer("max_quantity"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
}, (table) => [
  foreignKey({
    columns: [table.serviceId],
    foreignColumns: [services.id],
    name: "service_addons_service_id_fkey",
  }).onDelete("cascade"),
]);

export const serviceOrders = pgTable("service_orders", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  serviceId: uuid("service_id").notNull(),
  clientId: integer("client_id").notNull(),
  freelancerId: integer("freelancer_id").notNull(),
  basePrice: integer("base_price").notNull(),
  currency: text().default("gbp").notNull(),
  // platform_fee_pct is a percentage, not money — numeric is correct.
  platformFeePct: numeric("platform_fee_pct", { precision: 5, scale: 2 }).notNull(),
  deliveryDeadline: timestamp("delivery_deadline", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
  autoAcceptDeadline: timestamp("auto_accept_deadline", {
    withTimezone: true,
    mode: "string",
  }),
  revisionsPurchased: integer("revisions_purchased").notNull(),
  revisionsUsed: integer("revisions_used").default(0).notNull(),
  state: text().notNull(),
  paymentIntentId: text("payment_intent_id").notNull(),
  transferId: text("transfer_id"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: "string" }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "string" }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: "string" }),
}, (table) => [
  foreignKey({
    columns: [table.serviceId],
    foreignColumns: [services.id],
    name: "service_orders_service_id_fkey",
  }).onDelete("restrict"),
  foreignKey({
    columns: [table.clientId],
    foreignColumns: [users.id],
    name: "service_orders_client_id_fkey",
  }).onDelete("restrict"),
  foreignKey({
    columns: [table.freelancerId],
    foreignColumns: [users.id],
    name: "service_orders_freelancer_id_fkey",
  }).onDelete("restrict"),
  index("idx_service_orders_freelancer").on(table.freelancerId),
  index("idx_service_orders_client").on(table.clientId),
  index("idx_service_orders_state").on(table.state),
  // Cron scans for delivered orders past their auto-accept deadline.
  index("idx_service_orders_auto_accept_due")
    .on(table.autoAcceptDeadline)
    .where(sql`state = 'delivered'`),
]);

export const serviceOrderAddons = pgTable("service_order_addons", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  orderId: uuid("order_id").notNull(),
  // Nullable so future custom (one-off, non-catalog) add-ons can exist
  // without a predefined service_addons row.
  addonId: uuid("addon_id"),
  // type/name/price are snapshotted at purchase time so historical
  // orders survive later edits/deletes of the source service_addons row.
  type: text().notNull(),
  name: text().notNull(),
  price: integer().notNull(),
  quantity: integer().default(1).notNull(),
  paymentIntentId: text("payment_intent_id").notNull(),
  purchasedAt: timestamp("purchased_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
}, (table) => [
  foreignKey({
    columns: [table.orderId],
    foreignColumns: [serviceOrders.id],
    name: "service_order_addons_order_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.addonId],
    foreignColumns: [serviceAddons.id],
    name: "service_order_addons_addon_id_fkey",
  }).onDelete("set null"),
  index("idx_service_order_addons_order").on(table.orderId),
]);

export const serviceOrderDeliveries = pgTable("service_order_deliveries", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  orderId: uuid("order_id").notNull(),
  freelancerId: integer("freelancer_id").notNull(),
  message: text(),
  // [{ r2_key, filename, size, mime }, ...]
  attachments: jsonb().default(sql`'[]'::jsonb`).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
}, (table) => [
  foreignKey({
    columns: [table.orderId],
    foreignColumns: [serviceOrders.id],
    name: "service_order_deliveries_order_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.freelancerId],
    foreignColumns: [users.id],
    name: "service_order_deliveries_freelancer_id_fkey",
  }).onDelete("restrict"),
  index("idx_service_order_deliveries_order").on(table.orderId),
]);

export const serviceOrderRevisions = pgTable("service_order_revisions", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  orderId: uuid("order_id").notNull(),
  clientId: integer("client_id").notNull(),
  message: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
}, (table) => [
  foreignKey({
    columns: [table.orderId],
    foreignColumns: [serviceOrders.id],
    name: "service_order_revisions_order_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.clientId],
    foreignColumns: [users.id],
    name: "service_order_revisions_client_id_fkey",
  }).onDelete("restrict"),
  index("idx_service_order_revisions_order").on(table.orderId),
]);

export const serviceOrderDisputes = pgTable("service_order_disputes", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  orderId: uuid("order_id").notNull(),
  raisedBy: integer("raised_by").notNull(),
  reason: text().notNull(),
  // [{ r2Key, filename, size, mime }, ...] — evidence files uploaded
  // when the dispute was raised. Same shape as service_order_deliveries.
  attachments: jsonb().default(sql`'[]'::jsonb`).notNull(),
  resolution: text(),
  resolvedBy: integer("resolved_by"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
}, (table) => [
  foreignKey({
    columns: [table.orderId],
    foreignColumns: [serviceOrders.id],
    name: "service_order_disputes_order_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.raisedBy],
    foreignColumns: [users.id],
    name: "service_order_disputes_raised_by_fkey",
  }).onDelete("restrict"),
  foreignKey({
    columns: [table.resolvedBy],
    foreignColumns: [users.id],
    name: "service_order_disputes_resolved_by_fkey",
  }).onDelete("restrict"),
]);
