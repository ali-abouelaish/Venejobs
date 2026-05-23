'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Breadcrumbs,
  Button,
  Card,
  ErrorState,
  Icon,
  PageHeader,
  ServicesShell,
  Skeleton,
  StatusLine,
  formatPrice,
  shortDate,
} from '../../services-ui';
import type { FinanceActivityItem } from '@/app/api/finances/activity/route';
import type { FinanceStripeResponse } from '@/app/api/finances/stripe/route';

interface ConnectStatus {
  userId: number;
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsCurrentlyDue: string[];
  lastSyncedAt: string;
}

interface SummaryBucket {
  lifetimeEarned: number;
  pending: number;
  thisMonth: number;
  earnedCount: number;
  pendingCount: number;
}

interface SummaryResponse {
  byCurrency: Record<string, SummaryBucket>;
}

interface ActivityResponse {
  items: FinanceActivityItem[];
  hasMore: boolean;
  total: number;
}

const SO_EARNED_STATES = new Set(['accepted', 'auto_accepted', 'completed']);

function stateLabel(item: FinanceActivityItem): { text: string; tone: 'success' | 'warning' | 'neutral' | 'error' } {
  if (SO_EARNED_STATES.has(item.state)) return { text: 'Earned', tone: 'success' };
  if (item.state === 'cancelled' || item.state === 'refunded') {
    return { text: item.state === 'refunded' ? 'Refunded' : 'Cancelled', tone: 'error' };
  }
  if (item.state === 'disputed') return { text: 'Disputed', tone: 'warning' };
  if (item.state === 'delivered') return { text: 'Awaiting acceptance', tone: 'warning' };
  if (item.state === 'revision_requested') return { text: 'Revision requested', tone: 'warning' };
  if (item.state === 'in_progress') return { text: 'In progress', tone: 'warning' };
  if (item.state === 'paid') {
    return { text: item.kind === 'contract' ? 'Awaiting delivery' : 'Awaiting start', tone: 'warning' };
  }
  return { text: item.state, tone: 'neutral' };
}

