'use client';

import { Suspense, use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Button,
  Card,
  Icon,
  ServicesShell,
  Skeleton,
  formatPrice,
} from '../../../../services-ui';

interface OutgoingOrder {
  id: string;
  serviceId: string;
  serviceTitle: string;
  freelancerId: number;
  freelancerName: string;
  basePrice: number;
  currency: string;
  state: string;
  deliveryDeadline: string;
  createdAt: string;
}

export default function CheckoutReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={
      <ServicesShell mode="client">
        <Card padding={48} style={{ textAlign: 'center', maxWidth: 520, margin: '60px auto' }}>
          <Skeleton width={72} height={72} radius={36} style={{ margin: '0 auto 20px' }} />
          <Skeleton width="60%" height={18} style={{ margin: '0 auto 8px' }} />
        </Card>
      </ServicesShell>
    }>
      <ReturnInner serviceId={id} />
    </Suspense>
  );
}

function ReturnInner({ serviceId }: { serviceId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id') ?? null;

  const [stage, setStage] = useState<'verifying' | 'ready' | 'pending' | 'error'>('verifying');
  const [order, setOrder] = useState<OutgoingOrder | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [messageBusy, setMessageBusy] = useState(false);

  async function handleMessageFreelancer() {
    if (!order || messageBusy) return;
    setMessageBusy(true);
    try {
      const res = await fetch('/api/conversations/direct', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ freelancerId: order.freelancerId, forceDirect: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error ?? 'Could not open chat');
        return;
      }
      router.push(`/messages?conversation=${json.conversationId}`);
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setMessageBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    // Webhook can take a while to fire in dev; total budget ~60s before we
    // tell the user the order is "still processing".
    const MAX_ATTEMPTS = 30;
    const INTERVAL_MS = 2000;

    async function poll(n: number) {
      try {
        const res = await fetch('/api/service-orders/outgoing');
        if (cancelled) return;
        const raw = await res.text();
        let parsed: unknown = null;
        try { parsed = raw ? JSON.parse(raw) : null; } catch { parsed = null; }
        if (!res.ok) {
          const apiError =
            parsed && typeof parsed === 'object' && 'error' in parsed
              ? String((parsed as { error: unknown }).error)
              : '';
          throw new Error(apiError || `Request failed (${res.status})`);
        }
        const orders = (parsed ?? []) as OutgoingOrder[];
        // Pick the newest order matching this service.
        const match = orders
          .filter(o => o.serviceId === serviceId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        if (match) {
          setOrder(match);
          setStage('ready');
          return;
        }
        if (n >= MAX_ATTEMPTS) {
          setStage('pending');
          return;
        }
        setAttempt(n + 1);
        timer = setTimeout(() => poll(n + 1), INTERVAL_MS);
      } catch {
        if (!cancelled) setStage('error');
      }
    }

    void poll(0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [serviceId]);

  if (stage === 'verifying') {
    return (
      <ServicesShell mode="client">
        <Card padding={48} style={{ textAlign: 'center', maxWidth: 520, margin: '60px auto' }}>
          <div
            style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--status-info-bg)', color: 'var(--client-primary)',
              display: 'grid', placeItems: 'center', margin: '0 auto 20px',
            }}
          >
            <Icon name="clock" size={28} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg-1)', margin: '0 0 6px' }}>
            Verifying your payment
          </h2>
          <p style={{ color: 'var(--fg-4)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            Stripe is confirming the charge with us. This usually takes a few seconds.
            {attempt > 0 && ` (Attempt ${attempt + 1})`}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <Button variant="outline" onClick={() => router.push('/client/orders')}>
              View my orders
            </Button>
          </div>
          {sessionId && (
            <div style={{ fontSize: 11, color: 'var(--fg-5)', marginTop: 16 }}>
              Session: <code>{sessionId}</code>
            </div>
          )}
        </Card>
      </ServicesShell>
    );
  }

  if (stage === 'pending' || stage === 'error') {
    return (
      <ServicesShell mode="client">
        <Card padding={40} style={{ textAlign: 'center', maxWidth: 520, margin: '40px auto' }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--status-warning-bg)', color: '#7a5a00',
              display: 'grid', placeItems: 'center', margin: '0 auto 16px',
            }}
          >
            <Icon name="clock" size={28} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg-1)', margin: 0 }}>
            Your payment is still processing
          </h2>
          <p style={{ color: 'var(--fg-4)', fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
            We have received the payment but the order has not been confirmed yet. This usually
            clears in under a minute. You can safely close this tab; we will email you as soon as
            your order is ready.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <Button variant="outline" onClick={() => router.push('/client/orders')}>View my orders</Button>
            <Button variant="secondary" icon="refresh" onClick={() => { setAttempt(0); setStage('verifying'); }}>
              Check again
            </Button>
          </div>
          {sessionId && (
            <div style={{ fontSize: 11, color: 'var(--fg-5)', marginTop: 16 }}>
              Session: <code>{sessionId}</code>
            </div>
          )}
        </Card>
      </ServicesShell>
    );
  }

  return (
    <ServicesShell mode="client">
      <div style={{ maxWidth: 560, margin: '40px auto' }}>
        <Card padding={32} style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--status-success-bg)', color: 'var(--status-success)',
              display: 'grid', placeItems: 'center', margin: '0 auto 20px',
            }}
          >
            <Icon name="check" size={32} strokeWidth={3} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--fg-1)', margin: 0 }}>
            Payment received
          </h1>
          {order && (
            <p style={{ color: 'var(--fg-4)', fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
              Order #{order.id.slice(-4)} is now with {order.freelancerName}. You will hear back
              inside the order page.
            </p>
          )}

          {order && (
            <Card
              padding={16}
              style={{
                background: 'var(--bg-subtle)', boxShadow: 'none',
                border: '1px solid var(--border-2)', textAlign: 'left', margin: '24px 0',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)', marginBottom: 6 }}>
                {order.serviceTitle}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--fg-4)' }}>
                <span>Total paid</span>
                <b style={{ color: 'var(--fg-1)' }}>{formatPrice(order.basePrice, { currency: order.currency })}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--fg-4)', marginTop: 4 }}>
                <span>Estimated delivery</span>
                <b style={{ color: 'var(--fg-1)' }}>{new Date(order.deliveryDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</b>
              </div>
            </Card>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button onClick={() => order && router.push(`/orders/${order.id}`)} iconRight="arrowRight" tone="client" disabled={!order}>
              Go to order
            </Button>
            <Button
              variant="outline"
              icon="users"
              tone="freelancer"
              loading={messageBusy}
              disabled={!order}
              onClick={handleMessageFreelancer}
            >
              Message freelancer
            </Button>
            <Button variant="outline" onClick={() => router.push('/services')}>
              Keep browsing
            </Button>
          </div>
        </Card>
      </div>
    </ServicesShell>
  );
}
