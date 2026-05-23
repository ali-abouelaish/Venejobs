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
import type {
  FinancesResponse,
  TransactionSource,
  TransactionType,
} from '../../api/admin/finances/route';

type TypeFilter = 'all' | TransactionType;
type SourceFilter = 'all' | TransactionSource;

const TYPE_TABS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'payment', label: 'Payments' },
  { key: 'payout', label: 'Payouts' },
  { key: 'commission', label: 'Commission' },
  { key: 'refund', label: 'Refunds' },
];

const SOURCE_TABS: { key: SourceFilter; label: string }[] = [
  { key: 'all', label: 'All sources' },
  { key: 'service', label: 'Services' },
  { key: 'contract', label: 'Contracts' },
];

const PAGE_SIZE = 25;

export default function AdminFinancesPage() {
  return (
    <AdminLayout title="Finances">
      <Inner />
    </AdminLayout>
  );
}

function Inner() {
  const [type, setType] = useState<TypeFilter>('all');
  const [source, setSource] = useState<SourceFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<FinancesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (type !== 'all') params.set('type', type);
      if (source !== 'all') params.set('source', source);
      if (search.trim()) params.set('q', search.trim());
      const res = await fetch(`/api/admin/finances?${params.toString()}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Failed to load finances');
      setData(body as FinancesResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [type, source, search, page]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    setPage(1);
  }, [type, source, search]);

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const summary = data?.summary;
  const currency = summary?.currency ?? 'gbp';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Finances"
        subtitle="Payments, payouts, commission, and refunds across the platform."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <SummaryTile label="Gross revenue" value={summary?.grossRevenuePence} currency={currency} accent="var(--client-primary)" />
        <SummaryTile label="Commission" value={summary?.commissionPence} currency={currency} accent="var(--status-success)" />
        <SummaryTile label="Paid out" value={summary?.paidOutPence} currency={currency} accent="var(--freelancer-primary)" />
        <SummaryTile label="In escrow" value={summary?.inEscrowPence} currency={currency} accent="var(--status-warning)" />
        <SummaryTile label="Refunded" value={summary?.refundedPence} currency={currency} accent="var(--status-error)" />
      </div>

      <Tabs value={type} onChange={(k) => setType(k as TypeFilter)} items={TYPE_TABS} />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240, maxWidth: 420 }}>
          <TextInput value={search} onChange={setSearch} icon="search" placeholder="Search by counterparty or reference" />
        </div>
        <SourceSelect value={source} onChange={setSource} />
        <div style={{ fontSize: 13, color: 'var(--fg-4)', marginLeft: 'auto' }}>
          {total} transaction{total === 1 ? '' : 's'}
        </div>
      </div>

      {loading ? (
        <Card padding={0}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ padding: 16, borderBottom: i < 5 ? '1px solid var(--border-2)' : 'none' }}>
              <Skeleton width="50%" height={14} style={{ marginBottom: 6 }} />
              <Skeleton width="30%" height={12} />
            </div>
          ))}
        </Card>
      ) : error ? (
        <ErrorState title="Could not load finances" body={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState icon="dollar" title="No transactions" body="No transactions match the current filter." />
      ) : (
        <>
          <Card padding={0} style={{ overflow: 'hidden' }}>
            <AdminTable>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Counterparty</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <span style={{ fontSize: 12, color: 'var(--fg-4)' }}>{relTimeOrFallback(tx.occurredAt)}</span>
                    </td>
                    <td>
                      <TypeBadge type={tx.type} />
                    </td>
                    <td style={{ minWidth: 200 }}>
                      <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>{tx.refLabel ?? '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--fg-5)', textTransform: 'capitalize' }}>
                        {tx.source} order
                      </div>
                    </td>
                    <td>
                      {tx.counterpartyName ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {tx.counterpartyId != null && <Avatar name={tx.counterpartyName} size={24} />}
                          <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>{tx.counterpartyName}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--fg-5)' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: amountColor(tx.type) }}>
                        {amountPrefix(tx.type)}{formatPrice(tx.amountPence, { currency: tx.currency })}
                      </span>
                    </td>
                    <td>
                      <Badge tone={stateTone(tx.state)} size="sm">{tx.state}</Badge>
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

function SummaryTile({
  label, value, currency, accent,
}: {
  label: string; value: number | undefined; currency: string; accent: string;
}) {
  return (
    <Card style={{ borderLeft: `3px solid ${accent}` }}>
      <div style={{ fontSize: 11, color: 'var(--fg-5)', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg-1)', marginTop: 4 }}>
        {value == null ? '—' : formatPrice(value, { currency })}
      </div>
    </Card>
  );
}

function SourceSelect({
  value, onChange,
}: {
  value: SourceFilter; onChange: (v: SourceFilter) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SourceFilter)}
      style={{
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid var(--border-4)',
        background: '#fff',
        color: 'var(--fg-2)',
        fontFamily: 'DM Sans',
        fontSize: 13,
        cursor: 'pointer',
      }}
    >
      {SOURCE_TABS.map((s) => (
        <option key={s.key} value={s.key}>{s.label}</option>
      ))}
    </select>
  );
}

function TypeBadge({ type }: { type: TransactionType }) {
  const map: Record<TransactionType, { label: string; tone: 'info' | 'success' | 'brand' | 'error' }> = {
    payment: { label: 'Payment', tone: 'info' },
    payout: { label: 'Payout', tone: 'success' },
    commission: { label: 'Commission', tone: 'brand' },
    refund: { label: 'Refund', tone: 'error' },
  };
  const m = map[type];
  return <Badge tone={m.tone} size="sm">{m.label}</Badge>;
}

function amountColor(type: TransactionType): string {
  if (type === 'payment') return 'var(--fg-1)';
  if (type === 'payout') return 'var(--freelancer-primary-deep)';
  if (type === 'commission') return 'var(--status-success)';
  return 'var(--status-error)';
}

function amountPrefix(type: TransactionType): string {
  if (type === 'payment') return '+';
  if (type === 'payout' || type === 'refund') return '−';
  return '+';
}

function stateTone(s: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  if (s === 'completed' || s === 'accepted' || s === 'auto_accepted') return 'success';
  if (s === 'refunded') return 'error';
  if (s === 'cancelled') return 'neutral';
  if (s === 'disputed' || s === 'revision_requested') return 'warning';
  if (s === 'paid' || s === 'in_progress' || s === 'delivered') return 'info';
  return 'neutral';
}
