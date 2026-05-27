'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AdminLayout,
  Avatar,
  Badge,
  Button,
  Card,
  Dialog,
  ErrorState,
  FormField,
  Icon,
  PageHeader,
  PriceInput,
  Skeleton,
  formatPrice,
  relTimeOrFallback,
  useToast,
} from '../../../services-ui';
import { DisputeChat } from '../../_components/DisputeChat';

interface DeliveryAttachment {
  r2Key?: string;
  r2_key?: string;
  filename: string;
  size: number;
  mime: string;
}

interface Delivery {
  id: string;
  message: string | null;
  attachments: DeliveryAttachment[];
  createdAt: string;
  freelancerId: number;
  freelancerName: string;
}

interface DisputeDetail {
  id: string;
  orderId: string;
  reason: string;
  attachments: DeliveryAttachment[];
  resolution: string | null;
  resolvedAt: string | null;
  resolvedByName: string | null;
  createdAt: string;
  raisedById: number;
  raisedByName: string;
  orderState: string;
  basePrice: number;
  currency: string;
  deliveryDeadline: string | null;
  deliveredAt: string | null;
  acceptedAt: string | null;
  revisionsPurchased: number;
  revisionsUsed: number;
  serviceId: string;
  serviceTitle: string;
  clientId: number;
  clientName: string;
  freelancerId: number;
  freelancerName: string;
}

interface DetailResponse {
  dispute: DisputeDetail;
  deliveries: Delivery[];
}

type Resolution = 'pay_freelancer' | 'refund_client' | 'split';

export default function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AdminLayout title="Dispute case">
      <Inner disputeId={id} />
    </AdminLayout>
  );
}