export default function FreelancerFinancesPage() {
  const router = useRouter();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [stripeLive, setStripeLive] = useState<FinanceStripeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingDashboard, setOpeningDashboard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [statusRes, summaryRes, activityRes, stripeRes] = await Promise.all([
        fetch('/api/connect/status'),
        fetch('/api/finances/summary'),
        fetch('/api/finances/activity?limit=20'),
        fetch('/api/finances/stripe'),
      ]);

      if (!summaryRes.ok) throw new Error(`Summary failed (${summaryRes.status})`);
      if (!activityRes.ok) throw new Error(`Activity failed (${activityRes.status})`);

      setStatus(statusRes.ok ? await statusRes.json() : null);
      setSummary(await summaryRes.json());
      setActivity(await activityRes.json());
      setStripeLive(stripeRes.ok ? await stripeRes.json() : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function openStripeDashboard() {
    setOpeningDashboard(true);
    try {
      const res = await fetch('/api/connect/dashboard-link', { method: 'POST' });
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/freelancer/onboarding');
          return;
        }
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Failed (${res.status})`);
      }
      const { url } = await res.json();
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setOpeningDashboard(false);
    }
  }

  const connectReady = !!status?.chargesEnabled && !!status?.payoutsEnabled;
  const currencies = useMemo(() => Object.keys(summary?.byCurrency ?? {}).sort(), [summary]);

  return (
    <ServicesShell mode="freelancer">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 960, margin: '0 auto' }}>
        <div>
          <Breadcrumbs
            items={[{ label: 'Freelancer', to: '/freelancer' }, { label: 'Finances' }]}
            onNavigate={(to) => router.push(to)}
          />
          <PageHeader
            title="Finances"
            subtitle="Your earnings, pending balance, and payouts to your bank."
            action={
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="outline" icon="refresh" onClick={() => load(true)} disabled={loading || refreshing}>
                  Refresh
                </Button>
                {status && (
                  <Button
                    onClick={openStripeDashboard}
                    loading={openingDashboard}
                    iconRight="externalLink"
                    tone="freelancer"
                  >
                    Open Stripe dashboard
                  </Button>
                )}
              </div>
            }
          />
        </div>

        {loading ? (
          <>
            <Card padding={24}><Skeleton width="40%" height={18} style={{ marginBottom: 12 }} /><Skeleton width="100%" height={14} /></Card>
            <Card padding={24}><Skeleton width="60%" height={18} style={{ marginBottom: 16 }} /><Skeleton width="100%" height={48} /></Card>
            <Card padding={24}><Skeleton width="50%" height={18} style={{ marginBottom: 12 }} /><Skeleton width="100%" height={120} /></Card>
          </>
        ) : error ? (
          <ErrorState title="Could not load finances" body={error} onRetry={() => load(true)} />
        ) : (
          <>
            <ConnectStatusCard status={status} ready={connectReady} onStart={() => router.push('/freelancer/onboarding')} />

            <EarningsSummary summary={summary} currencies={currencies} />

            <StripeLiveCard data={stripeLive} ready={connectReady} />

            <ActivityCard items={activity?.items ?? []} />
          </>
        )}
      </div>
    </ServicesShell>
  );
}

// ---------------------------- Connect status ----------------------------

function ConnectStatusCard({
  status,
  ready,
  onStart,
}: {
  status: ConnectStatus | null;
  ready: boolean;
  onStart: () => void;
}) {
  if (!status) {
    return (
      <Card padding={24}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--freelancer-primary-tint)', color: 'var(--freelancer-primary)',
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }}
          >
            <Icon name="creditCard" size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', margin: 0 }}>Payouts not set up</h3>
            <p style={{ fontSize: 13, color: 'var(--fg-4)', marginTop: 4, lineHeight: 1.55, margin: 0 }}>
              Connect a Stripe account so we can transfer your earnings. Takes about three minutes.
            </p>
            <div style={{ marginTop: 12 }}>
              <Button onClick={onStart} iconRight="arrowRight" tone="freelancer">Start onboarding</Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card padding={24}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--freelancer-primary-tint)', color: 'var(--freelancer-primary)',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}
        >
          <Icon name="creditCard" size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', margin: 0 }}>Stripe Connect account</h3>
            {ready ? <Badge tone="success">Active</Badge> : <Badge tone="warning">Action required</Badge>}
          </div>
          <p style={{ fontSize: 12, color: 'var(--fg-5)', marginTop: 4, margin: 0 }}>
            Last synced {new Date(status.lastSyncedAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 0', borderTop: '1px solid var(--border-2)' }}>
        <StatusLine
          label="Account details submitted"
          ok={status.detailsSubmitted}
          hint={status.detailsSubmitted ? 'Verified by Stripe' : 'Required'}
        />
        <StatusLine
          label="Charges enabled"
          ok={status.chargesEnabled}
          hint={status.chargesEnabled ? 'Buyers can pay' : 'Pending Stripe approval'}
        />
        <StatusLine
          label="Payouts enabled"
          ok={status.payoutsEnabled}
          hint={status.payoutsEnabled ? 'Funds transfer to your bank' : 'Add a bank account in Stripe'}
        />
      </div>

      {status.requirementsCurrentlyDue.length > 0 && (
        <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 8, background: 'var(--status-warning-bg)', color: '#7a5a00', fontSize: 12 }}>
          <b>Outstanding requirements:</b> {status.requirementsCurrentlyDue.join(', ')}
        </div>
      )}

      {!ready && (
        <div style={{ marginTop: 12 }}>
          <Button onClick={onStart} iconRight="arrowRight" tone="freelancer">Finish onboarding</Button>
        </div>
      )}
    </Card>
  );
}

// ---------------------------- Earnings summary ----------------------------

function EarningsSummary({
  summary,
  currencies,
}: {
  summary: SummaryResponse | null;
  currencies: string[];
}) {
  if (!summary || currencies.length === 0) {
    return (
      <Card padding={24}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', margin: 0, marginBottom: 4 }}>Earnings</h3>
        <p style={{ fontSize: 13, color: 'var(--fg-4)', margin: 0, lineHeight: 1.55 }}>
          No orders yet. Once a client pays for a service or signs a contract, your earnings show up here.
        </p>
      </Card>
    );
  }

  return (
    <Card padding={24}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', margin: 0, marginBottom: 12 }}>Earnings</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {currencies.map((cur) => {
          const b = summary.byCurrency[cur];
          return (
            <div key={cur} style={{ borderTop: '1px solid var(--border-2)', paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-4)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                {cur}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <SummaryStat
                  label="Lifetime earned"
                  value={formatPrice(b.lifetimeEarned, { currency: cur })}
                  hint={`${b.earnedCount} order${b.earnedCount === 1 ? '' : 's'}`}
                  icon="dollar"
                />
                <SummaryStat
                  label="This month"
                  value={formatPrice(b.thisMonth, { currency: cur })}
                  hint="Net of platform fee"
                  icon="calendar"
                />
                <SummaryStat
                  label="Pending"
                  value={formatPrice(b.pending, { currency: cur })}
                  hint={`${b.pendingCount} in flight`}
                  icon="clock"
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SummaryStat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: 'dollar' | 'calendar' | 'clock';
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--fg-4)', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        <Icon name={icon} size={12} />{label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg-1)', marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--fg-5)', marginTop: 2 }}>{hint}</div>
    </div>
  );
}

// ---------------------------- Live Stripe ----------------------------

function StripeLiveCard({ data, ready }: { data: FinanceStripeResponse | null; ready: boolean }) {
  if (!data) {
    return (
      <Card padding={24}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', margin: 0, marginBottom: 4 }}>Stripe balance & payouts</h3>
        <p style={{ fontSize: 13, color: 'var(--fg-4)', margin: 0, lineHeight: 1.55 }}>
          {ready
            ? "Stripe didn't return any balance data. Try refreshing in a moment."
            : 'Available once you finish payout onboarding.'}
        </p>
      </Card>
    );
  }

  const hasBalance = data.balance.available.length > 0 || data.balance.pending.length > 0;

  return (
    <Card padding={24}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', margin: 0, marginBottom: 12 }}>Stripe balance &amp; payouts</h3>

      {hasBalance ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--border-2)' }}>
          <BalanceColumn label="Available now" entries={data.balance.available} icon="checkCircle" />
          <BalanceColumn label="Pending on Stripe" entries={data.balance.pending} icon="clock" />
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--fg-5)', margin: 0, paddingBottom: 12, borderBottom: '1px solid var(--border-2)' }}>
          No balance on your Connect account yet.
        </p>
      )}

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-4)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
          Recent payouts
        </div>
        {data.payouts.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--fg-5)', margin: 0 }}>
            No payouts yet. Stripe will schedule a payout once funds are available.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.payouts.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'var(--bg-subtle)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>
                    {formatPrice(p.amount, { currency: p.currency })}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-5)', marginTop: 2 }}>
                    Arrives {shortDate(new Date(p.arrivalDate * 1000))}
                    {p.method ? ` • ${p.method}` : ''}
                  </div>
                </div>
                <PayoutStatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function BalanceColumn({
  label,
  entries,
  icon,
}: {
  label: string;
  entries: { currency: string; amount: number }[];
  icon: 'checkCircle' | 'clock';
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--fg-4)', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        <Icon name={icon} size={12} />{label}
      </div>
      {entries.length === 0 ? (
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg-5)', marginTop: 6 }}>—</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6 }}>
          {entries.map((b) => (
            <div key={b.currency} style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg-1)' }}>
              {formatPrice(b.amount, { currency: b.currency })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PayoutStatusBadge({ status }: { status: string }) {
  if (status === 'paid') return <Badge tone="success">Paid</Badge>;
  if (status === 'failed' || status === 'canceled') return <Badge tone="error">{status}</Badge>;
  return <Badge tone="warning">{status}</Badge>;
}

// ---------------------------- Activity ----------------------------

function ActivityCard({ items }: { items: FinanceActivityItem[] }) {
  return (
    <Card padding={24}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', margin: 0, marginBottom: 12 }}>Recent activity</h3>
      {items.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--fg-4)', margin: 0, lineHeight: 1.55 }}>
          Nothing to show yet. Completed orders and paid contracts will appear here.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((item, i) => {
            const label = stateLabel(item);
            return (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto auto',
                  gap: 16,
                  alignItems: 'center',
                  padding: '12px 0',
                  borderTop: i === 0 ? '1px solid var(--border-2)' : '1px solid var(--border-2)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.kind === 'contract' ? 'Contract' : item.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--fg-5)', marginTop: 2 }}>
                    {item.clientName} • {shortDate(item.occurredAt)}
                  </div>
                </div>
                <Badge tone={label.tone} size="md">{label.text}</Badge>
                <div style={{ textAlign: 'right', minWidth: 110 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>
                    {formatPrice(item.net, { currency: item.currency })}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-5)', marginTop: 2 }}>
                    {formatPrice(item.gross, { currency: item.currency })} gross
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
