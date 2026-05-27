import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { auth } from '@/lib/auth';
import { assertAdminAccess } from '@/lib/assertions';
import { db } from '@/lib/db/drizzle';
import { contractOrderDisputes, contractOrders } from '@/lib/db/schema/contracts';

interface StoredAttachment {
  r2Key: string;
  filename: string;
  size: number;
  mime: string;
}

/**
 * GET /api/contracts/:contractId/dispute-attachments?key=<r2Key>
 *
 * Returns a 302 redirect to a short-lived presigned R2 GET URL for the
 * requested dispute-evidence attachment. Authorized only when:
 *  1. The caller is the client or freelancer on the contract order, OR
 *     is an admin (admins need access while resolving disputes).
 *  2. The r2Key actually belongs to one of the disputes on this contract
 *     order (prevents using this endpoint as a generic R2 reader).
 *
 * Mirrors the service-order attachments route. There is no
 * contract_order_deliveries table — contracts have no separate delivery
 * artifacts — so this endpoint only serves dispute evidence.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contractId } = await params;
  if (!z.string().uuid().safeParse(contractId).success) {
    return NextResponse.json({ error: 'Invalid contract id' }, { status: 400 });
  }

  const r2Key = req.nextUrl.searchParams.get('key');
  if (!r2Key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  }

  const orders = await db
    .select({
      id: contractOrders.id,
      clientId: contractOrders.clientId,
      freelancerId: contractOrders.freelancerId,
    })
    .from(contractOrders)
    .where(eq(contractOrders.contractId, contractId))
    .limit(1);
  const order = orders[0];
  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const isAdmin = await assertAdminAccess(session.user.id);
  const isParticipant =
    session.user.id === order.clientId || session.user.id === order.freelancerId;
  if (!isAdmin && !isParticipant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const disputes = await db
    .select({ attachments: contractOrderDisputes.attachments })
    .from(contractOrderDisputes)
    .where(eq(contractOrderDisputes.contractOrderId, order.id));

  const allKeys = new Set<string>();
  for (const d of disputes) {
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
