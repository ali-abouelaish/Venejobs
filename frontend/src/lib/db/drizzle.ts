import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as legacySchema from "./schema";
import * as stripeSchema from "./schema/stripe";
import * as servicesSchema from "./schema/services";
import * as reviewsSchema from "./schema/reviews";
import * as contractsSchema from "./schema/contracts";
import * as adminInvitesSchema from "./schema/adminInvites";

const DATABASE_URL = process.env.DATABASE_URL!;

// Dedicated postgres.js client for Drizzle. Kept separate from the `sql`
// and `listenSql` clients in ./index.ts so legacy routes and LISTEN/NOTIFY
// keep working unchanged.
const client = postgres(DATABASE_URL, {
  ssl: "require",
  prepare: false,
});

const schema = { ...legacySchema, ...stripeSchema, ...servicesSchema, ...reviewsSchema, ...contractsSchema, ...adminInvitesSchema };

export const db = drizzle(client, { schema });
