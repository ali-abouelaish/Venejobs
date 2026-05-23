import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

async function main(): Promise<void> {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is not set. Add it to .env.local before running.');
    process.exit(1);
  }
  const sql = postgres(DATABASE_URL, { ssl: 'require', max: 1 });
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: './src/lib/db/drizzle-migrations' });
  await sql.end();
  console.log('✓ migrations applied');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