function Inner({ disputeId }: { disputeId: string }) {
  const toast = useToast();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState<Resolution>('pay_freelancer');
  const [refundAmount, setRefundAmount] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Failed to load');
      setData(json as DetailResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [disputeId]);

  useEffect(() => { void load(); }, [load]);

  async function submitResolve() {
    if (!data) return;
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
      const res = await fetch(
        `/api/admin/service-orders/${data.dispute.orderId}/resolve-dispute`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.push(json?.error ?? 'Failed to resolve', { tone: 'error' });
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
      setResolveOpen(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Skeleton width="40%" height={28} />
        <Card padding={24}>
          <Skeleton width="60%" height={18} style={{ marginBottom: 12 }} />
          <Skeleton width="80%" height={14} />
        </Card>
        <Card padding={24}>
          <Skeleton width="100%" height={120} />
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState title="Could not load dispute" body={error ?? 'Not found'} onRetry={load} />;
  }

  const d = data.dispute;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link
          href="/admin/disputes"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--fg-3)', textDecoration: 'none',
          }}
        >
          <Icon name="chevronLeft" size={14} />
          <span>Back to disputes</span>
        </Link>
      </div>

      <PageHeader
        title={d.serviceTitle}
        subtitle={`Dispute case · Order ${d.orderId.slice(-8)}`}
        action={
          d.resolution ? (
            <Badge tone="success">{d.resolution.replace('_', ' ')}</Badge>
          ) : (
            <Button tone="client" onClick={() => { setResolution('pay_freelancer'); setRefundAmount(0); setResolveOpen(true); }}>
              Resolve dispute
            </Button>
          )
        }
      />

      <Card padding={24}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
          <Field label="Client">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar name={d.clientName} size={28} />
              <span style={{ fontSize: 14, color: 'var(--fg-1)' }}>{d.clientName}</span>
            </div>
          </Field>
          <Field label="Freelancer">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar name={d.freelancerName} size={28} tone="freelancer" />
              <span style={{ fontSize: 14, color: 'var(--fg-1)' }}>{d.freelancerName}</span>
            </div>
          </Field>
          <Field label="Amount">
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg-1)' }}>
              {formatPrice(d.basePrice, { currency: d.currency })}
            </span>
          </Field>
          <Field label="Order state">
            <Badge tone="info" size="sm">{d.orderState}</Badge>
          </Field>
          <Field label="Revisions">
            <span style={{ fontSize: 14, color: 'var(--fg-2)' }}>
              {d.revisionsUsed} / {d.revisionsPurchased} used
            </span>
          </Field>
          <Field label="Raised by">
            <span style={{ fontSize: 14, color: 'var(--fg-2)' }}>
              {d.raisedByName} · {relTimeOrFallback(d.createdAt)}
            </span>
          </Field>
        </div>

        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-2)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Dispute reason
          </div>
          <div style={{ fontSize: 14, color: 'var(--fg-1)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {d.reason}
          </div>
        </div>

        {d.attachments.length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-2)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Evidence from {d.raisedByName}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {d.attachments.map((a, i) => {
                const r2Key = a.r2Key ?? a.r2_key ?? '';
                return (
                  <a
                    key={`${r2Key}-${i}`}
                    href={`/api/service-orders/${d.orderId}/attachments?key=${encodeURIComponent(r2Key)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 10px', borderRadius: 6,
                      background: 'var(--surface-2)', border: '1px solid var(--border-2)',
                      fontSize: 12, color: 'var(--fg-2)', textDecoration: 'none',
                    }}
                  >
                    <Icon name="download" size={14} />
                    <span>{a.filename}</span>
                    <span style={{ color: 'var(--fg-4)' }}>
                      ({Math.round(a.size / 1024)} KB)
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {d.resolution && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-2)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Resolution
            </div>
            <div style={{ fontSize: 14, color: 'var(--fg-1)' }}>
              <strong>{d.resolution.replace('_', ' ')}</strong>
              {d.resolvedByName && <> by {d.resolvedByName}</>}
              {d.resolvedAt && <> · {relTimeOrFallback(d.resolvedAt)}</>}
            </div>
          </div>
        )}
      </Card>

      <Section title="Deliverables" subtitle={`${data.deliveries.length} delivery message${data.deliveries.length === 1 ? '' : 's'}`}>
        {data.deliveries.length === 0 ? (
          <Card padding={16}>
            <div style={{ fontSize: 13, color: 'var(--fg-4)' }}>
              No deliveries recorded yet for this order.
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.deliveries.map((dv) => (
              <DeliveryCard key={dv.id} delivery={dv} orderId={d.orderId} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Chat" subtitle="All conversations between the client and freelancer, newest first">
        <DisputeChat endpoint={`/api/admin/disputes/${disputeId}/messages`} />
      </Section>

      <Dialog
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        title="Resolve dispute"
        subtitle={`Order ${d.orderId.slice(-8)} · ${formatPrice(d.basePrice, { currency: d.currency })}`}
        maxWidth={560}
        footer={
          <>
            <Button variant="outline" onClick={() => setResolveOpen(false)}>Cancel</Button>
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
                tone="success" icon="checkCircle" label="Pay freelancer"
                hint="Transfer the full net amount. Use when delivery clearly met spec."
              />
              <ResolveOption
                checked={resolution === 'refund_client'}
                onChange={() => setResolution('refund_client')}
                tone="error" icon="rotate" label="Refund client"
                hint="Refund the full amount. Use when delivery clearly missed spec."
              />
              <ResolveOption
                checked={resolution === 'split'}
                onChange={() => setResolution('split')}
                tone="warning" icon="handshake" label="Split"
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg-1)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function DeliveryCard({ delivery, orderId }: { delivery: Delivery; orderId: string }) {
  return (
    <Card padding={16}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Avatar name={delivery.freelancerName} size={24} tone="freelancer" />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)' }}>
          {delivery.freelancerName}
        </span>
        <span style={{ fontSize: 11, color: 'var(--fg-4)' }}>
          {relTimeOrFallback(delivery.createdAt)}
        </span>
      </div>
      {delivery.message && (
        <div style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 12 }}>
          {delivery.message}
        </div>
      )}
      {delivery.attachments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {delivery.attachments.map((a, i) => {
            const r2Key = a.r2Key ?? a.r2_key ?? '';
            return (
              <a
                key={`${r2Key}-${i}`}
                href={`/api/service-orders/${orderId}/attachments?key=${encodeURIComponent(r2Key)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 10px', borderRadius: 6,
                  background: 'var(--surface-2)', border: '1px solid var(--border-2)',
                  fontSize: 12, color: 'var(--fg-2)', textDecoration: 'none',
                }}
              >
                <Icon name="download" size={14} />
                <span>{a.filename}</span>
                <span style={{ color: 'var(--fg-4)' }}>
                  ({Math.round(a.size / 1024)} KB)
                </span>
              </a>
            );
          })}
        </div>
      )}
    </Card>
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
