import {
  pgTable,
  uuid,
  integer,
  varchar,
  timestamp,
  foreignKey,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "@/lib/db/schema";

export const adminInvites = pgTable(
  "admin_invites",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    email: varchar({ length: 255 }).notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    invitedBy: integer("invited_by"),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "string" }),
    acceptedUserId: integer("accepted_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.invitedBy],
      foreignColumns: [users.id],
      name: "admin_invites_invited_by_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.acceptedUserId],
      foreignColumns: [users.id],
      name: "admin_invites_accepted_user_id_fkey",
    }).onDelete("set null"),
    unique("admin_invites_token_hash_key").on(table.tokenHash),
    index("admin_invites_email_idx").on(table.email),
  ],
);
