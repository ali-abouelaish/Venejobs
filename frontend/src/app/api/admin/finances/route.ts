import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { assertAdminAccess } from '@/lib/assertions';
import { sql } from '@/lib/db';

export type TransactionType = 'payment' | 'payout' | 'commission' | 'refund';
export type TransactionSource = 'service' | 'contract';

export interface FinanceTransactionRow {
  /** Synthetic ID: `${source}-${orderId}-${type}` — stable for React keys. */
  id: string;
  occurredAt: string;
  type: TransactionType;
  source: TransactionSource;
  orderId: string;
  /** Money in pence/cents. Sign convention: positive = into platform, negative = out of platform. */
  amountPence: number;
  currency: string;
  counterpartyId: number | null;
  counterpartyName: string | null;
  state: string;
  refLabel: string | null;
}

export interface FinanceSummary {
  grossRevenuePence: number;
  commissionPence: number;
  paidOutPence: number;
  inEscrowPence: number;
  refundedPence: number;
  currency: string;
}

export interface FinancesResponse {
  summary: FinanceSummary;
  rows: FinanceTransactionRow[];
  total: number;
  page: number;
  pageSize: number;
}

const VALID_TYPES = new Set<TransactionType>(['payment', 'payout', 'commission', 'refund']);
const VALID_SOURCES = new Set<TransactionSource>(['service', 'contract']);
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 25;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await assertAdminAccess(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const params = req.nextUrl.searchParams;
  const typeParam = params.get('type');
  const sourceParam = params.get('source');
  const q = (params.get('q') ?? '').trim();
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(params.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
  );

  if (typeParam && !VALID_TYPES.has(typeParam as TransactionType)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }
  if (sourceParam && !VALID_SOURCES.has(sourceParam as TransactionSource)) {
    return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
  }

  const typeFilter = typeParam ? sql`AND type = ${typeParam}` : sql``;
  const sourceFilter = sourceParam ? sql`AND source = ${sourceParam}` : sql``;
  const qPattern = q ? `%${q.replace(/[%_]/g, '\\$&')}%` : null;
  const searchFilter = qPattern
    ? sql`AND (counterparty_name ILIKE ${qPattern} OR ref_label ILIKE ${qPattern})`
    : sql``;

  // Synthesize one row per money event from order tables. Service uses
  // base_price; contract uses amount. Payouts are net of commission.
  // Refunds emit a single negative-direction row.
  const txCte = sql`
    WITH transactions AS (
      -- Service payments (charged whenever the order has moved past initial)
      SELECT
        ('service-' || so.id::text || '-payment') AS id,
        so.created_at AS occurred_at,
        'payment'::text AS type,
        'service'::text AS source,
        so.id::text AS order_id,
        so.base_price AS amount_pence,
        so.currency,
        so.client_id AS counterparty_id,
        c.name AS counterparty_name,
        so.state,
        ('Service ' || COALESCE(s.title, so.id::text)) AS ref_label
      FROM service_orders so
      JOIN users c ON c.id = so.client_id
      LEFT JOIN services s ON s.id = so.service_id
      WHERE so.state != 'cancelled'

      UNION ALL

      -- Service payouts (to freelancer, net of commission)
      SELECT
        ('service-' || so.id::text || '-payout') AS id,
        COALESCE(so.accepted_at, so.updated_at) AS occurred_at,
        'payout'::text AS type,
        'service'::text AS source,
        so.id::text AS order_id,
        (so.base_price - (so.base_price::numeric * so.platform_fee_pct / 100)::int) AS amount_pence,
        so.currency,
        so.freelancer_id AS counterparty_id,
        f.name AS counterparty_name,
        so.state,
        ('Service ' || COALESCE(s.title, so.id::text)) AS ref_label
      FROM service_orders so
      JOIN users f ON f.id = so.freelancer_id
      LEFT JOIN services s ON s.id = so.service_id
      WHERE so.state IN ('accepted', 'auto_accepted', 'completed')

      UNION ALL

      -- Service commission (platform earns)
      SELECT
        ('service-' || so.id::text || '-commission') AS id,
        COALESCE(so.accepted_at, so.updated_at) AS occurred_at,
        'commission'::text AS type,
        'service'::text AS source,
        so.id::text AS order_id,
        (so.base_price::numeric * so.platform_fee_pct / 100)::int AS amount_pence,
        so.currency,
        NULL::int AS counterparty_id,
        'Platform'::text AS counterparty_name,
        so.state,
        ('Service ' || COALESCE(s.title, so.id::text)) AS ref_label
      FROM service_orders so
      LEFT JOIN services s ON s.id = so.service_id
      WHERE so.state IN ('accepted', 'auto_accepted', 'completed')

      UNION ALL

      -- Service refunds (to client)
      SELECT
        ('service-' || so.id::text || '-refund') AS id,
        so.updated_at AS occurred_at,
        'refund'::text AS type,
        'service'::text AS source,
        so.id::text AS order_id,
        so.base_price AS amount_pence,
        so.currency,
        so.client_id AS counterparty_id,
        c.name AS counterparty_name,
        so.state,
        ('Service ' || COALESCE(s.title, so.id::text)) AS ref_label
      FROM service_orders so
      JOIN users c ON c.id = so.client_id
      LEFT JOIN services s ON s.id = so.service_id
      WHERE so.state = 'refunded'

      UNION ALL

      -- Contract payments
      SELECT
        ('contract-' || co.id::text || '-payment') AS id,
        co.created_at AS occurred_at,
        'payment'::text AS type,
        'contract'::text AS source,
        co.id::text AS order_id,
        co.amount AS amount_pence,
        co.currency,
        co.client_id AS counterparty_id,
        c.name AS counterparty_name,
        co.state,
        ('Contract ' || substring(co.contract_id::text, 1, 8)) AS ref_label
      FROM contract_orders co
      JOIN users c ON c.id = co.client_id

      UNION ALL

      -- Contract payouts
      SELECT
        ('contract-' || co.id::text || '-payout') AS id,
        COALESCE(co.accepted_at, co.updated_at) AS occurred_at,
        'payout'::text AS type,
        'contract'::text AS source,
        co.id::text AS order_id,
        (co.amount - (co.amount::numeric * co.platform_fee_pct / 100)::int) AS amount_pence,
        co.currency,
        co.freelancer_id AS counterparty_id,
        f.name AS counterparty_name,
        co.state,
        ('Contract ' || substring(co.contract_id::text, 1, 8)) AS ref_label
      FROM contract_orders co
      JOIN users f ON f.id = co.freelancer_id
      WHERE co.state IN ('accepted', 'auto_accepted', 'completed')

      UNION ALL

      -- Contract commission
      SELECT
        ('contract-' || co.id::text || '-commission') AS id,
        COALESCE(co.accepted_at, co.updated_at) AS occurred_at,
        'commission'::text AS type,
        'contract'::text AS source,
        co.id::text AS order_id,
        (co.amount::numeric * co.platform_fee_pct / 100)::int AS amount_pence,
        co.currency,
        NULL::int AS counterparty_id,
        'Platform'::text AS counterparty_name,
        co.state,
        ('Contract ' || substring(co.contract_id::text, 1, 8)) AS ref_label
      FROM contract_orders co
      WHERE co.state IN ('accepted', 'auto_accepted', 'completed')

      UNION ALL

      -- Contract refunds
      SELECT
        ('contract-' || co.id::text || '-refund') AS id,
        co.updated_at AS occurred_at,
        'refund'::text AS type,
        'contract'::text AS source,
        co.id::text AS order_id,
        co.amount AS amount_pence,
        co.currency,
        co.client_id AS counterparty_id,
        c.name AS counterparty_name,
        co.state,
        ('Contract ' || substring(co.contract_id::text, 1, 8)) AS ref_label
      FROM contract_orders co
      JOIN users c ON c.id = co.client_id
      WHERE co.state = 'refunded'
    )
  `;

  const offset = (page - 1) * pageSize;

  const [rows, totals, summaryRows] = await Promise.all([
    sql<{
      id: string;
      occurred_at: string;
      type: TransactionType;
      source: TransactionSource;
      order_id: string;
      amount_pence: number;
      currency: string;
      counterparty_id: number | null;
      counterparty_name: string | null;
      state: string;
      ref_label: string | null;
    }[]>`
      ${txCte}
      SELECT * FROM transactions
      WHERE TRUE ${typeFilter} ${sourceFilter} ${searchFilter}
      ORDER BY occurred_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `,
    sql<{ total: number }[]>`
      ${txCte}
      SELECT COUNT(*)::int AS total FROM transactions
      WHERE TRUE ${typeFilter} ${sourceFilter} ${searchFilter}
    `,
    sql<{
      gross: string;
      commission: string;
      paid_out: string;
      in_escrow: string;
      refunded: string;
    }[]>`
      ${txCte}
      SELECT
        COALESCE(SUM(CASE WHEN type = 'payment' THEN amount_pence ELSE 0 END)::bigint, 0)::text AS gross,
        COALESCE(SUM(CASE WHEN type = 'commission' THEN amount_pence ELSE 0 END)::bigint, 0)::text AS commission,
        COALESCE(SUM(CASE WHEN type = 'payout' THEN amount_pence ELSE 0 END)::bigint, 0)::text AS paid_out,
        COALESCE(SUM(CASE WHEN type = 'payment' AND state NOT IN ('accepted','auto_accepted','completed','refunded','cancelled') THEN amount_pence ELSE 0 END)::bigint, 0)::text AS in_escrow,
        COALESCE(SUM(CASE WHEN type = 'refund' THEN amount_pence ELSE 0 END)::bigint, 0)::text AS refunded
      FROM transactions
    `,
  ]);

  const body: FinancesResponse = {
    summary: {
      grossRevenuePence: Number(summaryRows[0]?.gross ?? '0'),
      commissionPence: Number(summaryRows[0]?.commission ?? '0'),
      paidOutPence: Number(summaryRows[0]?.paid_out ?? '0'),
      inEscrowPence: Number(summaryRows[0]?.in_escrow ?? '0'),
      refundedPence: Number(summaryRows[0]?.refunded ?? '0'),
      currency: 'gbp',
    },
    rows: rows.map((r) => ({
      id: r.id,
      occurredAt: r.occurred_at,
      type: r.type,
      source: r.source,
      orderId: r.order_id,
      amountPence: r.amount_pence,
      currency: r.currency,
      counterpartyId: r.counterparty_id,
      counterpartyName: r.counterparty_name,
      state: r.state,
      refLabel: r.ref_label,
    })),
    total: totals[0]?.total ?? 0,
    page,
    pageSize,
  };

  return NextResponse.json(body);
}
