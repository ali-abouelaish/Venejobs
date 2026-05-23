import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { assertAdminAccess } from '@/lib/assertions';
import { sql } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await assertAdminAccess(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }
  if (id === session.user.id) {
    return NextResponse.json({ error: 'Cannot suspend yourself' }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as { reason?: unknown };
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (reason.length < 10) {
    return NextResponse.json({ error: 'Reason must be at least 10 characters' }, { status: 400 });
  }

  const target = await sql<{ id: number; role: string | null }[]>`
    SELECT u.id, r.name AS role
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE u.id = ${id}
    LIMIT 1
  `;
  if (target.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (target[0].role === 'admin') {
    return NextResponse.json({ error: 'Cannot suspend an admin' }, { status: 403 });
  }

  await sql`
    UPDATE users
    SET suspended_at = NOW(), suspension_reason = ${reason}, updated_at = NOW()
    WHERE id = ${id}
  `;

  return NextResponse.json({ ok: true });
}
