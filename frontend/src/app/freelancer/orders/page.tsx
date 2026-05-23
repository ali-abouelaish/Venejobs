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

interface IncomingOrder {
  id: string;
  serviceId: string;
  serviceTitle: string;
  clientId: number;
  clientName: string;
  freelancerId: number;
  freelancerName: string;
  state: string;
  baseAmount?: number;
  totalAmount?: number;
  basePrice?: number;
  currency: string;
  deliveryDeadline: string;
  createdAt: string;
}

export default function FreelancerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<IncomingOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'history'>('active');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/service-orders/incoming');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to load');
      setOrders(data as IncomingOrder[]);
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
    <ServicesShell mode="freelancer">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <PageHeader
          title="Incoming orders"
          subtitle="Orders clients have placed on your services."
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
                ? 'Active orders show up here once a client checks out. Make sure at least one of your services is published.'
                : 'Completed and cancelled orders will appear here.'
            }
            action={
              tab === 'active' && all.length === 0 ? (
                <Button variant="secondary" tone="freelancer" onClick={() => router.push('/freelancer/services')}>
                  View my services
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(o => (
              <OrderListRow
                key={o.id}
                viewerRole="freelancer"
                onNavigate={to => router.push(to)}
                order={{
                  id: o.id,
                  serviceTitle: o.serviceTitle,
                  counterpartyName: o.clientName,
                  state: o.state,
                  deliveryDeadline: o.deliveryDeadline,
                  totalAmount: o.totalAmount ?? o.baseAmount ?? o.basePrice ?? 0,
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
