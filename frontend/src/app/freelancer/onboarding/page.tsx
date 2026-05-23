'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Breadcrumbs,
  Button,
  Card,
  ErrorState,
  Icon,
  ServicesShell,
  Skeleton,
  StatusLine,
} from '../../services-ui';

interface ConnectStatus {
  userId: number;
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsCurrentlyDue: string[];
  lastSyncedAt: string;
}

export default function FreelancerOnboardingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/connect/status');
      if (res.status === 404) {
        setStatus(null);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to load status');
      setStatus(data as ConnectStatus);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function startOnboarding() {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch('/api/connect/onboarding-link', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to create onboarding link');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStarting(false);
    }
  }

  const ready = !!status?.chargesEnabled && !!status?.payoutsEnabled;
  const detailsOk = !!status?.detailsSubmitted;

  return (
    <ServicesShell mode="freelancer">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720, margin: '0 auto' }}>
        <div>
          <Breadcrumbs
            items={[{ label: 'Freelancer', to: '/freelancer' }, { label: 'Onboarding' }]}
            onNavigate={to => router.push(to)}
          />
          <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--fg-1)' }}>Set up payouts</h1>
          <p style={{ color: 'var(--fg-4)', fontSize: 15, marginTop: 4, lineHeight: 1.6 }}>
            Connect a Stripe account so we can transfer your earnings when clients accept your
            deliveries. This usually takes about three minutes.
          </p>
        </div>

        {loading ? (
          <Card padding={28}>
            <Skeleton width="40%" height={20} style={{ marginBottom: 16 }} />
            <Skeleton width="100%" height={14} style={{ marginBottom: 10 }} />
            <Skeleton width="80%" height={14} style={{ marginBottom: 24 }} />
            <Skeleton width="60%" height={14} style={{ marginBottom: 10 }} />
            <Skeleton width="55%" height={14} />
          </Card>
        ) : error && !status ? (
          <ErrorState
            title="Could not load onboarding status"
            body={error}
            onRetry={refresh}
          />
        ) : (
          <Card padding={28}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
              <div
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'var(--freelancer-primary-tint)', color: 'var(--freelancer-primary)',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}
              >
                <Icon name="creditCard" size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-1)', margin: 0 }}>Stripe Connect account</h3>
                <p style={{ fontSize: 14, color: 'var(--fg-4)', marginTop: 4, lineHeight: 1.55 }}>
                  You will be redirected to Stripe to verify your identity and link a bank account.
                  We never see your account number.
                </p>
              </div>
              {ready ? (
                <Badge tone="success">Active</Badge>
              ) : status ? (
                <Badge tone="warning">Pending</Badge>
              ) : (
                <Badge tone="neutral">Not started</Badge>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 0', borderTop: '1px solid var(--border-2)' }}>
              <StatusLine
                label="Account details submitted"
                ok={detailsOk}
                hint={detailsOk ? 'Verified by Stripe' : 'Required to continue'}
              />
              <StatusLine
                label="Charges enabled"
                ok={!!status?.chargesEnabled}
                hint={status?.chargesEnabled ? 'Buyers can pay' : 'Pending Stripe approval'}
              />
              <StatusLine
                label="Payouts enabled"
                ok={!!status?.payoutsEnabled}
                hint={status?.payoutsEnabled ? 'Funds will transfer to your bank' : 'Add a bank account in Stripe'}
              />
              {status?.requirementsCurrentlyDue?.length ? (
                <div style={{ marginTop: 6, padding: '10px 12px', borderRadius: 8, background: 'var(--status-warning-bg)', color: '#7a5a00', fontSize: 12 }}>
                  <b>Outstanding requirements:</b> {status.requirementsCurrentlyDue.join(', ')}
                </div>
              ) : null}
              {status?.lastSyncedAt && (
                <div style={{ fontSize: 11, color: 'var(--fg-5)', marginTop: 4 }}>
                  Last synced {new Date(status.lastSyncedAt).toLocaleString()}
                </div>
              )}
            </div>

            {error && status && (
              <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 8, background: 'var(--status-error-bg)', color: '#8a2828', fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
              {!ready && (
                <Button loading={starting} onClick={startOnboarding} iconRight="arrowRight" tone="freelancer">
                  {detailsOk ? 'Continue with Stripe' : 'Start onboarding'}
                </Button>
              )}
              {ready && (
                <Button onClick={() => router.push('/freelancer/services/new')} iconRight="arrowRight" tone="freelancer">
                  Create your first service
                </Button>
              )}
              <Button variant="outline" onClick={refresh} icon="refresh" disabled={loading}>
                Refresh status
              </Button>
            </div>
          </Card>
        )}

        <Card padding={20} style={{ background: 'var(--bg-subtle)', boxShadow: 'none', border: '1px solid var(--border-2)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Icon name="info" size={18} color="var(--fg-4)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: 'var(--fg-4)', lineHeight: 1.6 }}>
              <b style={{ color: 'var(--fg-2)' }}>Why we need this.</b> Payouts run on Stripe
              Transfers from our platform balance to your Connect account. Until charges and
              payouts are both enabled, your services cannot be published. Reviewers see this on
              the approval page.
            </div>
          </div>
        </Card>
      </div>
    </ServicesShell>
  );
}
