import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

try {
  const rows = await sql`
    SELECT hash, created_at
    FROM drizzle.__drizzle_migrations
    ORDER BY id
  `;
  console.log("Applied Drizzle migrations:", rows.length);
  for (const r of rows) {
    const t = new Date(Number(r.created_at)).toISOString();
    console.log(" ", String(r.hash).slice(0, 16), t);
  }
} catch (e) {
  console.error("ERR:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
