import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { assertAdminAccess } from '@/lib/assertions';
import { sql } from '@/lib/db';

export async function POST(
  _req: NextRequest,
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

  const result = await sql<{ id: number }[]>`
    UPDATE users
    SET suspended_at = NULL, suspension_reason = NULL, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id
  `;
  if (result.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
