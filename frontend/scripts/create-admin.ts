import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] ?? 'Admin';
const lastname = process.argv[5] ?? 'User';

if (!email || !password) {
  console.error('usage: tsx scripts/create-admin.ts <email> <password> [name] [lastname]');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

async function main() {
  const roles = await sql<{ id: number }[]>`select id from roles where name = 'admin' limit 1`;
  if (roles.length === 0) {
    throw new Error('admin role not found in roles table — run backend seeders first');
  }
  const roleId = roles[0].id;

  const hashed = await bcrypt.hash(password, 10);

  const existing = await sql<{ id: number }[]>`select id from users where email = ${email} limit 1`;

  if (existing.length > 0) {
    await sql`
      update users
      set password = ${hashed},
          role_id = ${roleId},
          is_email_verified = true,
          name = ${name},
          lastname = ${lastname},
          updated_at = now()
      where id = ${existing[0].id}
    `;
    console.log(`updated existing user id=${existing[0].id} email=${email} role=admin`);
  } else {
    const inserted = await sql<{ id: number }[]>`
      insert into users (name, lastname, email, password, role_id, is_email_verified, created_at, updated_at)
      values (${name}, ${lastname}, ${email}, ${hashed}, ${roleId}, true, now(), now())
      returning id
    `;
    console.log(`created admin id=${inserted[0].id} email=${email}`);
  }
}

main()
  .then(() => sql.end())
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    sql.end().finally(() => process.exit(1));
  });
