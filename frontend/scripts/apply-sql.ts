import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
config({ path: resolve(process.cwd(), '.env.local') });
import postgres from 'postgres';

const file = process.argv[2];
if (!file) { console.error('usage: tsx scripts/apply-sql.ts <path>'); process.exit(1); }

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
const content = readFileSync(resolve(process.cwd(), file), 'utf8');

sql.unsafe(content)
  .then(() => { console.log('Applied:', file); return sql.end(); })
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1); });