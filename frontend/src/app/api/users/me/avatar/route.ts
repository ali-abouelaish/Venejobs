import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png']);
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB — matches legacy backend limit

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid form data' }, { status: 400 });
  }

  const file = form.get('profile_picture');
  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, message: 'Profile image is required' },
      { status: 400 },
    );
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { success: false, message: 'Only JPG, JPEG, PNG images allowed' },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { success: false, message: 'File exceeds 2 MB limit' },
      { status: 400 },
    );
  }

  const accountId = process.env.R2_ACCOUNT_ID!;
  const bucketName = process.env.R2_BUCKET_NAME!;
  const publicUrl = process.env.R2_PUBLIC_URL!;

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const ext = (file.name.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? '').toLowerCase();
  const key = `avatars/profile-${session.user.id}-${Date.now()}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: bytes,
      ContentType: file.type,
      ContentLength: file.size,
    }),
  );

  const absoluteUrl = `${publicUrl.replace(/\/$/, '')}/${key}`;

  await sql`
    UPDATE users
    SET profile_picture = ${absoluteUrl}
    WHERE id = ${session.user.id}
  `;

  return NextResponse.json({
    success: true,
    message: 'Profile picture updated successfully',
    data: { profile_picture: absoluteUrl },
  });
}
