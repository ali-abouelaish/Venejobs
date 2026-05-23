/**
 * One-shot migration: copies existing avatar files from backend/uploads/profile/
 * to Cloudflare R2 under avatars/<basename>, then rewrites users.profile_picture
 * rows that still point at /uploads/profile/... to their absolute R2 URLs.
 *
 * Idempotent: rows already storing an absolute URL are skipped. Safe to re-run.
 *
 * Run from monorepo root:
 *   npx tsx frontend/scripts/migrate-avatars-to-r2.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import postgres from 'postgres';

loadEnv({ path: path.join(__dirname, '..', '.env.local') });

const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'backend', 'uploads', 'profile');

const required = [
  'DATABASE_URL',
  'R2_ACCOUNT_ID',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
] as const;

for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const bucket = process.env.R2_BUCKET_NAME!;
const publicBase = process.env.R2_PUBLIC_URL!.replace(/\/$/, '');

function mimeFor(ext: string): string {
  switch (ext.toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

async function main(): Promise<void> {
  const rows = await sql<{ id: number; profile_picture: string }[]>`
    SELECT id, profile_picture
    FROM users
    WHERE profile_picture IS NOT NULL
      AND profile_picture LIKE '/uploads/profile/%'
  `;

  console.log(`Found ${rows.length} legacy avatar row(s) to migrate.`);

  let migrated = 0;
  let missing = 0;

  for (const row of rows) {
    const basename = path.basename(row.profile_picture);
    const localPath = path.join(UPLOADS_DIR, basename);

    if (!fs.existsSync(localPath)) {
      console.warn(`  user ${row.id}: source file missing on disk (${localPath}) — skipping`);
      missing++;
      continue;
    }

    const key = `avatars/${basename}`;
    const ext = path.extname(basename);

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fs.readFileSync(localPath),
        ContentType: mimeFor(ext),
      }),
    );

    const absoluteUrl = `${publicBase}/${key}`;
    await sql`
      UPDATE users
      SET profile_picture = ${absoluteUrl}
      WHERE id = ${row.id}
    `;

    console.log(`  user ${row.id}: ${row.profile_picture} -> ${absoluteUrl}`);
    migrated++;
  }

  console.log(`\nDone. Migrated ${migrated}, missing ${missing}.`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
