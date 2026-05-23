import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { assertAdminAccess } from '@/lib/assertions';
import { sql } from '@/lib/db';

export interface AdminOverviewResponse {
  users: {
    total: number;
    admins: number;
    clients: number;
    freelancers: number;
    suspended: number;
    signups7d: number;
  };
  services: {
    pendingReview: number;
  };
  disputes: {
    openService: number;
    openContract: number;
  };
  orders: {
    activeJobOrders: number;
    activeServiceOrders: number;
    activeContractOrders: number;
  };
  /**
   * Gross payment volume and platform commission across earned service +
   * contract orders. Earned states: accepted, auto_accepted, completed.
   * Legacy `orders` are excluded because they predate platform fees.
   * Amounts are in pence (integer).
   */
  finance: {
    grossRevenuePence: number;
    commissionPence: number;
    grossRevenue30dPence: number;
    commission30dPence: number;
    currency: string;
  };
  recentSignups: {
    id: number;
    name: string;
    email: string;
    role: string | null;
    createdAt: string;
  }[];
}

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await assertAdminAccess(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [
    userCounts,
    servicesCount,
    serviceDisputes,
    contractDisputes,
    jobOrders,
    serviceOrders,
    contractOrders,
    financeAll,
    finance30d,
    recentSignups,
  ] = await Promise.all([
    sql<{ total: number; admins: number; clients: number; freelancers: number; suspended: number; signups7d: number }[]>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE r.name = 'admin')::int AS admins,
        COUNT(*) FILTER (WHERE r.name = 'client')::int AS clients,
        COUNT(*) FILTER (WHERE r.name = 'freelancer')::int AS freelancers,
        COUNT(*) FILTER (WHERE u.suspended_at IS NOT NULL)::int AS suspended,
        COUNT(*) FILTER (WHERE u.created_at > NOW() - INTERVAL '7 days')::int AS signups7d
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
    `,
    sql<{ c: number }[]>`SELECT COUNT(*)::int AS c FROM services WHERE status = 'pending_review'`,
    sql<{ c: number }[]>`SELECT COUNT(*)::int AS c FROM service_order_disputes WHERE resolved_at IS NULL`,
    sql<{ c: number }[]>`SELECT COUNT(*)::int AS c FROM contract_order_disputes WHERE resolved_at IS NULL`,
    sql<{ c: number }[]>`SELECT COUNT(*)::int AS c FROM orders WHERE status = 'active'`,
    sql<{ c: number }[]>`SELECT COUNT(*)::int AS c FROM service_orders WHERE state NOT IN ('accepted', 'auto_accepted', 'completed', 'cancelled', 'refunded')`,
    sql<{ c: number }[]>`SELECT COUNT(*)::int AS c FROM contract_orders WHERE state NOT IN ('accepted', 'auto_accepted', 'completed', 'refunded')`,
    sql<{ gross: string | null; commission: string | null }[]>`
      SELECT
        COALESCE(SUM(amount)::bigint, 0)::text AS gross,
        COALESCE(SUM((amount::numeric * platform_fee_pct / 100))::bigint, 0)::text AS commission
      FROM (
        SELECT base_price AS amount, platform_fee_pct
        FROM service_orders
        WHERE state IN ('accepted', 'auto_accepted', 'completed')
        UNION ALL
        SELECT amount, platform_fee_pct
        FROM contract_orders
        WHERE state IN ('accepted', 'auto_accepted', 'completed')
      ) t
    `,
    sql<{ gross: string | null; commission: string | null }[]>`
      SELECT
        COALESCE(SUM(amount)::bigint, 0)::text AS gross,
        COALESCE(SUM((amount::numeric * platform_fee_pct / 100))::bigint, 0)::text AS commission
      FROM (
        SELECT base_price AS amount, platform_fee_pct
        FROM service_orders
        WHERE state IN ('accepted', 'auto_accepted', 'completed')
          AND COALESCE(accepted_at, updated_at) > NOW() - INTERVAL '30 days'
        UNION ALL
        SELECT amount, platform_fee_pct
        FROM contract_orders
        WHERE state IN ('accepted', 'auto_accepted', 'completed')
          AND COALESCE(accepted_at, updated_at) > NOW() - INTERVAL '30 days'
      ) t
    `,
    sql<{ id: number; name: string; email: string; role: string | null; created_at: string }[]>`
      SELECT u.id, u.name, u.email, r.name AS role, u.created_at
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      ORDER BY u.created_at DESC
      LIMIT 10
    `,
  ]);

  const body: AdminOverviewResponse = {
    users: {
      total: userCounts[0]?.total ?? 0,
      admins: userCounts[0]?.admins ?? 0,
      clients: userCounts[0]?.clients ?? 0,
      freelancers: userCounts[0]?.freelancers ?? 0,
      suspended: userCounts[0]?.suspended ?? 0,
      signups7d: userCounts[0]?.signups7d ?? 0,
    },
    services: {
      pendingReview: servicesCount[0]?.c ?? 0,
    },
    disputes: {
      openService: serviceDisputes[0]?.c ?? 0,
      openContract: contractDisputes[0]?.c ?? 0,
    },
    orders: {
      activeJobOrders: jobOrders[0]?.c ?? 0,
      activeServiceOrders: serviceOrders[0]?.c ?? 0,
      activeContractOrders: contractOrders[0]?.c ?? 0,
    },
    finance: {
      grossRevenuePence: Number(financeAll[0]?.gross ?? '0'),
      commissionPence: Number(financeAll[0]?.commission ?? '0'),
      grossRevenue30dPence: Number(finance30d[0]?.gross ?? '0'),
      commission30dPence: Number(finance30d[0]?.commission ?? '0'),
      currency: 'gbp',
    },
    recentSignups: recentSignups.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      createdAt: r.created_at,
    })),
  };

  return NextResponse.json(body);
}
