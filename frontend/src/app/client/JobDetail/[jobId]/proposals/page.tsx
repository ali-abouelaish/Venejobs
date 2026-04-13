'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClientLayout from '@/app/layout/ClientLayout';

interface Proposal {
  id: number;
  cover_letter: string;
  offered_price: string;
  estimated_days: number;
  status: string;
  created_at: string;
  freelancer_name: string;
  avatar_url: string | null;
  conversation_id: string | null;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function statusColor(status: string): string {
  if (status === 'accepted') return 'var(--color-secondary)';
  if (status === 'rejected') return '#c0392b';
  return 'var(--color-paragraph)';
}

export default function ProposalsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');

  async function loadProposals(): Promise<void> {
    try {
      const res = await fetch(`/api/jobs/${jobId}/proposals`);
      if (res.status === 403) {
        setError('You do not have permission to view these proposals.');
        return;
      }
      if (!res.ok) {
        setError('Failed to load proposals.');
        return;
      }
      const data = await res.json() as { proposals: Proposal[] };
      setProposals(data.proposals ?? []);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProposals();
  }, [jobId]);

  async function handleAccept(proposalId: number): Promise<void> {
    setActionLoading(proposalId);
    setActionError('');
    try {
      const res = await fetch(`/api/proposals/${proposalId}/accept`, { method: 'POST' });
      const data = await res.json() as { conversationId?: string; error?: string };
      if (!res.ok) {
        setActionError(data.error ?? 'Failed to accept proposal.');
        return;
      }
      await loadProposals();
      if (data.conversationId) {
        router.push(`/messages`);
      }
    } catch {
      setActionError('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDecline(proposalId: number): Promise<void> {
    setActionLoading(proposalId);
    setActionError('');
    try {
      const res = await fetch(`/api/proposals/${proposalId}/decline`, { method: 'POST' });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setActionError(data.error ?? 'Failed to decline proposal.');
        return;
      }
      await loadProposals();
    } catch {
      setActionError('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <ClientLayout>
      <div
        style={{
          maxWidth: '800px',
          margin: '40px auto',
          padding: '0 24px',
        }}
      >
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--color-heading)',
            marginBottom: '24px',
          }}
        >
          Proposals
        </h1>

        {loading && (
          <p style={{ color: 'var(--color-paragraph)', fontSize: '14px' }}>
            Loading proposals…
          </p>
        )}

        {error && (
          <p style={{ color: '#c0392b', fontSize: '14px' }}>{error}</p>
        )}

        {actionError && (
          <p style={{ color: '#c0392b', fontSize: '13px', marginBottom: '8px' }}>{actionError}</p>
        )}

        {!loading && !error && proposals.length === 0 && (
          <p style={{ color: 'var(--color-paragraph)', fontSize: '14px' }}>
            No proposals yet.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {proposals.map((p) => (
            <div
              key={p.id}
              style={{
                border: '1px solid var(--color-lightborder)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {initials(p.freelancer_name ?? '?')}
                </div>

                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: '15px',
                      color: 'var(--color-heading)',
                      margin: 0,
                    }}
                  >
                    {p.freelancer_name}
                  </p>
                </div>

                {/* Status badge */}
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: statusColor(p.status),
                    textTransform: 'capitalize',
                    background: 'var(--color-lightborder)',
                    padding: '3px 10px',
                    borderRadius: '20px',
                  }}
                >
                  {p.status}
                </span>
              </div>

              {/* Cover letter excerpt */}
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--color-paragraph)',
                  margin: 0,
                  lineHeight: '1.5',
                }}
              >
                {p.cover_letter.slice(0, 120)}
                {p.cover_letter.length > 120 ? '…' : ''}
              </p>

              {/* Price + days */}
              <div style={{ display: 'flex', gap: '24px' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-heading)', fontWeight: 600 }}>
                  ${parseFloat(p.offered_price).toLocaleString()}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--color-paragraph)' }}>
                  {p.estimated_days} day{p.estimated_days !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {p.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAccept(p.id)}
                      disabled={actionLoading === p.id}
                      style={{
                        background: actionLoading === p.id ? 'var(--color-paragraph)' : 'var(--color-secondary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 18px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: actionLoading === p.id ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {actionLoading === p.id ? 'Processing…' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleDecline(p.id)}
                      disabled={actionLoading === p.id}
                      style={{
                        background: 'transparent',
                        color: '#c0392b',
                        border: '1px solid #c0392b',
                        borderRadius: '8px',
                        padding: '8px 18px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: actionLoading === p.id ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Decline
                    </button>
                  </>
                )}

                {p.conversation_id && (
                  <Link
                    href={`/messages`}
                    style={{
                      display: 'inline-block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                      textDecoration: 'none',
                    }}
                  >
                    Open conversation →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ClientLayout>
  );
}
