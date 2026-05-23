import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { assertAdminAccess } from '@/lib/assertions';
import { sql } from '@/lib/db';

export interface AdminUserDetail {
  id: number;
  name: string;
  lastname: string | null;
  email: string;
  username: string | null;
  phone: string | null;
  role: string | null;
  profilePicture: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  suspendedAt: string | null;
  suspensionReason: string | null;
  freelancerProfile: {
    title: string | null;
    bio: string | null;
    hourlyRate: number | null;
  } | null;
  counts: {
    jobs: number;
    proposals: number;
    services: number;
    jobOrders: number;
    serviceOrders: number;
    contractOrders: number;
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await assertAdminAccess(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  const rows = await sql<{
    id: number;
    name: string;
    lastname: string | null;
    email: string;
    username: string | null;
    phone: string | null;
    role: string | null;
    profile_picture: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    is_email_verified: boolean | null;
    is_phone_verified: boolean | null;
    last_login: string | null;
    created_at: string;
    suspended_at: string | null;
    suspension_reason: string | null;
    fp_title: string | null;
    fp_bio: string | null;
    fp_hourly_rate: number | null;
  }[]>`
    SELECT
      u.id,
      u.name,
      u.lastname,
      u.email,
      u.username,
      u.phone,
      r.name AS role,
      u.profile_picture,
      u.city,
      u.state,
      u.country,
      u.is_email_verified,
      u.is_phone_verified,
      u.last_login,
      u.created_at,
      u.suspended_at,
      u.suspension_reason,
      fp.professional_title AS fp_title,
      fp.overview AS fp_bio,
      fp.hourly_rate AS fp_hourly_rate
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    LEFT JOIN freelancer_profiles fp ON fp.user_id = u.id
    WHERE u.id = ${id}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const u = rows[0];

  const counts = await sql<{
    jobs: number;
    proposals: number;
    services: number;
    job_orders: number;
    service_orders: number;
    contract_orders: number;
  }[]>`
    SELECT
      (SELECT COUNT(*)::int FROM jobs WHERE client_id = ${id}) AS jobs,
      (SELECT COUNT(*)::int FROM proposals WHERE freelancer_id = ${id}) AS proposals,
      (SELECT COUNT(*)::int FROM services WHERE freelancer_id = ${id}) AS services,
      (SELECT COUNT(*)::int FROM orders WHERE client_id = ${id} OR freelancer_id = ${id}) AS job_orders,
      (SELECT COUNT(*)::int FROM service_orders WHERE client_id = ${id} OR freelancer_id = ${id}) AS service_orders,
      (SELECT COUNT(*)::int FROM contract_orders WHERE client_id = ${id} OR freelancer_id = ${id}) AS contract_orders
  `;

  const c = counts[0];

  const body: AdminUserDetail = {
    id: u.id,
    name: u.name,
    lastname: u.lastname,
    email: u.email,
    username: u.username,
    phone: u.phone,
    role: u.role,
    profilePicture: u.profile_picture,
    city: u.city,
    state: u.state,
    country: u.country,
    isEmailVerified: !!u.is_email_verified,
    isPhoneVerified: !!u.is_phone_verified,
    lastLogin: u.last_login,
    createdAt: u.created_at,
    suspendedAt: u.suspended_at,
    suspensionReason: u.suspension_reason,
    freelancerProfile:
      u.fp_title || u.fp_bio || u.fp_hourly_rate !== null
        ? { title: u.fp_title, bio: u.fp_bio, hourlyRate: u.fp_hourly_rate }
        : null,
    counts: {
      jobs: c?.jobs ?? 0,
      proposals: c?.proposals ?? 0,
      services: c?.services ?? 0,
      jobOrders: c?.job_orders ?? 0,
      serviceOrders: c?.service_orders ?? 0,
      contractOrders: c?.contract_orders ?? 0,
    },
  };

  return NextResponse.json(body);
}
