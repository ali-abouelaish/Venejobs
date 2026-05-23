'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, Icon, Skeleton, shortDate } from '../../services-ui';

interface ReviewRow {
  id: string;
  reviewerId: number;
  revieweeId: number;
  reviewerRole: 'client' | 'freelancer';
  rating: number;
  comment: string;
  status: 'pending' | 'published';
  createdAt: string;
  publishedAt: string | null;
}

interface PageResponse {
  reviews: ReviewRow[];
  rating_avg: number;
  rating_count: number;
  nextCursor: string | null;
}

interface UserReviewsSectionProps {
  userId: number;
  // When set, hides the section entirely if rating_count is 0. Useful on
  // surfaces where "no reviews yet" would be visual noise (e.g. a service
  // detail page already shows other freelancer context).
  hideWhenEmpty?: boolean;
  title?: string;
}

export function UserReviewsSection({
  userId,
  hideWhenEmpty = false,
  title = 'Reviews',
}: UserReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [ratingAvg, setRatingAvg] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (cursor: string | null): Promise<PageResponse> => {
      const url = new URL(
        `/api/users/${userId}/reviews`,
        window.location.origin,
      );
      if (cursor) url.searchParams.set('cursor', cursor);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to load reviews');
      return data as PageResponse;
    },
    [userId],
  );

  useEffect(() => {
    let cancelled = false;
    setLoadingInitial(true);
    setError(null);
    fetchPage(null)
      .then((data) => {
        if (cancelled) return;
        setReviews(data.reviews ?? []);
        setRatingAvg(Number(data.rating_avg) || 0);
        setRatingCount(data.rating_count ?? 0);
        setNextCursor(data.nextCursor ?? null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoadingInitial(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchPage(nextCursor);
      setReviews((rs) => [...rs, ...(data.reviews ?? [])]);
      setNextCursor(data.nextCursor ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingMore(false);
    }
  }

  if (loadingInitial) {
    return (
      <Card padding={24}>
        <Skeleton width="30%" height={18} style={{ marginBottom: 12 }} />
        <Skeleton width="60%" height={14} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding={24}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', margin: 0, marginBottom: 8 }}>
          {title}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--status-error)', margin: 0 }}>{error}</p>
      </Card>
    );
  }

  if (hideWhenEmpty && ratingCount === 0) return null;

  return (
    <Card padding={24}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: ratingCount === 0 ? 8 : 16,
          flexWrap: 'wrap',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', margin: 0 }}>
          {title}
        </h3>
        {ratingCount > 0 && (
          <RatingSummary value={ratingAvg} count={ratingCount} />
        )}
      </div>

      {ratingCount === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--fg-4)', margin: 0 }}>No reviews yet.</p>
      ) : (
        <>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reviews.map((r) => (
              <li
                key={r.id}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border-2)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    marginBottom: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StarRow value={r.rating} size={14} />
                    <Badge tone="neutral" dot={false} size="sm">
                      from {r.reviewerRole}
                    </Badge>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--fg-4)' }}>
                    {shortDate(r.publishedAt ?? r.createdAt)}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: 'var(--fg-2)',
                    margin: 0,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {r.comment}
                </p>
              </li>
            ))}
          </ul>

          {nextCursor && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

/**
 * Compact aggregate display: filled stars + numeric average + (N reviews).
 * Reused on the profile hero and inline next to a freelancer's name.
 */
export function RatingSummary({
  value,
  count,
  size = 16,
}: {
  value: number;
  count: number;
  size?: number;
}) {
  if (count === 0) {
    return (
      <span style={{ fontSize: 12, color: 'var(--fg-4)' }}>No reviews yet</span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <StarRow value={value} size={size} />
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>
        {value.toFixed(1)}
      </span>
      <span style={{ fontSize: 13, color: 'var(--fg-4)' }}>
        ({count} review{count === 1 ? '' : 's'})
      </span>
    </span>
  );
}

export function StarRow({
  value,
  size = 14,
}: {
  value: number;
  size?: number;
}) {
  const rounded = Math.round(value);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          size={size}
          color={n <= rounded ? 'var(--accent-amber)' : 'var(--border-2)'}
        />
      ))}
    </span>
  );
}
