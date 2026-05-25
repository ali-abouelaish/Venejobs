import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, ne, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';

const UpdateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  lastname: z.string().trim().max(255).optional().nullable(),
  username: z.string().trim().max(255).optional().nullable(),
  age: z.coerce.number().int().min(1).max(120).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  street_address: z.string().trim().max(255).optional().nullable(),
  apt_suite: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().max(255).optional().nullable(),
  state: z.string().trim().max(255).optional().nullable(),
  zip_code: z.string().trim().max(50).optional().nullable(),
  country: z.string().trim().max(255).optional().nullable(),
});

/** GET /api/users/me/profile — load the authenticated user's profile. */
export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      lastname: users.lastname,
      username: users.username,
      email: users.email,
      age: users.age,
      phone: users.phone,
      profile_picture: users.profilePicture,
      date_of_birth: users.dateOfBirth,
      street_address: users.streetAddress,
      apt_suite: users.aptSuite,
      city: users.city,
      state: users.state,
      zip_code: users.zipCode,
      country: users.country,
      is_email_verified: users.isEmailVerified,
    })
    .from(users)
    .where(eq(users.id, session.user.id));

  if (!row) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user: row });
}

/**
 * PUT /api/users/me/profile — update profile fields. Email is intentionally
 * read-only here to avoid running into the email-verification side of the
 * legacy auth flow; if the user wants to change email it goes through a
 * separate verification flow.
 */
export async function PUT(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Reject duplicate username (table-level unique). Only check if the user
  // is trying to change it to a non-empty value.
  if (d.username && d.username.trim()) {
    const dupe = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.username, d.username.trim()), ne(users.id, userId)))
      .limit(1);
    if (dupe.length > 0) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 },
      );
    }
  }

  // DOB: accept ISO or YYYY-MM-DD; empty/invalid clears.
  let dob: string | null = null;
  if (d.date_of_birth) {
    const parsedDob = new Date(d.date_of_birth);
    if (!isNaN(parsedDob.getTime())) dob = parsedDob.toISOString();
  }

  await db
    .update(users)
    .set({
      ...(d.name !== undefined ? { name: d.name } : {}),
      lastname: d.lastname ?? null,
      username: d.username && d.username.trim() ? d.username.trim() : null,
      age: d.age ?? null,
      phone: d.phone ?? null,
      dateOfBirth: dob,
      streetAddress: d.street_address ?? null,
      aptSuite: d.apt_suite ?? null,
      city: d.city ?? null,
      state: d.state ?? null,
      zipCode: d.zip_code ?? null,
      country: d.country ?? null,
      updatedAt: sql`NOW()`,
    })
    .where(eq(users.id, userId));

  return NextResponse.json({ success: true });
}
