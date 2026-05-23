'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Pagination,
  Skeleton,
  Tabs,
  Textarea,
  TextInput,
  relTimeOrFallback,
  useToast,
} from '../../services-ui';
import type { AdminUserRow, AdminUsersListResponse } from '../../api/admin/users/route';
import type { AdminUserDetail } from '../../api/admin/users/[id]/route';

type RoleFilter = 'all' | 'admin' | 'client' | 'freelancer' | 'suspended';

const ROLE_TABS: { key: RoleFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'client', label: 'Clients' },
  { key: 'freelancer', label: 'Freelancers' },
  { key: 'admin', label: 'Admins' },
  { key: 'suspended', label: 'Suspended' },
];

const PAGE_SIZE = 25;

export default function AdminUsersPage() {
  return (
    <AdminLayout title="Users">
      <Suspense fallback={null}>
        <Inner />
      </Suspense>
    </AdminLayout>
  );
}

function Inner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const initialRole = (searchParams.get('role') as RoleFilter) || 'all';
  const focusId = searchParams.get('focus');

  const [role, setRole] = useState<RoleFilter>(initialRole);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminUsersListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [detailId, setDetailId] = useState<number | null>(focusId ? parseInt(focusId, 10) : null);
  const [suspendTarget, setSuspendTarget] = useState<AdminUserRow | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [unsuspendTarget, setUnsuspendTarget] = useState<AdminUserRow | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        role,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (search.trim()) params.set('q', search.trim());
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Failed to load users');
      setData(body as AdminUsersListResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [role, page, search]);

  useEffect(() => { void load(); }, [load]);

  // Reset to page 1 when role/search changes
  useEffect(() => {
    setPage(1);
  }, [role, search]);

  async function submitSuspend() {
    if (!suspendTarget) return;
    const reason = suspendReason.trim();
    if (reason.length < 10) {
      toast.push('Reason must be at least 10 characters.', { tone: 'error' });
      return;
    }
    const res = await fetch(`/api/admin/users/${suspendTarget.id}/suspend`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.push(body?.error ?? 'Failed to suspend', { tone: 'error' });
      throw new Error(body?.error ?? 'suspend_failed');
    }
    toast.push('User suspended.', { tone: 'warning' });
    setSuspendTarget(null);
    setSuspendReason('');
    await load();
  }

  async function submitUnsuspend() {
    if (!unsuspendTarget) return;
    const res = await fetch(`/api/admin/users/${unsuspendTarget.id}/unsuspend`, {
      method: 'POST',
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.push(body?.error ?? 'Failed to unsuspend', { tone: 'error' });
      throw new Error(body?.error ?? 'unsuspend_failed');
    }
    toast.push('User unsuspended.', { tone: 'success' });
    setUnsuspendTarget(null);
    await load();
  }

  async function submitInvite() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.push('Enter a valid email.', { tone: 'error' });
      return;
    }
    setInviteBusy(true);
    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.push(body?.error ?? 'Failed to send invite', { tone: 'error' });
        return;
      }
      toast.push('Admin invite sent.', { tone: 'success' });
      setInviteOpen(false);
      setInviteEmail('');
    } finally {
      setInviteBusy(false);
    }
  }

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Users"
        subtitle="Browse, inspect, and moderate user accounts."
        action={
          <Button icon="plus" onClick={() => setInviteOpen(true)}>
            Invite admin
          </Button>
        }
      />

      <Tabs
        value={role}
        onChange={(k) => {
          setRole(k as RoleFilter);
          const sp = new URLSearchParams(searchParams.toString());
          if (k === 'all') sp.delete('role'); else sp.set('role', k);
          router.replace(`/admin/users?${sp.toString()}`);
        }}
        items={ROLE_TABS}
      />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240, maxWidth: 420 }}>
          <TextInput value={search} onChange={setSearch} icon="search" placeholder="Search by name, email, or username" />
        </div>
        <div style={{ fontSize: 13, color: 'var(--fg-4)' }}>
          {total} result{total === 1 ? '' : 's'}
        </div>
      </div>

      {loading ? (
        <Card padding={0}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: 16, borderBottom: i < 5 ? '1px solid var(--border-2)' : 'none' }}>
              <Skeleton width={32} height={32} radius={16} />
              <div style={{ flex: 1 }}>
                <Skeleton width="40%" height={14} style={{ marginBottom: 6 }} />
                <Skeleton width="60%" height={12} />
              </div>
              <Skeleton width={80} height={24} radius={9999} />
            </div>
          ))}
        </Card>
      ) : error ? (
        <ErrorState title="Could not load users" body={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState icon="users" title="No users match" body="Try a different tab or search term." />
      ) : (
        <>
          <Card padding={0} style={{ overflow: 'hidden' }}>
            <AdminTable>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Verification</th>
                  <th>Activity</th>
                  <th>Last login</th>
                  <th>Joined</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td style={{ minWidth: 240 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={u.name} src={u.profilePicture ?? undefined} size={32} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>
                            {u.name}{u.lastname ? ` ${u.lastname}` : ''}
                            {u.suspendedAt && (
                              <Badge tone="error" size="sm" style={{ marginLeft: 8 }}>Suspended</Badge>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--fg-5)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {u.role ? <Badge tone={roleTone(u.role)} size="sm">{u.role}</Badge> : <span style={{ color: 'var(--fg-5)', fontSize: 12 }}>—</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Badge tone={u.isEmailVerified ? 'success' : 'neutral'} size="sm">
                          {u.isEmailVerified ? 'Email ✓' : 'Email ✗'}
                        </Badge>
                        <Badge tone={u.isPhoneVerified ? 'success' : 'neutral'} size="sm">
                          {u.isPhoneVerified ? 'Phone ✓' : 'Phone ✗'}
                        </Badge>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, color: 'var(--fg-4)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {u.jobsCount > 0 && <span>{u.jobsCount} jobs</span>}
                        {u.proposalsCount > 0 && <span>{u.proposalsCount} proposals</span>}
                        {u.servicesCount > 0 && <span>{u.servicesCount} services</span>}
                        {u.ordersCount > 0 && <span>{u.ordersCount} orders</span>}
                        {u.jobsCount === 0 && u.proposalsCount === 0 && u.servicesCount === 0 && u.ordersCount === 0 && (
                          <span style={{ color: 'var(--fg-5)' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: 'var(--fg-4)' }}>
                        {u.lastLogin ? relTimeOrFallback(u.lastLogin) : 'Never'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: 'var(--fg-4)' }}>
                        {relTimeOrFallback(u.createdAt)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <Button size="sm" variant="outline" onClick={() => setDetailId(u.id)}>View</Button>
                        {u.suspendedAt ? (
                          <Button size="sm" variant="secondary" onClick={() => setUnsuspendTarget(u)}>Unsuspend</Button>
                        ) : u.role !== 'admin' ? (
                          <Button size="sm" variant="secondary" danger onClick={() => { setSuspendTarget(u); setSuspendReason(''); }}>Suspend</Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          </Card>
          <Pagination page={page} total={total} perPage={PAGE_SIZE} onChange={setPage} />
        </>
      )}

      <Dialog
        open={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        title={suspendTarget ? `Suspend ${suspendTarget.name}?` : ''}
        subtitle="The user's session will be invalidated on the next API call. They will not be able to use the platform until unsuspended."
        maxWidth={520}
        footer={
          <>
            <Button variant="outline" onClick={() => setSuspendTarget(null)}>Cancel</Button>
            <Button danger disabled={suspendReason.trim().length < 10} onClick={() => void submitSuspend()}>
              Suspend user
            </Button>
          </>
        }
      >
        <FormField
          label="Reason for suspension"
          required
          hint="Minimum 10 characters. Visible to other admins reviewing this user later."
        >
          <Textarea
            value={suspendReason}
            onChange={setSuspendReason}
            rows={4}
            placeholder="Repeated complaints from clients about non-delivery."
          />
        </FormField>
      </Dialog>

      <ConfirmDialog
        open={!!unsuspendTarget}
        onClose={() => setUnsuspendTarget(null)}
        title="Unsuspend this user?"
        body={unsuspendTarget ? `${unsuspendTarget.name} will regain access on their next request.` : ''}
        confirmLabel="Unsuspend"
        onConfirm={async () => { await submitUnsuspend(); }}
      />

      <Dialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite an admin"
        subtitle="The recipient gets a one-time link valid for 7 days. If their email matches an existing user, accepting promotes them to admin."
        maxWidth={460}
        footer={
          <>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button loading={inviteBusy} onClick={() => void submitInvite()}>Send invite</Button>
          </>
        }
      >
        <FormField label="Email" required>
          <TextInput value={inviteEmail} onChange={setInviteEmail} type="email" placeholder="new-admin@example.com" />
        </FormField>
      </Dialog>

      {detailId != null && (
        <UserDetailDrawer
          userId={detailId}
          onClose={() => setDetailId(null)}
          onAction={async () => { await load(); }}
        />
      )}
    </div>
  );
}

function roleTone(role: string): 'brand' | 'info' | 'success' | 'neutral' {
  if (role === 'admin') return 'brand';
  if (role === 'client') return 'info';
  if (role === 'freelancer') return 'success';
  return 'neutral';
}

function UserDetailDrawer({
  userId, onClose, onAction,
}: {
  userId: number;
  onClose: () => void;
  onAction: () => Promise<void>;
}) {
  const toast = useToast();
  const [data, setData] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Failed to load user');
      setData(body as AdminUserDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  async function quickUnsuspend() {
    const res = await fetch(`/api/admin/users/${userId}/unsuspend`, { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.push(body?.error ?? 'Failed', { tone: 'error' });
      return;
    }
    toast.push('User unsuspended.', { tone: 'success' });
    await load();
    await onAction();
  }

  return (
    <Dialog
      open={true}
      onClose={onClose}
      placement="right"
      maxWidth={480}
      title={data ? `${data.name}${data.lastname ? ` ${data.lastname}` : ''}` : 'User'}
      subtitle={data?.email}
    >
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton width="100%" height={120} />
          <Skeleton width="80%" height={14} />
          <Skeleton width="60%" height={14} />
        </div>
      ) : error || !data ? (
        <ErrorState title="Could not load user" body={error ?? ''} onRetry={load} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {data.suspendedAt && (
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--status-error-bg)', border: '1px solid var(--status-error)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--status-error)', marginBottom: 4 }}>Suspended</div>
              {data.suspensionReason && <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>{data.suspensionReason}</div>}
              <Button size="sm" variant="outline" style={{ marginTop: 10 }} onClick={() => void quickUnsuspend()}>
                Unsuspend now
              </Button>
            </div>
          )}

          <div>
            <SectionHeader>Profile</SectionHeader>
            <DetailRow label="Role" value={data.role ? <Badge tone={roleTone(data.role)} size="sm">{data.role}</Badge> : '—'} />
            <DetailRow label="Username" value={data.username ?? '—'} />
            <DetailRow label="Phone" value={data.phone ?? '—'} />
            <DetailRow label="Location" value={[data.city, data.state, data.country].filter(Boolean).join(', ') || '—'} />
            <DetailRow label="Email verified" value={data.isEmailVerified ? 'Yes' : 'No'} />
            <DetailRow label="Phone verified" value={data.isPhoneVerified ? 'Yes' : 'No'} />
            <DetailRow label="Last login" value={data.lastLogin ? relTimeOrFallback(data.lastLogin) : 'Never'} />
            <DetailRow label="Joined" value={relTimeOrFallback(data.createdAt)} />
          </div>

          {data.freelancerProfile && (
            <div>
              <SectionHeader>Freelancer profile</SectionHeader>
              <DetailRow label="Title" value={data.freelancerProfile.title ?? '—'} />
              {data.freelancerProfile.hourlyRate !== null && (
                <DetailRow label="Hourly rate" value={`£${data.freelancerProfile.hourlyRate}/hr`} />
              )}
              {data.freelancerProfile.bio && (
                <div style={{ marginTop: 8, fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.5 }}>
                  {data.freelancerProfile.bio.slice(0, 240)}{data.freelancerProfile.bio.length > 240 ? '...' : ''}
                </div>
              )}
            </div>
          )}

          <div>
            <SectionHeader>Activity</SectionHeader>
            <DetailRow label="Jobs posted" value={data.counts.jobs} />
            <DetailRow label="Proposals" value={data.counts.proposals} />
            <DetailRow label="Services" value={data.counts.services} />
            <DetailRow label="Job orders" value={data.counts.jobOrders} />
            <DetailRow label="Service orders" value={data.counts.serviceOrders} />
            <DetailRow label="Contract orders" value={data.counts.contractOrders} />
          </div>
        </div>
      )}
    </Dialog>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-5)', textTransform: 'uppercase', letterSpacing: 0.4, margin: '0 0 10px' }}>
      {children}
    </h4>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-2)', fontSize: 13 }}>
      <span style={{ color: 'var(--fg-5)' }}>{label}</span>
      <span style={{ color: 'var(--fg-2)', fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  );
}
