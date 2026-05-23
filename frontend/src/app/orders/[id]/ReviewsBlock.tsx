'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Dialog,
  FormField,
  Icon,
  Skeleton,
  Textarea,
  shortDate,
  useToast,
} from '../../services-ui';

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

interface ReviewsBlockProps {
  orderId: string;
  viewerRole: 'client' | 'freelancer';
  // Set by the parent to true immediately after a successful accept. The
  // block opens the form on next render if the caller has not already
  // reviewed, then calls onConsumeAutoOpen so the flag does not stick.
  autoOpenOnReady: boolean;
  onConsumeAutoOpen: () => void;
}

export function ReviewsBlock({
  orderId,
  viewerRole,
  autoOpenOnReady,
  onConsumeAutoOpen,
}: ReviewsBlockProps) {
  const toast = useToast();
  const [myReview, setMyReview] = useState<ReviewRow | null>(null);
  const [counterpartyReview, setCounterpartyReview] = useState<ReviewRow | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/service-orders/${orderId}/reviews`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMyReview(data.myReview ?? null);
        setCounterpartyReview(data.counterpartyReview ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (autoOpenOnReady && !loading) {
      if (!myReview) setFormOpen(true);
      onConsumeAutoOpen();
    }
  }, [autoOpenOnReady, loading, myReview, onConsumeAutoOpen]);

  if (loading) {
    return (
      <Card padding={20}>
        <Skeleton width="40%" height={16} style={{ marginBottom: 10 }} />
        <Skeleton width="80%" height={12} />
      </Card>
    );
  }

  const counterpartyLabel = viewerRole === 'client' ? 'freelancer' : 'client';

  return (
    <Card padding={24}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--fg-1)',
              margin: 0,
            }}
          >
            Reviews
          </h3>
          <p
            style={{
              fontSize: 13,
              color: 'var(--fg-4)',
              margin: '4px 0 0',
              lineHeight: 1.5,
            }}
          >
            Both reviews publish together once the {counterpartyLabel} also reviews, or
            after 14 days from acceptance.
          </p>
        </div>
        {!myReview && (
          <Button
            icon="star"
            tone={viewerRole === 'client' ? 'client' : 'freelancer'}
            onClick={() => setFormOpen(true)}
          >
            Leave a review
          </Button>
        )}
      </div>

      {myReview && (
        <ReviewItem
          review={myReview}
          attribution="Your review"
          showStatus
        />
      )}

      {counterpartyReview && (
        <div style={{ marginTop: myReview ? 12 : 0 }}>
          <ReviewItem
            review={counterpartyReview}
            attribution={`Their review (${counterpartyReview.reviewerRole})`}
          />
        </div>
      )}

      {myReview && !counterpartyReview && (
        <p
          style={{
            fontSize: 13,
            color: 'var(--fg-4)',
            marginTop: 12,
            fontStyle: 'italic',
          }}
        >
          Waiting for the {counterpartyLabel} to review. Reviews stay hidden
          from each side until both are in or 14 days pass.
        </p>
      )}

      <ReviewFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={async (rating, comment) => {
          const res = await fetch(`/api/service-orders/${orderId}/reviews`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ rating, comment }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            toast.push(data?.error ?? 'Failed to submit review', {
              tone: 'error',
            });
            return false;
          }
          if (data.published) {
            toast.push('Your review is now live.', { tone: 'success' });
          } else {
            toast.push(
              'Review submitted. It will be visible once the other party reviews, or in 14 days.',
              { tone: 'success', ttl: 6000 },
            );
          }
          await load();
          return true;
        }}
      />
    </Card>
  );
}

function ReviewItem({
  review,
  attribution,
  showStatus = false,
}: {
  review: ReviewRow;
  attribution: string;
  showStatus?: boolean;
}) {
  return (
    <div
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
          <StarDisplay value={review.rating} />
          <span style={{ fontSize: 12, color: 'var(--fg-4)' }}>
            {attribution}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {showStatus && (
            <Badge tone={review.status === 'published' ? 'success' : 'warning'}>
              {review.status === 'published' ? 'Published' : 'Pending'}
            </Badge>
          )}
          <span style={{ fontSize: 12, color: 'var(--fg-4)' }}>
            {shortDate(review.publishedAt ?? review.createdAt)}
          </span>
        </div>
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
        {review.comment}
      </p>
    </div>
  );
}

function StarDisplay({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          size={size}
          color={n <= value ? 'var(--accent-amber)' : 'var(--border-2)'}
        />
      ))}
    </span>
  );
}

function StarInput({
  value,
  onChange,
  size = 32,
}: {
  value: number;
  onChange: (n: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div
      style={{ display: 'inline-flex', gap: 4 }}
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 2,
            cursor: 'pointer',
            lineHeight: 0,
          }}
        >
          <Icon
            name="star"
            size={size}
            color={n <= display ? 'var(--accent-amber)' : 'var(--border-2)'}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewFormDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<boolean>;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(0);
      setComment('');
      setBusy(false);
    }
  }, [open]);

  const disabled = rating < 1 || rating > 5 || comment.trim().length === 0;

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      title="Leave a review"
      subtitle="Your review stays hidden until the other party reviews or the 14-day window closes."
      maxWidth={520}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            tone="client"
            loading={busy}
            disabled={disabled}
            onClick={async () => {
              setBusy(true);
              try {
                const ok = await onSubmit(rating, comment.trim());
                if (ok) onClose();
              } finally {
                setBusy(false);
              }
            }}
          >
            Submit review
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <FormField label="Rating" required>
          <StarInput value={rating} onChange={setRating} />
        </FormField>
        <FormField
          label="Your comment"
          required
          hint="What stood out about this order? Specific notes help future buyers."
        >
          <Textarea
            value={comment}
            onChange={setComment}
            rows={5}
            maxLength={5000}
            placeholder="The delivery was on time and exactly matched the brief..."
          />
        </FormField>
      </div>
    </Dialog>
  );
}
