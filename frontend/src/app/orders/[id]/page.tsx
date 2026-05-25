'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AttachmentItem,
  AttachmentUploader,
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  ErrorState,
  FormField,
  Icon,
  OrderTimeline,
  ServicesShell,
  Skeleton,
  SummaryLine,
  Textarea,
  UploadedFile,
  formatPrice,
  orderDisplay,
  shortDate,
  useToast,
  relTimeOrFallback,
} from '../../services-ui';
import { ReviewsBlock } from './ReviewsBlock';

// Reviews can be submitted once the order has reached client acceptance
// (manual accept or cron auto-accept). After completed, reviews are still
// reviewable so an order that finished before the user got around to it
// remains actionable.
const REVIEWABLE_STATES = new Set(['accepted', 'auto_accepted', 'completed']);

interface OrderRow {
  id: string;
  serviceId: string;
  serviceTitle: string;
  clientId: number;
  clientName: string;
  freelancerId: number;
  freelancerName: string;
  basePrice: number;
  currency: string;
  platformFeePct: string | number;
  deliveryDeadline: string;
  autoAcceptDeadline: string | null;
  revisionsPurchased: number;
  revisionsUsed: number;
  state: string;
  paymentIntentId: string;
  transferId: string | null;
  createdAt: string;
  deliveredAt: string | null;
  acceptedAt: string | null;
  cancelledAt: string | null;
}

interface OrderAddon {
  id: string;
  type: string;
  name: string;
  price: number;
  quantity: number;
}

interface DeliveryAttachment {
  r2Key: string;
  filename: string;
  size: number;
  mime: string;
  url?: string | null;
}

interface Delivery {
  id: string;
  message: string | null;
  attachments: DeliveryAttachment[];
  createdAt: string;
}

interface Revision {
  id: string;
  message: string;
  createdAt: string;
}

interface Dispute {
  id: string;
  reason: string;
  resolution: string | null;
  resolvedAt: string | null;
  raisedBy?: number;
  createdAt: string;
}

interface OrderDetail {
  order: OrderRow;
  addons: OrderAddon[];
  deliveries: Delivery[];
  revisions: Revision[];
  disputes: Dispute[];
  viewerRole: 'client' | 'freelancer';
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <OrderRouter id={id} />;
}

