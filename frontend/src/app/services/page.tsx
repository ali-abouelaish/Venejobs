'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  EmptyState,
  ErrorState,
  FilterChip,
  Pagination,
  ServiceCard,
  ServicesShell,
  SkeletonCard,
  TextInput,
  Select,
} from '../services-ui';

const CATEGORIES = [
  'Design & Creative',
  'Programming & Tech',
  'Writing & Translation',
  'Video & Animation',
  'Marketing',
  'Business',
];

interface BrowseService {
  id: string;
  title: string;
  description: string;
  category: string;
  basePrice: number;
  currency: string;
  deliveryDays: number;
  baseRevisions: number;
  coverImageUrl: string | null;
  createdAt: string;
  freelancerId: number;
  freelancerName: string;
  ratingAvg: string | null;
  ratingCount: number;
}

type PriceBand = 'any' | 'under100' | '100to250' | 'over250';
type Delivery = 'any' | '2' | '5' | '7';
type SortKey = 'newest' | 'priceLow' | 'priceHigh';

const PAGE_SIZE = 12;

export default function ServicesBrowsePage() {
  const router = useRouter();
  const [category, setCategory] = useState<'all' | string>('all');
  const [search, setSearch] = useState('');
  const [priceBand, setPriceBand] = useState<PriceBand>('any');
  const [delivery, setDelivery] = useState<Delivery>('any');
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<BrowseService[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (priceBand === 'under100') params.set('maxPrice', '10000');
      if (priceBand === '100to250') { params.set('minPrice', '10000'); params.set('maxPrice', '25000'); }
      if (priceBand === 'over250')  params.set('minPrice', '25000');
      if (delivery !== 'any') params.set('maxDeliveryDays', delivery);
      params.set('limit', '50');
      const res = await fetch(`/api/services?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to load');
      setItems((data.items ?? data) as BrowseService[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, priceBand, delivery]);

  let filtered = items ?? [];
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }
  if (sort === 'priceLow')  filtered = [...filtered].sort((a, b) => a.basePrice - b.basePrice);
  if (sort === 'priceHigh') filtered = [...filtered].sort((a, b) => b.basePrice - a.basePrice);
  // 'newest' already returned from API in created_at desc order.

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <ServicesShell mode="public">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--fg-1)', margin: 0 }}>Find a service</h1>
          <p style={{ color: 'var(--fg-4)', fontSize: 15, marginTop: 4 }}>
            Fixed-price work, delivered on a deadline. Pay once, get the file.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, maxWidth: 480 }}>
            <TextInput value={search} onChange={setSearch} placeholder="Search services by keyword" icon="search" />
          </div>
          <Select
            value={sort}
            onChange={v => setSort(v as SortKey)}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'priceLow', label: 'Price: low to high' },
              { value: 'priceHigh', label: 'Price: high to low' },
            ]}
            style={{ width: 220 }}
          />
        </div>

        <div className="vj-no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          <FilterChip
            label="All categories"
            active={category === 'all'}
            onClick={() => setCategory('all')}
            count={(items ?? []).length}
          />
          {CATEGORIES.map(c => (
            <FilterChip
              key={c}
              label={c}
              active={category === c}
              onClick={() => setCategory(c)}
              count={(items ?? []).filter(s => s.category === c).length}
            />
          ))}
        </div>

        <div
          style={{
            display: 'flex', gap: 12, flexWrap: 'wrap',
            padding: '12px 16px', background: 'var(--bg-subtle)',
            borderRadius: 10, border: '1px solid var(--border-2)',
          }}
        >
          <FilterRow label="Price">
            {([
              { v: 'any',      l: 'Any' },
              { v: 'under100', l: 'Under $100' },
              { v: '100to250', l: '$100 to $250' },
              { v: 'over250',  l: 'Over $250' },
            ] as const).map(x => (
              <FilterChip key={x.v} label={x.l} active={priceBand === x.v} onClick={() => setPriceBand(x.v)} />
            ))}
          </FilterRow>
          <FilterRow label="Delivery">
            {([
              { v: 'any', l: 'Any' },
              { v: '2',   l: 'Within 2d' },
              { v: '5',   l: 'Within 5d' },
              { v: '7',   l: 'Within 7d' },
            ] as const).map(x => (
              <FilterChip key={x.v} label={x.l} active={delivery === x.v} onClick={() => setDelivery(x.v)} />
            ))}
          </FilterRow>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <ErrorState title="Could not load services" body={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title="No services match your filters"
            body="Try widening price or delivery, or clear a chip."
            action={
              <Button
                variant="secondary"
                onClick={() => { setCategory('all'); setPriceBand('any'); setDelivery('any'); setSearch(''); }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {pageItems.map(s => (
                <ServiceCard
                  key={s.id}
                  service={{
                    ...s,
                    rating: s.ratingAvg ? Number(s.ratingAvg) : undefined,
                    reviews: s.ratingCount > 0 ? s.ratingCount : undefined,
                  }}
                  onClick={() => router.push(`/services/${s.id}`)}
                />
              ))}
            </div>
            <Pagination page={page} total={filtered.length} perPage={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </div>
    </ServicesShell>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: 'var(--fg-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 4 }}>
        {label}
      </span>
      {children}
    </div>
  );
}
