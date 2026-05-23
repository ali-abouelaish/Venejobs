'use client';

import { useCallback, useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  ErrorState,
  FormField,
  PageHeader,
  ServicesShell,
  Skeleton,
  TextInput,
  useToast,
} from '../../../services-ui';
import type { AcceptInvitePreview } from '../../../api/admin/invites/accept/route';

export default function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return (
    <ServicesShell mode="public">
      <Inner token={token} />
    </ServicesShell>
  );
}

function Inner({ token }: { token: string }) {
  const router = useRouter();
  const toast = useToast();
  const [preview, setPreview] = useState<AcceptInvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/invites/accept?token=${encodeURIComponent(token)}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Invite invalid');
      setPreview(body as AcceptInvitePreview);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  async function submit() {
    if (!preview) return;
    if (password.length < 8) {
      toast.push('Password must be at least 8 characters.', { tone: 'error' });
      return;
    }
    if (!preview.existingUser && !name.trim()) {
      toast.push('Name is required.', { tone: 'error' });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/invites/accept', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          name: preview.existingUser ? undefined : name.trim(),
          lastname: preview.existingUser ? undefined : lastname.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.push(body?.error ?? 'Could not accept invite', { tone: 'error' });
        return;
      }
      toast.push('Welcome! Redirecting to admin…', { tone: 'success' });
      router.push('/admin');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '40px auto' }}>
      <PageHeader title="Accept admin invitation" />
      <Card style={{ marginTop: 20 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Skeleton width="60%" height={20} />
            <Skeleton width="80%" height={14} />
            <Skeleton width="100%" height={40} style={{ marginTop: 16 }} />
          </div>
        ) : error || !preview ? (
          <ErrorState title="Invite invalid" body={error ?? 'This link is invalid or has expired.'} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 14, color: 'var(--fg-3)', margin: 0 }}>
              {preview.existingUser
                ? `Sign in as ${preview.email} to accept this admin invitation. Your account will be promoted to admin.`
                : `Create a new admin account for ${preview.email}.`}
            </p>

            {!preview.existingUser && (
              <>
                <FormField label="First name" required>
                  <TextInput value={name} onChange={setName} placeholder="Ada" />
                </FormField>
                <FormField label="Last name">
                  <TextInput value={lastname} onChange={setLastname} placeholder="Lovelace" />
                </FormField>
              </>
            )}

            <FormField label={preview.existingUser ? 'Password' : 'Choose a password'} required hint="At least 8 characters.">
              <TextInput value={password} onChange={setPassword} type="password" placeholder="••••••••" />
            </FormField>

            <Button loading={busy} onClick={() => void submit()} fullWidth>
              {preview.existingUser ? 'Sign in & accept' : 'Create account & accept'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
