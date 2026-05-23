'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AdminLayout,
  AdminTable,
  Avatar,
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  ErrorState,
  FormField,
  Icon,
  PageHeader,
  PriceInput,
  Skeleton,
  Tabs,
  relTimeOrFallback,
  useToast,
} from '../../services-ui';

interface DisputeRow {
  id: string;
  orderId: string;
  reason: string;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  raisedByName: string;
  orderState: string;
  serviceTitle: string;
  clientName: string;
  freelancerName: string;
}

type Resolution = 'pay_freelancer' | 'refund_client' | 'split';

export default function AdminDisputesPage() {
  return (
    <AdminLayout title="Disputes">
      <Inner />
    </AdminLayout>
  );
}

function Inner() {
  const toast = useToast();
  const [showResolved, setShowResolved] = useState(false);
  const [rows, setRows] = useState<DisputeRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [resolve, setResolve] = useState<DisputeRow | null>(null);
  const [resolution, setResolution] = useState<Resolution>('pay_freelancer');
  const [refundAmount, setRefundAmount] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/disputes${showResolved ? '?resolved=true' : ''}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to load');
      setRows(data as DisputeRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [showResolved]);

  useEffect(() => { void load(); }, [load]);

  function openResolve(d: DisputeRow) {
    setResolve(d);
    setResolution('pay_freelancer');
    setRefundAmount(0);
  }

  async function submitResolve() {
    if (!resolve) return;
    const body: Record<string, unknown> = { resolution };
    if (resolution === 'split') {
      if (refundAmount <= 0) {
        toast.push('Enter a refund amount greater than $0.', { tone: 'warning' });
        return;
      }
      body.refundAmount = refundAmount;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/service-orders/${resolve.orderId}/resolve-dispute`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.push(data?.error ?? 'Failed to resolve', { tone: 'error' });
        return;
      }
      toast.push(
        resolution === 'refund_client'
          ? 'Client refunded in full.'
          : resolution === 'pay_freelancer'
          ? 'Funds released to freelancer.'
          : 'Split applied.',
        { tone: 'success' },
      );
      setResolve(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Disputes"
        subtitle="Resolve with refund, pay freelancer, or split. Disputes pause auto-acceptance."
      />

      <Tabs
        value={showResolved ? 'resolved' : 'open'}
        onChange={k => setShowResolved(k === 'resolved')}
        items={[
          { key: 'open', label: 'Open' },
          { key: 'resolved', label: 'Resolved' },
        ]}
      />

      {loading ? (
        <Card padding={0}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: 16, borderBottom: i < 4 ? '1px solid var(--border-2)' : 'none' }}>
              <Skeleton width={28} height={28} radius={14} />
              <div style={{ flex: 1 }}>
                <Skeleton width="65%" height={14} style={{ marginBottom: 6 }} />
                <Skeleton width="40%" height={12} />
              </div>
              <Skeleton width={80} height={24} radius={9999} />
            </div>
          ))}
        </Card>
      ) : error ? (
        <ErrorState title="Could not load disputes" body={error} onRetry={load} />
      ) : (rows ?? []).length === 0 ? (
        <EmptyState
          icon="checkCircle"
          title={showResolved ? 'No resolved disputes yet' : 'No open disputes'}
          body={showResolved ? 'Once you resolve a dispute it will show up here.' : 'When buyers raise a dispute, it shows up here.'}
        />
      ) : (
        <Card padding={0} style={{ overflow: 'hidden' }}>
          <AdminTable>
            <thead>
              <tr>
                <th>Order</th>
                <th>Reason</th>
                <th>Client</th>
                <th>Freelancer</th>
                <th>Raised</th>
                <th style={{ textAlign: 'right' }}>Resolve</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map(d => (
                <tr key={d.id}>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)' }}>{d.serviceTitle}</div>
                    <code style={{ fontSize: 11, color: 'var(--fg-4)' }}>{d.orderId.slice(-8)}</code>
                  </td>
                  <td style={{ maxWidth: 320 }}>
                    <div
                      style={{
                        fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}
                    >
                      {d.reason}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={d.clientName} size={26} />
                      <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>{d.clientName}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={d.freelancerName} size={26} tone="freelancer" />
                      <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>{d.freelancerName}</span>
                    </div>
                  </td>
                  <td><span style={{ fontSize: 12, color: 'var(--fg-4)' }}>{relTimeOrFallback(d.createdAt)}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    {d.resolution ? (
                      <Badge tone="success" size="sm">{d.resolution.replace('_', ' ')}</Badge>
                    ) : (
                      <Button size="sm" tone="client" onClick={() => openResolve(d)}>Resolve</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </Card>
      )}

      <Dialog
        open={!!resolve}
        onClose={() => setResolve(null)}
        title="Resolve dispute"
        subtitle={resolve ? `Order ${resolve.orderId.slice(-8)}` : ''}
        maxWidth={560}
        footer={
          <>
            <Button variant="outline" onClick={() => setResolve(null)}>Cancel</Button>
            <Button
              tone="client"
              loading={busy}
              disabled={resolution === 'split' && refundAmount <= 0}
              onClick={submitResolve}
            >
              Resolve
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Resolution">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ResolveOption
                checked={resolution === 'pay_freelancer'}
                onChange={() => setResolution('pay_freelancer')}
                tone="success"
                icon="checkCircle"
                label="Pay freelancer"
                hint="Transfer the full net amount. Use when delivery clearly met spec."
              />
              <ResolveOption
                checked={resolution === 'refund_client'}
                onChange={() => setResolution('refund_client')}
                tone="error"
                icon="rotate"
                label="Refund client"
                hint="Refund the full amount. Use when delivery clearly missed spec."
              />
              <ResolveOption
                checked={resolution === 'split'}
                onChange={() => setResolution('split')}
                tone="warning"
                icon="handshake"
                label="Split"
                hint="Refund part to client. The remainder transfers to the freelancer."
              />
            </div>
          </FormField>

          {resolution === 'split' && (
            <FormField
              label="Refund amount to client"
              required
              hint="In dollars. The remainder of the order total will transfer to the freelancer minus the platform fee."
              error={refundAmount <= 0 ? 'Enter an amount greater than $0.' : undefined}
            >
              <PriceInput value={refundAmount} onChange={setRefundAmount} error={refundAmount <= 0} />
            </FormField>
          )}
        </div>
      </Dialog>
    </div>
  );
}

function ResolveOption({
  checked, onChange, tone, icon, label, hint,
}: {
  checked: boolean;
  onChange: () => void;
  tone: 'success' | 'error' | 'warning';
  icon: 'checkCircle' | 'rotate' | 'handshake';
  label: string;
  hint: string;
}) {
  const tones = {
    success: { bg: 'var(--status-success-bg)', color: 'var(--status-success)' },
    error:   { bg: 'var(--status-error-bg)',   color: 'var(--status-error)' },
    warning: { bg: 'var(--status-warning-bg)', color: 'var(--status-warning)' },
  }[tone];
  return (
    <label
      style={{
        display: 'flex', gap: 12, padding: 14, borderRadius: 10, cursor: 'pointer',
        border: `1px solid ${checked ? tones.color : 'var(--border-2)'}`,
        background: checked ? tones.bg : '#fff',
        transition: 'all 120ms var(--ease-out)',
      }}
    >
      <input type="radio" checked={checked} onChange={onChange} style={{ position: 'absolute', opacity: 0 }} />
      <div
        style={{
          width: 36, height: 36, borderRadius: 8, background: tones.bg, color: tones.color,
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}
      >
        <Icon name={icon} size={18} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 2, lineHeight: 1.5 }}>{hint}</div>
      </div>
      <div
        style={{
          width: 18, height: 18, borderRadius: '50%', marginTop: 2,
          border: `1.5px solid ${checked ? tones.color : 'var(--border-4)'}`,
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}
      >
        {checked && <span style={{ width: 8, height: 8, borderRadius: '50%', background: tones.color }} />}
      </div>
    </label>
  );
}
