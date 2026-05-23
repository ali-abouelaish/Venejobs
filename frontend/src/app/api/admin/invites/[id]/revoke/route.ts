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

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const deleted = await sql<{ id: string }[]>`
    DELETE FROM admin_invites
    WHERE id = ${id} AND accepted_at IS NULL
    RETURNING id
  `;

  if (deleted.length === 0) {
    return NextResponse.json({ error: 'Not found or already accepted' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
