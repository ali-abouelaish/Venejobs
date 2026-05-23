'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  isActiveOrderState,
  OrderListRow,
  PageHeader,
  ServicesShell,
  Skeleton,
  Tabs,
} from '../../services-ui';

interface OutgoingOrder {
  id: string;
  serviceId: string;
  serviceTitle: string;
  freelancerId: number;
  freelancerName: string;
  basePrice: number;
  totalAmount?: number;
  currency: string;
  state: string;
  deliveryDeadline: string;
  createdAt: string;
}

export default function ClientOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OutgoingOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'history'>('active');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/service-orders/outgoing');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to load');
      setOrders(data as OutgoingOrder[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const all = orders ?? [];
  const active = all.filter(o => isActiveOrderState(o.state));
  const history = all.filter(o => !isActiveOrderState(o.state));
  const filtered = tab === 'active' ? active : history;

  return (
    <ServicesShell mode="client">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <PageHeader
          title="My orders"
          subtitle="Services you have purchased."
          action={
            <Button icon="plus" variant="secondary" tone="client" onClick={() => router.push('/services')}>
              Buy a service
            </Button>
          }
        />

        <Tabs
          value={tab}
          onChange={k => setTab(k as typeof tab)}
          items={[
            { key: 'active', label: 'Active', count: active.length },
            { key: 'history', label: 'History', count: history.length },
          ]}
        />

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} padding={16}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Skeleton width={44} height={44} radius={22} />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
                    <Skeleton width="40%" height={12} />
                  </div>
                  <Skeleton width={80} height={24} radius={9999} />
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <ErrorState title="Could not load orders" body={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="shoppingBag"
            title={tab === 'active' ? 'No active orders' : 'No completed orders yet'}
            body={
              tab === 'active'
                ? 'When you buy a service, it shows up here.'
                : 'Completed and cancelled orders will appear here.'
            }
            action={
              <Button variant="secondary" tone="client" onClick={() => router.push('/services')}>
                Browse services
              </Button>
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(o => (
              <OrderListRow
                key={o.id}
                viewerRole="client"
                onNavigate={to => router.push(to)}
                order={{
                  id: o.id,
                  serviceTitle: o.serviceTitle,
                  counterpartyName: o.freelancerName,
                  state: o.state,
                  deliveryDeadline: o.deliveryDeadline,
                  totalAmount: o.totalAmount ?? o.basePrice,
                  currency: o.currency,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </ServicesShell>
  );
}
