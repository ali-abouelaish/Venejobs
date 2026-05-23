'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AdminLayout,
  AdminTable,
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  EmptyState,
  ErrorState,
  FormField,
  PageHeader,
  Skeleton,
  Tabs,
  Textarea,
  TextInput,
  formatPrice,
  relTimeOrFallback,
  useToast,
} from '../../services-ui';

interface ServiceRow {
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
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  freelancerId: number;
  freelancerName: string;
  freelancerEmail: string;
}

const STATUS_TABS: { key: 'pending_review' | 'rejected' | 'published'; label: string }[] = [
  { key: 'pending_review', label: 'Pending' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'published', label: 'Published' },
];

export default function AdminServicesPage() {
  return (
    <AdminLayout title="Service Review">
      <Inner />
    </AdminLayout>
  );
}

function Inner() {
  const toast = useToast();
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]['key']>('pending_review');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<ServiceRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [rejectTarget, setRejectTarget] = useState<ServiceRow | null>(null);
  const [reason, setReason] = useState('');
  const [approveTarget, setApproveTarget] = useState<ServiceRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/services?status=${tab}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to load');
      setRows(data as ServiceRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { void load(); }, [load]);

  async function approve(svc: ServiceRow) {
    const res = await fetch(`/api/admin/services/${svc.id}/approve`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 422 && (data?.code === 'connect_missing' || data?.code === 'connect_not_ready')) {
        toast.push(`${data.code === 'connect_missing' ? 'Freelancer has not started Connect onboarding.' : 'Freelancer Connect not ready.'} Cannot publish.`, { tone: 'error' });
      } else {
        toast.push(data?.error ?? 'Failed to approve', { tone: 'error' });
      }
      throw new Error(data?.error ?? 'approve_failed');
    }
    toast.push('Service approved and published.', { tone: 'success' });
    await load();
  }

  async function reject(svc: ServiceRow, reasonText: string) {
    const res = await fetch(`/api/admin/services/${svc.id}/reject`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason: reasonText }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.push(data?.error ?? 'Failed to reject', { tone: 'error' });
      return;
    }
    toast.push('Service rejected.', { tone: 'warning' });
    setRejectTarget(null);
    setReason('');
    await load();
  }

  const filtered = (rows ?? []).filter(r => !search.trim() || r.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Service review queue"
        subtitle="Approve, reject, or inspect services freelancers have submitted."
      />

      <Tabs
        value={tab}
        onChange={k => setTab(k as typeof tab)}
        items={STATUS_TABS.map(t => ({ key: t.key, label: t.label }))}
      />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240, maxWidth: 420 }}>
          <TextInput value={search} onChange={setSearch} icon="search" placeholder="Search by title" />
        </div>
        <div style={{ fontSize: 13, color: 'var(--fg-4)' }}>{filtered.length} result{filtered.length === 1 ? '' : 's'}</div>
      </div>

      {loading ? (
        <Card padding={0}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: 16, borderBottom: i < 4 ? '1px solid var(--border-2)' : 'none' }}>
              <Skeleton width={28} height={28} radius={14} />
              <div style={{ flex: 1 }}>
                <Skeleton width="65%" height={14} style={{ marginBottom: 6 }} />
                <Skeleton width="40%" height={12} />
              </div>
              <Skeleton width={80} height={24} radius={9999} />
            </div>
          ))}
        </Card>
      ) : error ? (
        <ErrorState title="Could not load services" body={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={tab === 'pending_review' ? 'checkCircle' : 'list'}
          title={tab === 'pending_review' ? 'No services awaiting review' : `No ${tab.replace('_', ' ')} services`}
          body={tab === 'pending_review' ? 'Pending services will appear here as soon as freelancers submit them.' : 'Try a different tab.'}
        />
      ) : (
        <Card padding={0} style={{ overflow: 'hidden' }}>
          <AdminTable>
            <thead>
              <tr>
                <th>Service</th>
                <th>Freelancer</th>
                <th>Category</th>
                <th>Price</th>
                <th>Submitted</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td style={{ minWidth: 240 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.4 }}>{s.title}</div>
                    {s.rejectionReason && (
                      <div style={{ fontSize: 11, color: 'var(--status-error)', marginTop: 2 }}>
                        Rejection: {s.rejectionReason.slice(0, 60)}{s.rejectionReason.length > 60 ? '...' : ''}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={s.freelancerName} size={28} />
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>{s.freelancerName}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-5)' }}>{s.freelancerEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td><span style={{ fontSize: 13, color: 'var(--fg-3)' }}>{s.category}</span></td>
                  <td><span style={{ fontSize: 13, color: 'var(--fg-2)', fontWeight: 600 }}>{formatPrice(s.basePrice, { currency: s.currency })}</span></td>
                  <td><span style={{ fontSize: 13, color: 'var(--fg-4)' }}>{relTimeOrFallback(s.updatedAt)}</span></td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {s.status === 'pending_review' && (
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <Button size="sm" variant="secondary" danger onClick={() => { setRejectTarget(s); setReason(''); }}>Reject</Button>
                        <Button size="sm" tone="client" onClick={() => setApproveTarget(s)}>Approve</Button>
                      </div>
                    )}
                    {s.status === 'rejected' && <Badge tone="error" size="sm">Rejected</Badge>}
                    {s.status === 'published' && <Badge tone="success" size="sm">Live</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </Card>
      )}

      <Dialog
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject service"
        subtitle="The freelancer will see the reason on their edit page. Be specific: tell them what to fix and how."
        maxWidth={520}
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button
              danger
              disabled={reason.trim().length < 20}
              onClick={() => rejectTarget && reject(rejectTarget, reason)}
            >
              Reject service
            </Button>
          </>
        }
      >
        <FormField
          label="Reason for rejection"
          required
          hint="Minimum 20 characters. The freelancer reads this verbatim."
        >
          <Textarea
            value={reason}
            onChange={setReason}
            rows={5}
            placeholder="Title is too generic. Please specify the deliverable format and a concrete time estimate."
          />
        </FormField>
      </Dialog>

      <ConfirmDialog
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        title="Approve this service?"
        body={
          approveTarget
            ? `"${approveTarget.title}" will be published immediately and become buyable by clients. We will check the freelancer's Connect status before approving.`
            : ''
        }
        confirmLabel="Approve and publish"
        onConfirm={async () => {
          if (!approveTarget) return;
          try {
            await approve(approveTarget);
            setApproveTarget(null);
          } catch {
            // Toast already surfaced. Keep dialog open so the admin can read the error.
          }
        }}
      />
    </div>
  );
}
