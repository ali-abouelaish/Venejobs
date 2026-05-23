'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AdminLayout,
  AdminTable,
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Skeleton,
  Tabs,
  TextInput,
  formatPrice,
  relTimeOrFallback,
} from '../../services-ui';
import type { AdminOrderType, AdminOrdersResponse } from '../../api/admin/orders/route';

const TYPE_TABS: { key: AdminOrderType; label: string }[] = [
  { key: 'job', label: 'Job orders' },
  { key: 'service', label: 'Service orders' },
  { key: 'contract', label: 'Contract orders' },
];

const PAGE_SIZE = 25;

export default function AdminOrdersPage() {
  return (
    <AdminLayout title="All Orders">
      <Inner />
    </AdminLayout>
  );
}

function Inner() {
  const [type, setType] = useState<AdminOrderType>('job');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminOrdersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        type,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (search.trim()) params.set('q', search.trim());
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Failed to load orders');
      setData(body as AdminOrdersResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [type, page, search]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    setPage(1);
  }, [type, search]);

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader title="All orders" subtitle="Every job, service, and contract order across the platform." />

      <Tabs value={type} onChange={(k) => setType(k as AdminOrderType)} items={TYPE_TABS} />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240, maxWidth: 420 }}>
          <TextInput value={search} onChange={setSearch} icon="search" placeholder="Search by client or freelancer" />
        </div>
        <div style={{ fontSize: 13, color: 'var(--fg-4)' }}>
          {total} result{total === 1 ? '' : 's'}
        </div>
      </div>

      {loading ? (
        <Card padding={0}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ padding: 16, borderBottom: i < 4 ? '1px solid var(--border-2)' : 'none' }}>
              <Skeleton width="50%" height={14} style={{ marginBottom: 6 }} />
              <Skeleton width="30%" height={12} />
            </div>
          ))}
        </Card>
      ) : error ? (
        <ErrorState title="Could not load orders" body={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState icon="shoppingBag" title="No orders" body="No orders match the current filter." />
      ) : (
        <>
          <Card padding={0} style={{ overflow: 'hidden' }}>
            <AdminTable>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Client</th>
                  <th>Freelancer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={`${o.type}-${o.id}`}>
                    <td style={{ minWidth: 180 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)' }}>
                        {o.refLabel ?? `${o.type} #${o.id.slice(0, 8)}`}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--fg-5)', fontFamily: 'monospace' }}>{o.id.slice(0, 8)}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={o.clientName ?? ''} size={28} />
                        <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>{o.clientName ?? '—'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={o.freelancerName ?? ''} size={28} />
                        <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>{o.freelancerName ?? '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: 'var(--fg-2)', fontWeight: 600 }}>
                        {formatPrice(o.amount, { currency: o.currency })}
                      </span>
                    </td>
                    <td>
                      <Badge tone={statusTone(o.status)} size="sm">{o.status}</Badge>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: 'var(--fg-4)' }}>{relTimeOrFallback(o.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          </Card>
          <Pagination page={page} total={total} perPage={PAGE_SIZE} onChange={setPage} />
        </>
      )}
    </div>
  );
}

function statusTone(s: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  if (s === 'completed' || s === 'accepted' || s === 'auto_accepted') return 'success';
  if (s === 'cancelled' || s === 'refunded' || s === 'rejected') return 'neutral';
  if (s === 'disputed' || s === 'revision_requested') return 'warning';
  if (s === 'active' || s === 'paid' || s === 'in_progress' || s === 'delivered') return 'info';
  return 'neutral';
}
