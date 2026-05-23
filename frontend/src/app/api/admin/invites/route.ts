import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { auth } from '@/lib/auth';
import { assertAdminAccess } from '@/lib/assertions';
import { sql } from '@/lib/db';
import { sendEmail } from '@/lib/email/client';

export interface AdminInviteRow {
  id: string;
  email: string;
  invitedByName: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  acceptedUserId: number | null;
  createdAt: string;
  status: 'pending' | 'accepted' | 'expired';
}

const INVITE_TTL_DAYS = 7;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await assertAdminAccess(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rows = await sql<{
    id: string;
    email: string;
    invited_by_name: string | null;
    expires_at: string;
    accepted_at: string | null;
    accepted_user_id: number | null;
    created_at: string;
  }[]>`
    SELECT
      ai.id,
      ai.email,
      inviter.name AS invited_by_name,
      ai.expires_at,
      ai.accepted_at,
      ai.accepted_user_id,
      ai.created_at
    FROM admin_invites ai
    LEFT JOIN users inviter ON inviter.id = ai.invited_by
    WHERE ai.accepted_at IS NOT NULL
       OR ai.created_at > NOW() - INTERVAL '30 days'
    ORDER BY ai.created_at DESC
  `;

  const now = Date.now();
  const body: AdminInviteRow[] = rows.map((r) => ({
    id: r.id,
    email: r.email,
    invitedByName: r.invited_by_name,
    expiresAt: r.expires_at,
    acceptedAt: r.accepted_at,
    acceptedUserId: r.accepted_user_id,
    createdAt: r.created_at,
    status: r.accepted_at
      ? 'accepted'
      : new Date(r.expires_at).getTime() < now
        ? 'expired'
        : 'pending',
  }));

  return NextResponse.json(body);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await assertAdminAccess(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { email?: unknown };
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  const [inserted] = await sql<{ id: string }[]>`
    INSERT INTO admin_invites (email, token_hash, invited_by, expires_at)
    VALUES (${email}, ${tokenHash}, ${session.user.id}, ${expiresAt.toISOString()})
    RETURNING id
  `;

  const origin = req.nextUrl.origin;
  const acceptUrl = `${origin}/admin/accept-invite/${token}`;

  const html = `
    <p>Hi,</p>
    <p>${session.user.name} invited you to join Venejobs as an administrator.</p>
    <p><a href="${acceptUrl}">Accept invitation</a></p>
    <p>This link expires in ${INVITE_TTL_DAYS} days. If you didn't expect this email, ignore it.</p>
  `;

  try {
    await sendEmail({
      to: [{ email }],
      subject: 'You have been invited to be a Venejobs admin',
      html,
    });
  } catch (err) {
    console.error('[admin-invite] email send failed', err);
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}
