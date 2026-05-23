import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { auth } from '@/lib/auth';
import { assertServiceOrderParticipant } from '@/lib/assertions';
import { db } from '@/lib/db/drizzle';
import { serviceOrderDeliveries } from '@/lib/db/schema/services';

interface StoredAttachment {
  r2Key: string;
  filename: string;
  size: number;
  mime: string;
}

/**
 * GET /api/service-orders/:id/attachments?key=<r2Key>
 *
 * Returns a 302 redirect to a short-lived presigned R2 GET URL for the
 * requested attachment. Authorized only when:
 *  1. The caller is a participant of the order (client or freelancer)
 *  2. The r2Key actually belongs to one of the deliveries on this order
 *     (prevents the endpoint from being used as a generic R2 reader)
 *
 * This keeps the bucket private while letting the participants click
 * download links from the order detail page.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: orderId } = await params;
  if (!z.string().uuid().safeParse(orderId).success) {
    return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
  }

  const r2Key = req.nextUrl.searchParams.get('key');
  if (!r2Key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  }

  const access = await assertServiceOrderParticipant(orderId, session.user.id);
  if (!access) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Confirm the requested r2Key appears in one of this order's deliveries.
  // attachments column is jsonb; iterate in JS rather than crafting a JSON
  // query, since the per-order delivery count is small.
  const deliveries = await db
    .select({ attachments: serviceOrderDeliveries.attachments })
    .from(serviceOrderDeliveries)
    .where(eq(serviceOrderDeliveries.orderId, orderId));

  const allKeys = new Set<string>();
  for (const d of deliveries) {
    const list = (d.attachments ?? []) as StoredAttachment[];
    for (const a of list) {
      if (a?.r2Key) allKeys.add(a.r2Key);
    }
  }
  if (!allKeys.has(r2Key)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const bucketName = process.env.R2_BUCKET_NAME;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !bucketName || !accessKeyId || !secretAccessKey) {
    return NextResponse.json(
      { error: 'Storage not configured' },
      { status: 500 },
    );
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucketName, Key: r2Key }),
    { expiresIn: 300 },
  );

  return NextResponse.redirect(url, 302);
}
