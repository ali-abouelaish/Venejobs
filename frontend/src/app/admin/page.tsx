'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  AdminLayout,
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  formatPrice,
  relTimeOrFallback,
} from '../services-ui';
import type { AdminOverviewResponse } from '../api/admin/overview/route';

export default function AdminOverviewPage() {
  return (
    <AdminLayout title="Admin Overview">
      <Inner />
    </AdminLayout>
  );
}

function Inner() {
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/overview');
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Failed to load');
      setData(body as AdminOverviewResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <PageHeader title="Overview" subtitle="Live counts and recent activity across the platform." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <Skeleton width="40%" height={12} style={{ marginBottom: 8 }} />
              <Skeleton width="60%" height={28} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState title="Could not load overview" body={error ?? 'No data.'} onRetry={load} />;
  }

  const pendingWork = [
    { label: 'Services awaiting review', count: data.services.pendingReview, href: '/admin/services' },
    { label: 'Open service-order disputes', count: data.disputes.openService, href: '/admin/disputes' },
    { label: 'Open contract disputes', count: data.disputes.openContract, href: '/admin/contract-disputes' },
  ];

  const totalActiveOrders =
    data.orders.activeJobOrders + data.orders.activeServiceOrders + data.orders.activeContractOrders;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader title="Overview" subtitle="Live counts and recent activity across the platform." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <KpiTile label="Users" value={String(data.users.total)} hint={`${data.users.signups7d} in last 7 days`} href="/admin/users" />
        <KpiTile label="Services pending" value={String(data.services.pendingReview)} hint="Awaiting review" href="/admin/services" />
        <KpiTile label="Open disputes" value={String(data.disputes.openService + data.disputes.openContract)} hint={`${data.disputes.openService} service + ${data.disputes.openContract} contract`} href="/admin/disputes" />
        <KpiTile label="Active orders" value={String(totalActiveOrders)} hint="Across job/service/contract" href="/admin/orders" />
        <KpiTile label="Suspended users" value={String(data.users.suspended)} hint="Currently blocked" href="/admin/users?role=suspended" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <FinanceTile
          label="Gross revenue"
          value={formatPrice(data.finance.grossRevenuePence, { currency: data.finance.currency })}
          hint={`${formatPrice(data.finance.grossRevenue30dPence, { currency: data.finance.currency })} in last 30 days`}
          tone="info"
        />
        <FinanceTile
          label="Platform commission"
          value={formatPrice(data.finance.commissionPence, { currency: data.finance.currency })}
          hint={`${formatPrice(data.finance.commission30dPence, { currency: data.finance.currency })} in last 30 days`}
          tone="success"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', margin: '0 0 16px' }}>
            Pending work
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingWork.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--bg-muted)',
                  textDecoration: 'none', color: 'var(--fg-2)',
                  fontSize: 14,
                }}
              >
                <span>{p.label}</span>
                <Badge tone={p.count > 0 ? 'warning' : 'neutral'} size="sm">
                  {p.count}
                </Badge>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', margin: '0 0 16px' }}>
            Roles breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <RoleRow label="Admins" count={data.users.admins} tone="brand" />
            <RoleRow label="Clients" count={data.users.clients} tone="info" />
            <RoleRow label="Freelancers" count={data.users.freelancers} tone="success" />
            <RoleRow label="Suspended" count={data.users.suspended} tone="error" />
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', margin: 0 }}>Recent signups</h3>
          <Link href="/admin/users" style={{ fontSize: 13, color: 'var(--client-primary)', textDecoration: 'none' }}>
            View all users →
          </Link>
        </div>
        {data.recentSignups.length === 0 ? (
          <EmptyState icon="users" title="No recent signups" body="New users will appear here." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data.recentSignups.map((u, i) => (
              <Link
                key={u.id}
                href={`/admin/users?focus=${u.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 0', textDecoration: 'none', color: 'inherit',
                  borderBottom: i < data.recentSignups.length - 1 ? '1px solid var(--border-2)' : 'none',
                }}
              >
                <Avatar name={u.name} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-5)' }}>{u.email}</div>
                </div>
                {u.role && <Badge tone="neutral" size="sm">{u.role}</Badge>}
                <span style={{ fontSize: 12, color: 'var(--fg-5)', minWidth: 80, textAlign: 'right' }}>
                  {relTimeOrFallback(u.createdAt)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function KpiTile({ label, value, hint, href }: { label: string; value: string; hint: string; href: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <Card style={{ cursor: 'pointer', transition: 'box-shadow 120ms var(--ease-out)' }}>
        <div style={{ fontSize: 12, color: 'var(--fg-5)', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>
          {label}
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--fg-1)', marginTop: 4 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 4 }}>{hint}</div>
      </Card>
    </Link>
  );
}

function FinanceTile({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: 'info' | 'success' }) {
  const accent = tone === 'success' ? 'var(--status-success)' : 'var(--client-primary)';
  return (
    <Card style={{ borderLeft: `3px solid ${accent}` }}>
      <div style={{ fontSize: 12, color: 'var(--fg-5)', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--fg-1)', marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 4 }}>{hint}</div>
    </Card>
  );
}

function RoleRow({ label, count, tone }: { label: string; count: number; tone: 'brand' | 'info' | 'success' | 'error' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 14, color: 'var(--fg-2)' }}>{label}</span>
      <Badge tone={tone} size="sm">{count}</Badge>
    </div>
  );
}
