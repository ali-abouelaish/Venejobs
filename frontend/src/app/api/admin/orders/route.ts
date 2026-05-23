import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { assertAdminAccess } from '@/lib/assertions';
import { sql } from '@/lib/db';

export type AdminOrderType = 'job' | 'service' | 'contract';

export interface AdminOrderRow {
  id: string;
  type: AdminOrderType;
  clientId: number | null;
  clientName: string | null;
  freelancerId: number | null;
  freelancerName: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  refLabel: string | null;
}

export interface AdminOrdersResponse {
  rows: AdminOrderRow[];
  total: number;
  page: number;
  pageSize: number;
}

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 25;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await assertAdminAccess(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const params = req.nextUrl.searchParams;
  const type = (params.get('type') ?? 'job') as AdminOrderType;
  if (type !== 'job' && type !== 'service' && type !== 'contract') {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }
  const status = params.get('status') ?? '';
  const q = (params.get('q') ?? '').trim();
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(params.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
  );
  const offset = (page - 1) * pageSize;
  const qPattern = q ? `%${q.replace(/[%_]/g, '\\$&')}%` : null;

  if (type === 'job') {
    const statusFilter = status ? sql`AND o.status = ${status}` : sql``;
    const searchFilter = qPattern
      ? sql`AND (c.name ILIKE ${qPattern} OR f.name ILIKE ${qPattern} OR c.email ILIKE ${qPattern} OR f.email ILIKE ${qPattern})`
      : sql``;
    const [rows, totals] = await Promise.all([
      sql<{
        id: number;
        client_id: number;
        client_name: string;
        freelancer_id: number;
        freelancer_name: string;
        amount: number;
        status: string;
        created_at: string;
        job_id: number | null;
      }[]>`
        SELECT o.id, o.client_id, c.name AS client_name, o.freelancer_id, f.name AS freelancer_name,
               o.amount, o.status, o.created_at, o.job_id
        FROM orders o
        JOIN users c ON c.id = o.client_id
        JOIN users f ON f.id = o.freelancer_id
        WHERE TRUE ${statusFilter} ${searchFilter}
        ORDER BY o.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
      sql<{ total: number }[]>`
        SELECT COUNT(*)::int AS total
        FROM orders o
        JOIN users c ON c.id = o.client_id
        JOIN users f ON f.id = o.freelancer_id
        WHERE TRUE ${statusFilter} ${searchFilter}
      `,
    ]);
    const body: AdminOrdersResponse = {
      rows: rows.map((r) => ({
        id: String(r.id),
        type: 'job',
        clientId: r.client_id,
        clientName: r.client_name,
        freelancerId: r.freelancer_id,
        freelancerName: r.freelancer_name,
        amount: r.amount,
        currency: 'gbp',
        status: r.status,
        createdAt: r.created_at,
        refLabel: r.job_id ? `Job #${r.job_id}` : null,
      })),
      total: totals[0]?.total ?? 0,
      page,
      pageSize,
    };
    return NextResponse.json(body);
  }

  if (type === 'service') {
    const statusFilter = status ? sql`AND so.state = ${status}` : sql``;
    const searchFilter = qPattern
      ? sql`AND (c.name ILIKE ${qPattern} OR f.name ILIKE ${qPattern} OR c.email ILIKE ${qPattern} OR f.email ILIKE ${qPattern} OR s.title ILIKE ${qPattern})`
      : sql``;
    const [rows, totals] = await Promise.all([
      sql<{
        id: string;
        client_id: number;
        client_name: string;
        freelancer_id: number;
        freelancer_name: string;
        base_price: number;
        currency: string;
        state: string;
        created_at: string;
        service_title: string | null;
      }[]>`
        SELECT so.id, so.client_id, c.name AS client_name, so.freelancer_id, f.name AS freelancer_name,
               so.base_price, so.currency, so.state, so.created_at, s.title AS service_title
        FROM service_orders so
        JOIN users c ON c.id = so.client_id
        JOIN users f ON f.id = so.freelancer_id
        LEFT JOIN services s ON s.id = so.service_id
        WHERE TRUE ${statusFilter} ${searchFilter}
        ORDER BY so.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
      sql<{ total: number }[]>`
        SELECT COUNT(*)::int AS total
        FROM service_orders so
        JOIN users c ON c.id = so.client_id
        JOIN users f ON f.id = so.freelancer_id
        LEFT JOIN services s ON s.id = so.service_id
        WHERE TRUE ${statusFilter} ${searchFilter}
      `,
    ]);
    const body: AdminOrdersResponse = {
      rows: rows.map((r) => ({
        id: r.id,
        type: 'service',
        clientId: r.client_id,
        clientName: r.client_name,
        freelancerId: r.freelancer_id,
        freelancerName: r.freelancer_name,
        amount: r.base_price,
        currency: r.currency,
        status: r.state,
        createdAt: r.created_at,
        refLabel: r.service_title,
      })),
      total: totals[0]?.total ?? 0,
      page,
      pageSize,
    };
    return NextResponse.json(body);
  }

  // contract
  const statusFilter = status ? sql`AND co.state = ${status}` : sql``;
  const searchFilter = qPattern
    ? sql`AND (c.name ILIKE ${qPattern} OR f.name ILIKE ${qPattern} OR c.email ILIKE ${qPattern} OR f.email ILIKE ${qPattern})`
    : sql``;
  const [rows, totals] = await Promise.all([
    sql<{
      id: string;
      client_id: number;
      client_name: string;
      freelancer_id: number;
      freelancer_name: string;
      amount: number;
      currency: string;
      state: string;
      created_at: string;
      contract_id: string;
    }[]>`
      SELECT co.id, co.client_id, c.name AS client_name, co.freelancer_id, f.name AS freelancer_name,
             co.amount, co.currency, co.state, co.created_at, co.contract_id
      FROM contract_orders co
      JOIN users c ON c.id = co.client_id
      JOIN users f ON f.id = co.freelancer_id
      WHERE TRUE ${statusFilter} ${searchFilter}
      ORDER BY co.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `,
    sql<{ total: number }[]>`
      SELECT COUNT(*)::int AS total
      FROM contract_orders co
      JOIN users c ON c.id = co.client_id
      JOIN users f ON f.id = co.freelancer_id
      WHERE TRUE ${statusFilter} ${searchFilter}
    `,
  ]);
  const body: AdminOrdersResponse = {
    rows: rows.map((r) => ({
      id: r.id,
      type: 'contract',
      clientId: r.client_id,
      clientName: r.client_name,
      freelancerId: r.freelancer_id,
      freelancerName: r.freelancer_name,
      amount: r.amount,
      currency: r.currency,
      status: r.state,
      createdAt: r.created_at,
      refLabel: `Contract ${r.contract_id.slice(0, 8)}`,
    })),
    total: totals[0]?.total ?? 0,
    page,
    pageSize,
  };
  return NextResponse.json(body);
}
