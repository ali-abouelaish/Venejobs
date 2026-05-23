import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { assertAdminAccess } from '@/lib/assertions';
import { sql } from '@/lib/db';

export interface AdminUserRow {
  id: number;
  name: string;
  lastname: string | null;
  email: string;
  username: string | null;
  role: string | null;
  profilePicture: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  suspendedAt: string | null;
  jobsCount: number;
  proposalsCount: number;
  servicesCount: number;
  ordersCount: number;
}

export interface AdminUsersListResponse {
  rows: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
}

const VALID_ROLES = new Set(['admin', 'client', 'freelancer', 'suspended', 'all']);
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 25;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await assertAdminAccess(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const params = req.nextUrl.searchParams;
  const q = (params.get('q') ?? '').trim();
  const role = params.get('role') ?? 'all';
  if (!VALID_ROLES.has(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(params.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
  );
  const offset = (page - 1) * pageSize;

  const qPattern = q ? `%${q.replace(/[%_]/g, '\\$&')}%` : null;

  const roleFilter = role === 'suspended'
    ? sql`u.suspended_at IS NOT NULL`
    : role === 'all'
      ? sql`TRUE`
      : sql`r.name = ${role} AND u.suspended_at IS NULL`;

  const searchFilter = qPattern
    ? sql`(
        u.name ILIKE ${qPattern}
        OR COALESCE(u.lastname, '') ILIKE ${qPattern}
        OR u.email ILIKE ${qPattern}
        OR COALESCE(u.username, '') ILIKE ${qPattern}
      )`
    : sql`TRUE`;

  const [rows, totalRows] = await Promise.all([
    sql<(Omit<AdminUserRow, 'jobsCount' | 'proposalsCount' | 'servicesCount' | 'ordersCount'> & {
      jobs_count: number;
      proposals_count: number;
      services_count: number;
      orders_count: number;
    })[]>`
      SELECT
        u.id,
        u.name,
        u.lastname,
        u.email,
        u.username,
        r.name AS role,
        u.profile_picture AS "profilePicture",
        COALESCE(u.is_email_verified, false) AS "isEmailVerified",
        COALESCE(u.is_phone_verified, false) AS "isPhoneVerified",
        u.last_login AS "lastLogin",
        u.created_at AS "createdAt",
        u.suspended_at AS "suspendedAt",
        (SELECT COUNT(*)::int FROM jobs WHERE client_id = u.id) AS jobs_count,
        (SELECT COUNT(*)::int FROM proposals WHERE freelancer_id = u.id) AS proposals_count,
        (SELECT COUNT(*)::int FROM services WHERE freelancer_id = u.id) AS services_count,
        (SELECT COUNT(*)::int FROM orders WHERE client_id = u.id OR freelancer_id = u.id) AS orders_count
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE ${roleFilter} AND ${searchFilter}
      ORDER BY u.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `,
    sql<{ total: number }[]>`
      SELECT COUNT(*)::int AS total
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE ${roleFilter} AND ${searchFilter}
    `,
  ]);

  const body: AdminUsersListResponse = {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      lastname: r.lastname,
      email: r.email,
      username: r.username,
      role: r.role,
      profilePicture: r.profilePicture,
      isEmailVerified: r.isEmailVerified,
      isPhoneVerified: r.isPhoneVerified,
      lastLogin: r.lastLogin,
      createdAt: r.createdAt,
      suspendedAt: r.suspendedAt,
      jobsCount: r.jobs_count,
      proposalsCount: r.proposals_count,
      servicesCount: r.services_count,
      ordersCount: r.orders_count,
    })),
    total: totalRows[0]?.total ?? 0,
    page,
    pageSize,
  };

  return NextResponse.json(body);
}
