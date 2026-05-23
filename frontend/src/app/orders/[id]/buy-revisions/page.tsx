'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import {
  AddonRow,
  Breadcrumbs,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  ServicesShell,
  Skeleton,
  formatPrice,
} from '../../../services-ui';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

interface Addon {
  id: string;
  type: 'revision' | 'extra' | 'faster_delivery';
  name: string;
  description: string | null;
  price: number;
  maxQuantity: number | null;
}

interface ServiceDetail {
  id: string;
  title: string;
  currency: string;
  addons: Addon[];
}

interface OrderDetail {
  order: { id: string; serviceId: string; currency: string };
}

export default function BuyRevisionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [orderInfo, setOrderInfo] = useState<OrderDetail | null>(null);
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const orderRes = await fetch(`/api/service-orders/${id}`);
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData?.error ?? 'Failed to load order');
      setOrderInfo(orderData as OrderDetail);
      const serviceRes = await fetch(`/api/services/${orderData.order.serviceId}`);
      const serviceData = await serviceRes.json();
      if (!serviceRes.ok) throw new Error(serviceData?.error ?? 'Failed to load service');
      setService(serviceData as ServiceDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`order:${id}:revision-draft`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.message) setDraft(String(parsed.message));
      }
    } catch {
      // ignore
    }
  }, [id]);

  async function startCheckout() {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const addons = Object.entries(qty)
        .filter(([, q]) => q > 0)
        .map(([addonId, quantity]) => ({ addonId, quantity }));
      if (addons.length === 0) throw new Error('Select at least one addon.');
      const res = await fetch(`/api/service-orders/${id}/buy-revisions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ addons }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Checkout failed');
      setClientSecret(data.clientSecret);
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : String(e));
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return (
      <ServicesShell mode="client">
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Skeleton width={200} height={14} />
          <Skeleton width={300} height={28} />
          <Card padding={24}>
            <Skeleton width="40%" height={16} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={60} />
          </Card>
        </div>
      </ServicesShell>
    );
  }

  if (error || !orderInfo || !service) {
    return (
      <ServicesShell mode="client">
        <ErrorState title="Could not load page" body={error ?? 'Order or service not found.'} onRetry={load} />
      </ServicesShell>
    );
  }

  const revisionAddons = service.addons.filter(a => a.type === 'revision');
  const subtotal = revisionAddons.reduce((s, a) => s + a.price * (qty[a.id] ?? 0), 0);
  const anySelected = Object.values(qty).some(v => v > 0);

  return (
    <ServicesShell mode="client">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760, margin: '0 auto' }}>
        <Breadcrumbs
          onNavigate={to => router.push(to)}
          items={[
            { label: 'My orders', to: '/client/orders' },
            { label: `Order #${orderInfo.order.id.slice(-4)}`, to: `/orders/${id}` },
            { label: 'Buy revisions' },
          ]}
        />

        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--fg-1)', margin: 0 }}>Buy more revisions</h1>
          <p style={{ color: 'var(--fg-4)', fontSize: 14, marginTop: 4, lineHeight: 1.6 }}>
            You have used all included revisions on this order. Buy more here. After payment clears,
            return to the order and re-send your revision request.
          </p>
        </div>

        {draft && (
          <Card style={{ background: 'var(--status-info-bg)', boxShadow: 'none', border: 'none' }} padding={16}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Icon name="info" size={16} color="var(--client-primary)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.55 }}>
                <b style={{ color: 'var(--client-primary)' }}>Saved revision draft.</b> We kept your message so you do not lose it:{' '}
                <i>&quot;{draft.length > 120 ? draft.slice(0, 120) + '...' : draft}&quot;</i>
              </div>
            </div>
          </Card>
        )}

        {!clientSecret && (
          <>
            <Card padding={24}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', margin: 0, marginBottom: 16 }}>Available revision addons</h3>
              {revisionAddons.length === 0 ? (
                <EmptyState
                  icon="alert"
                  title="No revision addons on this service"
                  body="Ask the freelancer to add one in their service settings, or use the messages thread to reach a resolution."
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {revisionAddons.map(a => (
                    <AddonRow
                      key={a.id}
                      addon={{ ...a, allowMulti: (a.maxQuantity ?? 1) > 1 }}
                      quantity={qty[a.id] ?? 0}
                      onQuantityChange={n => setQty(q => ({ ...q, [a.id]: n }))}
                      max={a.maxQuantity ?? 5}
                      currency={service.currency}
                    />
                  ))}
                </div>
              )}
            </Card>

            <Card padding={20}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--fg-4)' }}>
                <span>Subtotal</span>
                <span style={{ color: 'var(--fg-2)', fontWeight: 600 }}>{formatPrice(subtotal, { currency: service.currency })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--border-2)' }}>
                <span style={{ fontWeight: 600, color: 'var(--fg-1)' }}>Total today</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg-1)' }}>{formatPrice(subtotal, { currency: service.currency })}</span>
              </div>
            </Card>

            {checkoutError && (
              <Card padding={16} style={{ background: 'var(--status-error-bg)', color: '#8a2828', boxShadow: 'none', border: '1px solid var(--status-error)' }}>
                <span style={{ fontSize: 13 }}>{checkoutError}</span>
              </Card>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <Button variant="outline" onClick={() => router.push(`/orders/${id}`)}>Back to order</Button>
              <Button
                size="lg"
                tone="client"
                iconRight="arrowRight"
                disabled={!anySelected}
                loading={checkoutLoading}
                onClick={startCheckout}
              >
                Pay {formatPrice(subtotal, { currency: service.currency })}
              </Button>
            </div>
          </>
        )}

        {clientSecret && (
          <Card padding={20}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', margin: 0, marginBottom: 12 }}>Complete your purchase</h3>
            <div style={{ borderRadius: 10, overflow: 'hidden' }}>
              <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </Card>
        )}
      </div>
    </ServicesShell>
  );
}
