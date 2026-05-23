'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import Link from 'next/link';
import {
  AddonRow,
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  ErrorState,
  Icon,
  ImageCarousel,
  ServicesShell,
  Skeleton,
  Stars,
  Stat,
  formatPrice,
} from '../../services-ui';
import { UserReviewsSection, RatingSummary } from '../../components/reviews/UserReviewsSection';

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
  freelancerId: number;
  freelancerName: string;
  title: string;
  description: string;
  category: string;
  basePrice: number;
  currency: string;
  deliveryDays: number;
  baseRevisions: number;
  coverImageUrl: string | null;
  galleryImageUrls: string[];
  status: string;
  addons: Addon[];
  ratingAvg: string | null;
  ratingCount: number;
}

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [contactBusy, setContactBusy] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/services/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Not found');
      setService(data as ServiceDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function contactFreelancer() {
    if (!service || contactBusy) return;
    setContactBusy(true);
    setContactError(null);
    try {
      const res = await fetch('/api/conversations/direct', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ freelancerId: service.freelancerId, forceDirect: true }),
      });
      if (res.status === 401) {
        const here = window.location.pathname + window.location.search;
        router.push(`/auth/signin?reason=auth&next=${encodeURIComponent(here)}`);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Could not open chat');
      router.push(`/messages?conversation=${data.conversationId}`);
    } catch (e) {
      setContactError(e instanceof Error ? e.message : String(e));
    } finally {
      setContactBusy(false);
    }
  }

  async function startCheckout() {
    if (!service) return;
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const addons = Object.entries(qty)
        .filter(([, q]) => q > 0)
        .map(([addonId, quantity]) => ({ addonId, quantity }));
      const res = await fetch('/api/service-orders/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ serviceId: service.id, addons }),
      });
      if (res.status === 401) {
        const here = window.location.pathname + window.location.search;
        router.push(`/auth/signin?reason=auth&next=${encodeURIComponent(here)}`);
        return;
      }
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
      <ServicesShell mode="public">
        <div className="vj-two-col">
          <div>
            <Skeleton width="100%" height={320} radius={16} style={{ marginBottom: 24 }} />
            <Skeleton width="70%" height={28} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={14} style={{ marginBottom: 6 }} />
            <Skeleton width="80%" height={14} />
          </div>
          <Card padding={20}>
            <Skeleton width="40%" height={18} style={{ marginBottom: 16 }} />
            <Skeleton width="60%" height={32} style={{ marginBottom: 16 }} />
            <Skeleton width="100%" height={44} />
          </Card>
        </div>
      </ServicesShell>
    );
  }

  if (error || !service) {
    return (
      <ServicesShell mode="public">
        <ErrorState title="Could not load service" body={error ?? 'Service not found.'} onRetry={load} />
      </ServicesShell>
    );
  }

  const addonsSubtotal = (service.addons ?? []).reduce((sum, a) => sum + (qty[a.id] ?? 0) * a.price, 0);
  const total = service.basePrice + addonsSubtotal;

  return (
    <ServicesShell mode="public">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Breadcrumbs
          items={[
            { label: 'All services', to: '/services' },
            { label: service.category },
            { label: service.title },
          ]}
          onNavigate={to => router.push(to)}
        />

        <div className="vj-two-col">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <ImageCarousel
              images={[
                ...(service.coverImageUrl ? [service.coverImageUrl] : []),
                ...(service.galleryImageUrls ?? []),
              ]}
              alt={service.title}
              height={360}
            />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <Badge tone="brand" dot={false}>{service.category}</Badge>
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--fg-1)', lineHeight: 1.25, margin: 0 }}>
                {service.title}
              </h1>
            </div>

            <Card padding={20}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <Avatar name={service.freelancerName} size={52} tone="freelancer" />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)' }}>{service.freelancerName}</div>
                  <div style={{ fontSize: 13, color: 'var(--fg-4)', marginTop: 4 }}>
                    <RatingSummary
                      value={service.ratingAvg ? Number(service.ratingAvg) : 0}
                      count={service.ratingCount ?? 0}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    icon="users"
                    tone="freelancer"
                    loading={contactBusy}
                    onClick={contactFreelancer}
                  >
                    Contact freelancer
                  </Button>
                  <Link
                    href={`/client/FreelancerProfile/${service.freelancerId}`}
                    prefetch={false}
                    style={{ textDecoration: 'none' }}
                  >
                    <Button variant="outline" size="sm" iconRight="arrowUpRight">
                      View portfolio
                    </Button>
                  </Link>
                </div>
              </div>
              {contactError && (
                <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'var(--status-error-bg)', color: '#8a2828', fontSize: 13 }}>
                  {contactError}
                </div>
              )}
            </Card>

            <Card padding={28}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-1)', margin: 0, marginBottom: 12 }}>
                About this service
              </h3>
              <p style={{ fontSize: 15, color: 'var(--fg-3)', lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0 }}>
                {service.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-2)' }}>
                <Stat label="Delivery" value={`${service.deliveryDays} days`} icon="clock" />
                <Stat label="Revisions" value={service.baseRevisions} icon="refresh" />
                <Stat label="Category" value={service.category} icon="tag" />
              </div>
            </Card>

            <UserReviewsSection
              userId={service.freelancerId}
              title={`Reviews of ${service.freelancerName}`}
            />
          </div>

          <div style={{ position: 'sticky', top: 88 }}>
            <Card padding={20}>
              <div style={{ fontSize: 12, color: 'var(--fg-4)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                Starting at
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--fg-1)', marginTop: 2 }}>
                {formatPrice(service.basePrice, { currency: service.currency })}
              </div>
              <div style={{ fontSize: 13, color: 'var(--fg-4)', marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                <Icon name="clock" size={13} /> {service.deliveryDays}-day delivery
                <span>·</span>
                <Icon name="refresh" size={13} /> {service.baseRevisions} revision{service.baseRevisions === 1 ? '' : 's'}
              </div>

              {service.addons && service.addons.length > 0 && (
                <>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)', margin: '20px 0 10px' }}>
                    Add-ons
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {service.addons.map(a => (
                      <AddonRow
                        key={a.id}
                        addon={{ ...a, allowMulti: (a.maxQuantity ?? 1) > 1, description: a.description }}
                        quantity={qty[a.id] ?? 0}
                        onQuantityChange={n => setQty(q => ({ ...q, [a.id]: n }))}
                        max={a.maxQuantity ?? 5}
                        currency={service.currency}
                      />
                    ))}
                  </div>
                </>
              )}

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--fg-4)' }}>
                  <span>Base service</span>
                  <span>{formatPrice(service.basePrice, { currency: service.currency })}</span>
                </div>
                {addonsSubtotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--fg-4)', marginTop: 6 }}>
                    <span>Add-ons</span>
                    <span>{formatPrice(addonsSubtotal, { currency: service.currency })}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-2)' }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-1)' }}>Total today</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg-1)' }}>
                    {formatPrice(total, { currency: service.currency })}
                  </span>
                </div>
              </div>

              {checkoutError && (
                <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--status-error-bg)', color: '#8a2828', fontSize: 13 }}>
                  {checkoutError}
                </div>
              )}

              {!clientSecret && (
                <>
                  <Button
                    fullWidth
                    size="lg"
                    tone="client"
                    iconRight="arrowRight"
                    style={{ marginTop: 16 }}
                    loading={checkoutLoading}
                    onClick={startCheckout}
                  >
                    Continue to checkout
                  </Button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, color: 'var(--fg-4)', justifyContent: 'center' }}>
                    <Icon name="lock" size={12} /> Secure payment via Stripe
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>

        {clientSecret && (
          <Card padding={20}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', margin: 0, marginBottom: 12 }}>
              Complete your purchase
            </h3>
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