// Fetch viewerRole BEFORE mounting any chrome. Avoids the client -> freelancer
// flicker that used to happen when a freelancer opened one of their orders.
function OrderRouter({ id }: { id: string }) {
  const [data, setData] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/service-orders/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Failed to load');
      setData(json as OrderDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  // Chromeless loading state. No navbar / footer until we know viewerRole.
  if (loading && !data) {
    return (
      <div className="vj-page theme-client" style={{ minHeight: '100vh' }}>
        <div className="vj-page-pad">
          <Card padding={48} style={{ textAlign: 'center', maxWidth: 520, margin: '80px auto' }}>
            <Skeleton width={56} height={56} radius={28} style={{ margin: '0 auto 16px' }} />
            <Skeleton width="60%" height={18} style={{ margin: '0 auto 8px' }} />
            <Skeleton width="40%" height={14} style={{ margin: '0 auto' }} />
            <p style={{ marginTop: 20, color: 'var(--fg-4)', fontSize: 13 }}>Loading order...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="vj-page theme-client" style={{ minHeight: '100vh' }}>
        <div className="vj-page-pad">
          <ErrorState title="Could not load order" body={error} onRetry={load} />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const mode: 'client' | 'freelancer' = data.viewerRole === 'freelancer' ? 'freelancer' : 'client';
  return (
    <ServicesShell mode={mode}>
      <OrderInner id={id} data={data} reload={load} />
    </ServicesShell>
  );
}

function OrderInner({ id, data, reload }: { id: string; data: OrderDetail; reload: () => Promise<void> }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [messageBusy, setMessageBusy] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [revOpen, setRevOpen] = useState(false);
  const [revMsg, setRevMsg] = useState('');
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [deliverOpen, setDeliverOpen] = useState(false);
  // Set when the client's Accept just succeeded so ReviewsBlock can
  // auto-open the review form (once it has loaded existing reviews).
  const [justAccepted, setJustAccepted] = useState(false);

  // Light-touch polling while the viewer is waiting on the other party.
  // - Client waiting for freelancer to (re-)deliver: in_progress, revision_requested
  // - Freelancer waiting for client to accept / revise: delivered
  // No realtime push exists, so this fills the gap. Tab visibility-aware so
  // it doesn't burn requests in the background.
  const waitingClient =
    data.viewerRole === 'client'
    && (data.order.state === 'in_progress' || data.order.state === 'revision_requested');
  const waitingFreelancer = data.viewerRole === 'freelancer' && data.order.state === 'delivered';
  const shouldPoll = waitingClient || waitingFreelancer;

  useEffect(() => {
    if (!shouldPoll) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      void reload();
    };
    timer = setInterval(tick, 15_000);
    return () => { if (timer) clearInterval(timer); };
  }, [shouldPoll, reload]);

  async function callAction(path: string, body?: unknown) {
    setBusy(true);
    try {
      const res = await fetch(`/api/service-orders/${id}/${path}`, {
        method: 'POST',
        headers: body ? { 'content-type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 402 && json?.code === 'revisions_exhausted') {
          sessionStorage.setItem(
            `order:${id}:revision-draft`,
            JSON.stringify({ message: (body as { message?: string } | undefined)?.message ?? '' }),
          );
          toast.push('You have used all included revisions. Buy more to continue.', { tone: 'warning' });
          router.push(`/orders/${id}/buy-revisions`);
          return;
        }
        if (res.status === 409 && json?.code === 'cannot_cancel_yet') {
          toast.push('You can only cancel after the delivery deadline has passed.', { tone: 'warning' });
          return;
        }
        throw new Error(json?.error ?? `Action failed (${res.status})`);
      }
      await reload();
      return json;
    } catch (e) {
      toast.push(e instanceof Error ? e.message : String(e), { tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  const { order, addons, deliveries, revisions, disputes, viewerRole } = data;
  const display = orderDisplay(order.state);
  const isFreelancer = viewerRole === 'freelancer';
  const isClient = viewerRole === 'client';
  const counterparty = isClient ? order.freelancerName : order.clientName;
  const counterpartyId = isClient ? order.freelancerId : order.clientId;
  const counterpartyTone = isFreelancer ? 'client' : 'freelancer';

  async function handleMessage() {
    if (messageBusy) return;
    setMessageBusy(true);
    try {
      const res = await fetch('/api/conversations/direct', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ freelancerId: counterpartyId, forceDirect: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.push(json?.error ?? 'Could not open chat', { tone: 'error' });
        return;
      }
      router.push(`/messages?conversation=${json.conversationId}`);
    } catch (e) {
      toast.push(e instanceof Error ? e.message : String(e), { tone: 'error' });
    } finally {
      setMessageBusy(false);
    }
  }

  const deadlinePast = new Date(order.deliveryDeadline).getTime() < Date.now();
  const canCancel = isClient && (order.state === 'paid' || order.state === 'in_progress') && deadlinePast;
  const revisionsLeft = order.revisionsPurchased - order.revisionsUsed;

  const platformFeePct = Number(order.platformFeePct ?? 10);
  const addonsTotal = addons.reduce((s, a) => s + a.price * a.quantity, 0);
  const total = order.basePrice + addonsTotal;
  const platformFee = Math.round(total * (platformFeePct / 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Breadcrumbs
        onNavigate={to => router.push(to)}
        items={[
          {
            label: isFreelancer ? 'Incoming orders' : 'My orders',
            to: isFreelancer ? '/freelancer/orders' : '/client/orders',
          },
          { label: `Order #${order.id.slice(-4)}` },
        ]}
      />

      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <Avatar name={counterparty} size={56} tone={counterpartyTone} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 12, color: 'var(--fg-4)' }}>
              {isFreelancer ? 'Client' : 'Freelancer'} · {counterparty} · Order #{order.id.slice(-4)}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg-1)', marginTop: 4, lineHeight: 1.3, margin: 0 }}>
              {order.serviceTitle}
            </h2>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <Badge tone={display.tone}>{display.label}</Badge>
            <div style={{ fontSize: 13, color: 'var(--fg-4)' }}>{display.desc}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-2)', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            icon="users"
            tone={counterpartyTone}
            loading={messageBusy}
            onClick={handleMessage}
          >
            Message {isFreelancer ? 'client' : 'freelancer'}
          </Button>

          {isFreelancer && (order.state === 'paid' || order.state === 'in_progress' || order.state === 'revision_requested') && (
            <Button icon="upload" tone="freelancer" onClick={() => setDeliverOpen(true)}>Submit delivery</Button>
          )}

          {isClient && order.state === 'delivered' && (
            <>
              <Button
                icon="check"
                tone="client"
                loading={busy}
                onClick={async () => {
                  await callAction('accept');
                  setJustAccepted(true);
                }}
              >
                Accept delivery
              </Button>
              <Button variant="secondary" icon="refresh" tone="client" onClick={() => setRevOpen(true)}>
                Request revision
              </Button>
              <Button variant="ghost" danger icon="flag" onClick={() => setDisputeOpen(true)}>
                Raise dispute
              </Button>
            </>
          )}

          {isClient && order.state === 'revision_requested' && (
            <Button variant="ghost" danger icon="flag" onClick={() => setDisputeOpen(true)}>
              Raise dispute
            </Button>
          )}

          {isClient && (order.state === 'paid' || order.state === 'in_progress') && (
            <Button
              variant="outline"
              danger
              icon="x"
              onClick={() => setCancelOpen(true)}
              disabled={!canCancel}
              title={canCancel ? 'Cancel and refund' : 'Cancel is only available after the delivery deadline'}
            >
              {canCancel ? 'Cancel order' : 'Cancel available after deadline'}
            </Button>
          )}

          {isFreelancer && order.state === 'delivered' && order.autoAcceptDeadline && (
            <div style={{ fontSize: 13, color: 'var(--fg-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="clock" size={14} />
              Auto-accepts on {shortDate(order.autoAcceptDeadline)}
            </div>
          )}

          {/* Manual refresh always available so participants can pull the
              latest state without reloading the whole page. */}
          <Button
            variant="ghost"
            icon="refresh"
            onClick={() => { void reload(); }}
            style={{ marginLeft: 'auto' }}
            title="Refresh order state"
          >
            Refresh
          </Button>
        </div>

        {isClient && (order.state === 'in_progress' || order.state === 'revision_requested') && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 14px',
              borderRadius: 10,
              background: 'var(--status-info-bg)',
              color: 'var(--client-primary)',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            <Icon name="clock" size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ color: 'var(--fg-2)' }}>
              <b style={{ color: 'var(--client-primary)' }}>
                {order.state === 'revision_requested'
                  ? 'Revision requested.'
                  : 'Work in progress.'}
              </b>{' '}
              {order.state === 'revision_requested'
                ? 'Waiting for the freelancer to acknowledge and re-deliver.'
                : 'The freelancer is working on your order. You will be able to accept, request a revision, or raise a dispute once they deliver.'}
              {' '}This page checks for updates automatically.
            </div>
          </div>
        )}
      </Card>

      <div className="vj-two-col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <Card padding={24}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', margin: 0, marginBottom: 16 }}>Timeline</h3>
            <OrderTimeline
              order={{
                state: order.state,
                paidAt: order.createdAt,
                deliveredAt: order.deliveredAt,
                acceptedAt: order.acceptedAt,
                cancelledAt: order.cancelledAt,
                disputes: disputes.map(d => ({ raisedAt: d.createdAt })),
              }}
            />
          </Card>

          {REVIEWABLE_STATES.has(order.state) && (
            <ReviewsBlock
              orderId={order.id}
              viewerRole={viewerRole}
              autoOpenOnReady={justAccepted}
              onConsumeAutoOpen={() => setJustAccepted(false)}
            />
          )}

          {deliveries.length > 0 && (
            <Card padding={24} style={{ minWidth: 0, overflow: 'hidden' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', margin: 0, marginBottom: 16 }}>Deliveries</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                {deliveries.map((d, i) => (
                  <div
                    key={d.id}
                    style={{ paddingBottom: 16, borderBottom: i < deliveries.length - 1 ? '1px solid var(--border-2)' : 'none', minWidth: 0 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <Badge tone="info" dot={false}>Delivery {deliveries.length - i}</Badge>
                      <span style={{ fontSize: 12, color: 'var(--fg-4)' }}>{relTimeOrFallback(d.createdAt)}</span>
                    </div>
                    {d.message && (
                      <p style={{ fontSize: 14, color: 'var(--fg-3)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {d.message}
                      </p>
                    )}
                    {d.attachments?.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, minWidth: 0 }}>
                        {d.attachments.map(a => <AttachmentItem key={a.r2Key} file={a} orderId={order.id} />)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {revisions.length > 0 && (
            <Card padding={24} style={{ minWidth: 0, overflow: 'hidden' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', margin: 0, marginBottom: 16 }}>Revision requests</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                {revisions.map(r => (
                  <div
                    key={r.id}
                    style={{
                      padding: 14, borderRadius: 10,
                      background: 'var(--status-warning-bg)',
                      borderLeft: '3px solid var(--status-warning)',
                      minWidth: 0,
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#7a5a00', fontWeight: 600 }}>{shortDate(r.createdAt)}</div>
                    <p style={{ fontSize: 14, color: 'var(--fg-2)', marginTop: 6, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      {r.message}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {disputes.length > 0 && (
            <Card padding={24} style={{ borderLeft: '3px solid var(--status-error)', minWidth: 0, overflow: 'hidden' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', margin: 0, marginBottom: 12 }}>
                Dispute filed
              </h3>
              {disputes.map(d => (
                <div key={d.id} style={{ marginBottom: 12, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--fg-4)', marginBottom: 6 }}>
                    {shortDate(d.createdAt)} {d.resolution ? `· resolved as ${d.resolution}` : '· open'}
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--fg-3)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{d.reason}</p>
                </div>
              ))}
            </Card>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card padding={20}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)', margin: 0, marginBottom: 12 }}>Order summary</h4>
            <SummaryLine label="Base service" value={formatPrice(order.basePrice, { currency: order.currency })} />
            {addons.map(a => (
              <SummaryLine
                key={a.id}
                label={`${a.name}${a.quantity > 1 ? ` x ${a.quantity}` : ''}`}
                value={formatPrice(a.price * a.quantity, { currency: order.currency })}
              />
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-2)' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-1)' }}>
                {formatPrice(total, { currency: order.currency })}
              </span>
            </div>
            {isFreelancer && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 13, color: 'var(--fg-4)' }}>
                <span>You earn ({platformFeePct}% platform fee)</span>
                <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>
                  {formatPrice(total - platformFee, { currency: order.currency })}
                </span>
              </div>
            )}
          </Card>

          <Card padding={20}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)', margin: 0, marginBottom: 12 }}>Details</h4>
            <SummaryLine label="Order ID" value={<code style={{ fontSize: 11 }}>{order.id}</code>} />
            <SummaryLine label="Paid" value={shortDate(order.createdAt)} />
            <SummaryLine label="Delivery deadline" value={shortDate(order.deliveryDeadline)} />
            <SummaryLine
              label="Revisions"
              value={`${order.revisionsUsed} of ${order.revisionsPurchased} used`}
            />
            {order.transferId && <SummaryLine label="Transfer" value={<code style={{ fontSize: 11 }}>{order.transferId}</code>} />}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this order?"
        body="The full amount will be refunded to the client. This is final and cannot be reversed."
        confirmLabel="Cancel order"
        danger
        onConfirm={async () => {
          await callAction('cancel');
          setCancelOpen(false);
        }}
      />

      <Dialog
        open={revOpen}
        onClose={() => setRevOpen(false)}
        title="Request a revision"
        subtitle={
          revisionsLeft > 0
            ? `You have ${revisionsLeft} revision${revisionsLeft === 1 ? '' : 's'} remaining.`
            : "You have used all included revisions. Continuing will take you to buy more."
        }
        maxWidth={520}
        footer={
          <>
            <Button variant="outline" onClick={() => setRevOpen(false)}>Cancel</Button>
            <Button
              tone="client"
              loading={busy}
              disabled={revMsg.trim().length < 10}
              onClick={async () => {
                await callAction('request-revision', { message: revMsg });
                setRevOpen(false);
                setRevMsg('');
              }}
            >
              {revisionsLeft > 0 ? 'Send revision request' : 'Continue to buy revisions'}
            </Button>
          </>
        }
      >
        <FormField label="What needs to change?" hint="Be specific. The freelancer will see this verbatim.">
          <Textarea
            value={revMsg}
            onChange={setRevMsg}
            rows={5}
            placeholder="Hero feels too quiet, try a stronger headline verb and a punchier CTA color."
          />
        </FormField>
      </Dialog>

      <Dialog
        open={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        title="Raise a dispute"
        subtitle="Disputes pause the auto-accept timer and go to an admin for review. Try a revision request first if possible."
        maxWidth={540}
        footer={
          <>
            <Button variant="outline" onClick={() => setDisputeOpen(false)}>Cancel</Button>
            <Button
              danger
              loading={busy}
              disabled={disputeReason.trim().length < 20}
              onClick={async () => {
                await callAction('dispute', { reason: disputeReason });
                setDisputeOpen(false);
                setDisputeReason('');
              }}
            >
              Raise dispute
            </Button>
          </>
        }
      >
        <FormField label="Reason for dispute" required hint="At least 20 characters. Reviewers read this first.">
          <Textarea
            value={disputeReason}
            onChange={setDisputeReason}
            rows={5}
            placeholder="The delivered files do not match the brief in two specific ways: (1)..."
          />
        </FormField>
      </Dialog>

      <DeliverDialog
        open={deliverOpen}
        onClose={() => setDeliverOpen(false)}
        onDeliver={async (message, attachments) => {
          await callAction('deliver', { message, attachments });
          setDeliverOpen(false);
        }}
      />
    </div>
  );
}

function DeliverDialog({
  open, onClose, onDeliver,
}: {
  open: boolean;
  onClose: () => void;
  onDeliver: (message: string, attachments: { r2Key: string; filename: string; size: number; mime: string }[]) => Promise<void>;
}) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setMessage(''); setFiles([]); setBusy(false); } }, [open]);

  const anyUploading = files.some(f => f.status === 'uploading');
  const anyError = files.some(f => f.status === 'error');
  const disabled = !message.trim() || anyUploading || anyError;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Submit delivery"
      subtitle="Add a short note for the client and attach the deliverables. Files are uploaded to private object storage."
      maxWidth={620}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            tone="freelancer"
            loading={busy}
            disabled={disabled}
            onClick={async () => {
              setBusy(true);
              try {
                await onDeliver(
                  message,
                  files
                    .filter(f => f.status === 'done')
                    .map(f => ({ r2Key: f.r2Key, filename: f.filename, size: f.size, mime: f.mime })),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {anyUploading ? 'Uploading...' : 'Submit delivery'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="Note to client" hint="What did you do, and what should they look at first?">
          <Textarea
            value={message}
            onChange={setMessage}
            rows={4}
            placeholder="Final files attached. The Figma uses your brand colors and includes three breakpoints..."
          />
        </FormField>
        <FormField label="Attachments">
          <AttachmentUploader files={files} onChange={setFiles} />
        </FormField>
      </div>
    </Dialog>
  );
}
