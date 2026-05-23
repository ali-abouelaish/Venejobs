import {
  pgTable,
  uuid,
  integer,
  smallint,
  text,
  timestamp,
  foreignKey,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import { contracts } from "@/lib/db/schema";
import { serviceOrders } from "@/lib/db/schema/services";

// `reviewer_role` and `status` are constrained by CHECK because their
// value sets are closed and tied to schema invariants, not to a moving
// app state machine. Adding a value here intentionally requires a
// migration. Contrast with services.state, which is plain text by design.

export const reviews = pgTable("reviews", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  contractId: uuid("contract_id"),
  serviceOrderId: uuid("service_order_id"),
  reviewerId: integer("reviewer_id").notNull(),
  revieweeId: integer("reviewee_id").notNull(),
  reviewerRole: text("reviewer_role").notNull(),
  rating: smallint().notNull(),
  comment: text().notNull(),
  status: text().default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true, mode: "string" }),
}, (table) => [
  foreignKey({
    columns: [table.contractId],
    foreignColumns: [contracts.id],
    name: "reviews_contract_id_fkey",
  }).onDelete("restrict"),
  foreignKey({
    columns: [table.serviceOrderId],
    foreignColumns: [serviceOrders.id],
    name: "reviews_service_order_id_fkey",
  }).onDelete("restrict"),
  foreignKey({
    columns: [table.reviewerId],
    foreignColumns: [users.id],
    name: "reviews_reviewer_id_fkey",
  }).onDelete("restrict"),
  foreignKey({
    columns: [table.revieweeId],
    foreignColumns: [users.id],
    name: "reviews_reviewee_id_fkey",
  }).onDelete("restrict"),
  check("reviews_reviewer_role_check", sql`${table.reviewerRole} IN ('client', 'freelancer')`),
  check("reviews_rating_check", sql`${table.rating} BETWEEN 1 AND 5`),
  check("reviews_status_check", sql`${table.status} IN ('pending', 'published')`),
  check(
    "reviews_one_subject",
    sql`(${table.contractId} IS NOT NULL) <> (${table.serviceOrderId} IS NOT NULL)`,
  ),
  uniqueIndex("reviews_contract_reviewer_uidx")
    .on(table.contractId, table.reviewerId)
    .where(sql`${table.contractId} IS NOT NULL`),
  uniqueIndex("reviews_order_reviewer_uidx")
    .on(table.serviceOrderId, table.reviewerId)
    .where(sql`${table.serviceOrderId} IS NOT NULL`),
  index("reviews_reviewee_status_idx").on(table.revieweeId, table.status),
]);

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
