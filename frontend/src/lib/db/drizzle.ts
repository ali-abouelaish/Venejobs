import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL!;

// Dedicated postgres.js client for Drizzle. Kept separate from the `sql`
// and `listenSql` clients in ./index.ts so legacy routes and LISTEN/NOTIFY
// keep working unchanged.
const client = postgres(DATABASE_URL, {
  ssl: "require",
  prepare: false,
});

export const db = drizzle(client, { schema });
