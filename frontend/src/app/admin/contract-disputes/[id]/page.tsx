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

interface DisputeAttachment {
  r2Key?: string;
  r2_key?: string;
  filename: string;
  size: number;
  mime: string;
}

interface ContractDisputeDetail {
  id: string;
  contractOrderId: string;
  contractId: string;
  conversationId: string;
  reason: string;
  attachments: DisputeAttachment[];
  resolution: string | null;
  resolvedAt: string | null;
  resolvedByName: string | null;
  createdAt: string;
  raisedById: number;
  raisedByName: string;
  orderState: string;
  amount: number;
  currency: string;
  deliveredAt: string | null;
  acceptedAt: string | null;
  contractTitle: string | null;
  contractScope: string | null;
  contractDeliverables: string | null;
  clientId: number;
  clientName: string;
  freelancerId: number;
  freelancerName: string;
}

interface DetailResponse {
  dispute: ContractDisputeDetail;
}

type Resolution = 'pay_freelancer' | 'refund_client' | 'split';

export default function AdminContractDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AdminLayout title="Contract dispute case">
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
      const res = await fetch(`/api/admin/contract-disputes/${disputeId}`, { cache: 'no-store' });
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
      if (refundAmount >= data.dispute.amount) {
        toast.push(
          `Refund amount must be less than the contract total (${formatPrice(data.dispute.amount, { currency: data.dispute.currency })}).`,
          { tone: 'warning' },
        );
        return;
      }
      body.refundAmount = refundAmount;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/contract-orders/${data.dispute.contractOrderId}/resolve-dispute`,
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
    return <ErrorState title="Could not load contract dispute" body={error ?? 'Not found'} onRetry={load} />;
  }

  const d = data.dispute;
  const title = d.contractTitle ?? 'Untitled contract';
  const overRefund = d.amount > 0 && refundAmount >= d.amount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link
          href="/admin/contract-disputes"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--fg-3)', textDecoration: 'none',
          }}
        >
          <Icon name="chevronLeft" size={14} />
          <span>Back to contract disputes</span>
        </Link>
      </div>

      <PageHeader
        title={title}
        subtitle={`Contract dispute case · Order ${d.contractOrderId.slice(-8)}`}
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
              {formatPrice(d.amount, { currency: d.currency })}
            </span>
          </Field>
          <Field label="Order state">
            <Badge tone="info" size="sm">{d.orderState}</Badge>
          </Field>
          <Field label="Raised by">
            <span style={{ fontSize: 14, color: 'var(--fg-2)' }}>
              {d.raisedByName} · {relTimeOrFallback(d.createdAt)}
            </span>
          </Field>
        </div>

        {(d.contractScope || d.contractDeliverables) && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {d.contractScope && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Contract scope
                </div>
                <div style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {d.contractScope}
                </div>
              </div>
            )}
            {d.contractDeliverables && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Agreed deliverables
                </div>
                <div style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {d.contractDeliverables}
                </div>
              </div>
            )}
          </div>
        )}

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
                    href={`/api/contracts/${d.contractId}/dispute-attachments?key=${encodeURIComponent(r2Key)}`}
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

      <Section title="Chat" subtitle="Conversation linked to this contract, newest first">
        <DisputeChat endpoint={`/api/admin/contract-disputes/${disputeId}/messages`} />
      </Section>

      <Dialog
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        title="Resolve contract dispute"
        subtitle={`${title} · ${formatPrice(d.amount, { currency: d.currency })}`}
        maxWidth={560}
        footer={
          <>
            <Button variant="outline" onClick={() => setResolveOpen(false)}>Cancel</Button>
            <Button
              tone="client"
              loading={busy}
              disabled={resolution === 'split' && (refundAmount <= 0 || overRefund)}
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
                hint="Refund part to client. The remainder transfers to the freelancer (no platform fee)."
              />
            </div>
          </FormField>

          {resolution === 'split' && (
            <FormField
              label="Refund amount to client"
              required
              hint={`In dollars. Must be less than the contract total (${formatPrice(d.amount, { currency: d.currency })}). The remainder transfers to the freelancer.`}
              error={
                refundAmount <= 0
                  ? 'Enter an amount greater than $0.'
                  : overRefund
                  ? 'Must be less than the contract total.'
                  : undefined
              }
            >
              <PriceInput
                value={refundAmount}
                onChange={setRefundAmount}
                error={refundAmount <= 0 || overRefund}
              />
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
