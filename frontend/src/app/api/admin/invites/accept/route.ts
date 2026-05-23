import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from '@/lib/db';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export interface AcceptInvitePreview {
  email: string;
  existingUser: boolean;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }
  const tokenHash = hashToken(token);

  const rows = await sql<{ email: string; expires_at: string; accepted_at: string | null }[]>`
    SELECT email, expires_at, accepted_at
    FROM admin_invites
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }
  const inv = rows[0];
  if (inv.accepted_at) {
    return NextResponse.json({ error: 'Invite already accepted' }, { status: 410 });
  }
  if (new Date(inv.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Invite expired' }, { status: 410 });
  }

  const existing = await sql<{ id: number }[]>`
    SELECT id FROM users WHERE email = ${inv.email} LIMIT 1
  `;

  const body: AcceptInvitePreview = {
    email: inv.email,
    existingUser: existing.length > 0,
  };
  return NextResponse.json(body);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json().catch(() => ({}))) as {
    token?: unknown;
    password?: unknown;
    name?: unknown;
    lastname?: unknown;
  };
  const token = typeof body.token === 'string' ? body.token : '';
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }
  const password = typeof body.password === 'string' ? body.password : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const lastname = typeof body.lastname === 'string' ? body.lastname.trim() : '';

  const tokenHash = hashToken(token);

  const invRows = await sql<{
    id: string;
    email: string;
    expires_at: string;
    accepted_at: string | null;
  }[]>`
    SELECT id, email, expires_at, accepted_at
    FROM admin_invites
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `;
  if (invRows.length === 0) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }
  const inv = invRows[0];
  if (inv.accepted_at) {
    return NextResponse.json({ error: 'Invite already accepted' }, { status: 410 });
  }
  if (new Date(inv.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Invite expired' }, { status: 410 });
  }

  const roles = await sql<{ id: number }[]>`
    SELECT id FROM roles WHERE name = 'admin' LIMIT 1
  `;
  if (roles.length === 0) {
    return NextResponse.json({ error: 'Admin role not configured' }, { status: 500 });
  }
  const adminRoleId = roles[0].id;

  const existing = await sql<{ id: number; password: string }[]>`
    SELECT id, password FROM users WHERE email = ${inv.email} LIMIT 1
  `;

  let userId: number;

  if (existing.length > 0) {
    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }
    const ok = await bcrypt.compare(password, existing[0].password);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    userId = existing[0].id;
    await sql.begin(async (tx) => {
      await tx`
        UPDATE users SET role_id = ${adminRoleId}, updated_at = NOW() WHERE id = ${userId}
      `;
      await tx`
        UPDATE admin_invites
        SET accepted_at = NOW(), accepted_user_id = ${userId}
        WHERE id = ${inv.id}
      `;
    });
  } else {
    if (!name || name.length < 1) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 10);
    const inserted = await sql.begin(async (tx) => {
      const created = await tx<{ id: number }[]>`
        INSERT INTO users (name, lastname, email, password, role_id, is_email_verified, created_at, updated_at)
        VALUES (${name}, ${lastname || null}, ${inv.email}, ${hashed}, ${adminRoleId}, true, NOW(), NOW())
        RETURNING id
      `;
      const newUserId = created[0].id;
      await tx`
        UPDATE admin_invites
        SET accepted_at = NOW(), accepted_user_id = ${newUserId}
        WHERE id = ${inv.id}
      `;
      return newUserId;
    });
    userId = inserted as unknown as number;
  }

  const jwtToken = jwt.sign(
    { userId: { id: userId, role: 'admin' } },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] ?? '7d' },
  );

  const response = NextResponse.json({ ok: true, userId });
  response.cookies.set('token', jwtToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
