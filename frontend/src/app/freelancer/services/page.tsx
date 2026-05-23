'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  EmptyState,
  ErrorState,
  FreelancerServiceCard,
  PageHeader,
  ServicesShell,
  SkeletonCard,
  TabItem,
  Tabs,
} from '../../services-ui';

interface MineService {
  id: string;
  title: string;
  description: string;
  category: string;
  basePrice: number;
  currency: string;
  deliveryDays: number;
  baseRevisions: number;
  status: string;
  rejectionReason: string | null;
  coverImageUrl?: string | null;
  createdAt: string;
  ratingAvg: string | null;
  ratingCount: number;
}

const TABS: { key: 'all' | 'published' | 'pending_review' | 'draft' | 'rejected'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'pending_review', label: 'Pending review' },
  { key: 'draft', label: 'Drafts' },
  { key: 'rejected', label: 'Rejected' },
];

export default function MyServicesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('all');
  const [services, setServices] = useState<MineService[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/services/mine');
      // Read the raw body once so we can surface useful diagnostics when the
      // server returns a 500 with an HTML or empty body (e.g. a missing DB
      // column before migrations have been applied).
      const raw = await res.text();
      let parsed: unknown = null;
      try { parsed = raw ? JSON.parse(raw) : null; } catch { parsed = null; }
      if (!res.ok) {
        const apiError =
          (parsed && typeof parsed === 'object' && 'error' in parsed
            ? String((parsed as { error: unknown }).error)
            : null) ||
          (raw ? raw.slice(0, 200) : '');
        throw new Error(`${res.status}${apiError ? `: ${apiError}` : ' (request failed)'}`);
      }
      setServices((parsed ?? []) as MineService[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const all = services ?? [];
  const counts = all.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});
  const filtered = tab === 'all' ? all : all.filter(s => s.status === tab);

  const tabItems: TabItem[] = TABS.map(t => ({
    key: t.key,
    label: t.label,
    count: t.key === 'all' ? all.length : (counts[t.key] ?? 0),
  }));

  return (
    <ServicesShell mode="freelancer">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <PageHeader
          title="My services"
          subtitle="Manage your listings, addons, and review status."
          action={
            <Button icon="plus" tone="freelancer" onClick={() => router.push('/freelancer/services/new')}>
              New service
            </Button>
          }
        />

        <Tabs value={tab} onChange={k => setTab(k as typeof tab)} items={tabItems} />

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <ErrorState title="Could not load your services" body={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="briefcase"
            title="No services here yet"
            body="Create your first service to start receiving orders from clients."
            action={
              <Button icon="plus" tone="freelancer" onClick={() => router.push('/freelancer/services/new')}>
                New service
              </Button>
            }
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map(s => (
              <FreelancerServiceCard
                key={s.id}
                service={{
                  ...s,
                  freelancerName: undefined,
                  rating: s.ratingAvg ? Number(s.ratingAvg) : undefined,
                  reviews: s.ratingCount > 0 ? s.ratingCount : undefined,
                }}
                onClick={() => router.push(`/freelancer/services/${s.id}/edit`)}
              />
            ))}
          </div>
        )}
      </div>
    </ServicesShell>
  );
}
