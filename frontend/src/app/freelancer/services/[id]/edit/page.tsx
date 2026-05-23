'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  Dialog,
  EmptyState,
  ErrorState,
  FormField,
  Icon,
  IconButton,
  ImageCarousel,
  ImageGalleryUploader,
  NumberInput,
  PriceInput,
  Select,
  ServicesShell,
  Skeleton,
  Tabs,
  Textarea,
  TextInput,
  formatPrice,
  serviceDisplay,
  useToast,
} from '../../../../services-ui';

interface Addon {
  id: string;
  type: 'revision' | 'extra' | 'faster_delivery';
  name: string;
  description: string | null;
  price: number;
  maxQuantity: number | null;
}

interface ServiceDetail {
  id: string;
  freelancerId: number;
  title: string;
  description: string;
  category: string;
  basePrice: number;
  currency: string;
  deliveryDays: number;
  baseRevisions: number;
  coverImageUrl: string | null;
  galleryImageUrls: string[];
  status: 'draft' | 'pending_review' | 'published' | 'rejected';
  rejectionReason?: string | null;
  addons: Addon[];
}

const CATEGORIES = [
  'Design & Creative',
  'Programming & Tech',
  'Writing & Translation',
  'Video & Animation',
  'Marketing',
  'Business',
];

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EditServiceInner id={id} />;
}

function EditServiceInner({ id }: { id: string }) {
  return (
    <ServicesShell mode="freelancer">
      <ToastBoundary id={id} />
    </ServicesShell>
  );
}

function ToastBoundary({ id }: { id: string }) {
  const toast = useToast();
  const router = useRouter();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'details' | 'addons' | 'preview'>('details');
  const [addonOpen, setAddonOpen] = useState<Partial<Addon> | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/services/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to load');
      setService(data as ServiceDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const editable = service && (service.status === 'draft' || service.status === 'rejected');

  async function patchService(patch: Partial<ServiceDetail>) {
    if (!service) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to save');
      setService(prev => prev ? { ...prev, ...patch } : prev);
      toast.push('Saved', { tone: 'success' });
    } catch (e) {
      toast.push(e instanceof Error ? e.message : String(e), { tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function submitForReview() {
    const res = await fetch(`/api/services/${id}/submit-for-review`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.push(data?.error ?? 'Failed to submit', { tone: 'error' });
      return;
    }
    toast.push('Submitted for review', { tone: 'success' });
    setSubmitOpen(false);
    await load();
  }

  async function saveAddon(payload: Partial<Addon>) {
    if (!service) return;
    const isUpdate = !!payload.id;
    const path = isUpdate ? `/api/services/${id}/addons/${payload.id}` : `/api/services/${id}/addons`;
    const method = isUpdate ? 'PATCH' : 'POST';
    const body = {
      type: payload.type ?? 'revision',
      name: payload.name ?? '',
      description: payload.description ?? null,
      price: payload.price ?? 0,
      maxQuantity: payload.maxQuantity ?? null,
    };
    const res = await fetch(path, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.push(data?.error ?? 'Failed to save addon', { tone: 'error' });
      return;
    }
    toast.push(isUpdate ? 'Addon updated' : 'Addon added', { tone: 'success' });
    setAddonOpen(null);
    await load();
  }

  async function deleteAddon(addonId: string) {
    const res = await fetch(`/api/services/${id}/addons/${addonId}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}));
      toast.push(data?.error ?? 'Failed to remove addon', { tone: 'error' });
      return;
    }
    toast.push('Addon removed', { tone: 'info' });
    await load();
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760, margin: '0 auto' }}>
        <Skeleton width={200} height={14} />
        <Skeleton width={280} height={28} />
        <Card padding={28}>
          <Skeleton width="40%" height={16} style={{ marginBottom: 12 }} />
          <Skeleton width="100%" height={44} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={120} />
        </Card>
      </div>
    );
  }

  if (error || !service) {
    return <ErrorState title="Could not load service" body={error ?? 'Service not found.'} onRetry={load} />;
  }

  const display = serviceDisplay(service.status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Breadcrumbs
        items={[{ label: 'Services', to: '/freelancer/services' }, { label: 'Edit' }]}
        onNavigate={to => router.push(to)}
      />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--fg-1)', margin: 0 }}>Edit service</h1>
          <div style={{ color: 'var(--fg-4)', fontSize: 14, marginTop: 4, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Badge tone={display.tone}>{display.label}</Badge>
            {!editable && (
              <span>
                This service is locked for editing while {service.status === 'pending_review' ? 'under review' : 'live'}.
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="outline" onClick={() => router.push('/freelancer/services')}>Back</Button>
          {editable && (
            <Button onClick={() => setSubmitOpen(true)} iconRight="arrowRight" tone="freelancer">
              Submit for review
            </Button>
          )}
        </div>
      </div>

      {service.status === 'rejected' && service.rejectionReason && (
        <Card style={{ borderLeft: '3px solid var(--status-error)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Icon name="alert" size={20} color="var(--status-error)" />
            <div>
              <b style={{ color: 'var(--fg-1)' }}>Reviewer feedback</b>
              <p style={{ fontSize: 14, color: 'var(--fg-3)', marginTop: 6, lineHeight: 1.5 }}>{service.rejectionReason}</p>
            </div>
          </div>
        </Card>
      )}

      <Tabs
        value={tab}
        onChange={k => setTab(k as typeof tab)}
        items={[
          { key: 'details', label: 'Details', icon: 'edit' },
          { key: 'addons', label: 'Addons', icon: 'plus', count: service.addons.length },
          { key: 'preview', label: 'Preview', icon: 'eye' },
        ]}
      />

      {tab === 'details' && (
        <Card padding={28}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <FormField label="Title">
              <TextInput
                value={service.title}
                onChange={v => setService(s => s ? { ...s, title: v } : s)}
                disabled={!editable}
                maxLength={100}
              />
            </FormField>
            <FormField label="Category">
              <Select
                value={service.category}
                onChange={v => setService(s => s ? { ...s, category: v } : s)}
                options={CATEGORIES}
                disabled={!editable}
              />
            </FormField>
            <FormField label="Description">
              <Textarea
                value={service.description}
                onChange={v => setService(s => s ? { ...s, description: v } : s)}
                rows={5}
                disabled={!editable}
                maxLength={5000}
              />
            </FormField>
            <FormField
              label="Gallery images"
              hint="Up to 10 images. The first one is the cover. JPG, PNG, GIF, or WebP."
            >
              <ImageGalleryUploader
                value={
                  service.coverImageUrl
                    ? [service.coverImageUrl, ...(service.galleryImageUrls ?? [])]
                    : (service.galleryImageUrls ?? [])
                }
                onChange={next => setService(s => s ? {
                  ...s,
                  coverImageUrl: next[0] ?? null,
                  galleryImageUrls: next.slice(1),
                } : s)}
              />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              <FormField label="Base price">
                <PriceInput
                  value={service.basePrice}
                  onChange={v => setService(s => s ? { ...s, basePrice: v } : s)}
                  disabled={!editable}
                />
              </FormField>
              <FormField label="Delivery days">
                <NumberInput
                  value={service.deliveryDays}
                  onChange={v => setService(s => s ? { ...s, deliveryDays: v } : s)}
                  min={1}
                  max={30}
                  disabled={!editable}
                />
              </FormField>
              <FormField label="Revisions included">
                <NumberInput
                  value={service.baseRevisions}
                  onChange={v => setService(s => s ? { ...s, baseRevisions: v } : s)}
                  min={0}
                  max={10}
                  disabled={!editable}
                />
              </FormField>
            </div>
            {editable && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  loading={saving}
                  onClick={() => patchService({
                    title: service.title,
                    description: service.description,
                    category: service.category,
                    basePrice: service.basePrice,
                    deliveryDays: service.deliveryDays,
                    baseRevisions: service.baseRevisions,
                    coverImageUrl: service.coverImageUrl,
                    galleryImageUrls: service.galleryImageUrls,
                  })}
                  tone="freelancer"
                >
                  Save changes
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {tab === 'addons' && (
        <Card padding={20}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', margin: 0 }}>Service addons</h3>
            {editable && (
              <Button
                size="sm"
                icon="plus"
                variant="secondary"
                tone="freelancer"
                onClick={() => setAddonOpen({ type: 'revision', name: '', price: 0, description: '', maxQuantity: null })}
              >
                Add addon
              </Button>
            )}
          </div>
          {service.addons.length === 0 ? (
            <EmptyState
              icon="plus"
              title="No addons yet"
              body="Addons let clients upgrade scope (extras), shorten delivery, or buy more revisions. At least one revision-type addon is required to receive revision requests after the included allowance is used up."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {service.addons.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: '1px solid var(--border-2)', borderRadius: 10 }}>
                  <Badge
                    tone={a.type === 'revision' ? 'info' : a.type === 'faster_delivery' ? 'warning' : 'neutral'}
                    dot={false}
                  >
                    {a.type.replace('_', ' ')}
                  </Badge>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>{a.name}</div>
                    {a.description && <div style={{ fontSize: 12, color: 'var(--fg-4)' }}>{a.description}</div>}
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--fg-1)', minWidth: 70, textAlign: 'right' }}>
                    {formatPrice(a.price, { currency: service.currency })}
                  </div>
                  {editable && (
                    <>
                      <IconButton icon="edit" title="Edit" onClick={() => setAddonOpen(a)} />
                      <IconButton icon="trash" title="Remove" danger onClick={() => deleteAddon(a.id)} />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'preview' && (
        <Card>
          <div style={{ marginBottom: 16 }}>
            <ImageCarousel
              images={[
                ...(service.coverImageUrl ? [service.coverImageUrl] : []),
                ...(service.galleryImageUrls ?? []),
              ]}
              alt={service.title}
              height={260}
            />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg-1)', margin: 0 }}>{service.title || 'Untitled service'}</h2>
          <p style={{ color: 'var(--fg-4)', marginTop: 8, fontSize: 14, lineHeight: 1.65 }}>{service.description || 'No description yet.'}</p>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-2)', flexWrap: 'wrap' }}>
            <div><div style={{ fontSize: 12, color: 'var(--fg-4)' }}>Base price</div><div style={{ fontSize: 18, fontWeight: 700 }}>{formatPrice(service.basePrice, { currency: service.currency })}</div></div>
            <div><div style={{ fontSize: 12, color: 'var(--fg-4)' }}>Delivery</div><div style={{ fontSize: 18, fontWeight: 700 }}>{service.deliveryDays}d</div></div>
            <div><div style={{ fontSize: 12, color: 'var(--fg-4)' }}>Revisions</div><div style={{ fontSize: 18, fontWeight: 700 }}>{service.baseRevisions}</div></div>
            <div style={{ marginLeft: 'auto' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-4)' }}>Addons</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{service.addons.length}</div>
            </div>
          </div>
        </Card>
      )}

      <AddonEditorDialog
        open={!!addonOpen}
        addon={addonOpen}
        onClose={() => setAddonOpen(null)}
        onSave={saveAddon}
      />

      <ConfirmDialog
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        title="Submit for review?"
        body="Reviewers check titles, descriptions, and pricing. You will not be able to edit while under review. Average turnaround is under 24 hours."
        confirmLabel="Submit for review"
        onConfirm={submitForReview}
      />
    </div>
  );
}

function AddonEditorDialog({
  open, addon, onClose, onSave,
}: {
  open: boolean;
  addon: Partial<Addon> | null;
  onClose: () => void;
  onSave: (a: Partial<Addon>) => Promise<void>;
}) {
  const [form, setForm] = useState<Partial<Addon>>(addon ?? { type: 'revision', name: '', price: 0, description: '', maxQuantity: null });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) {
      setForm(addon ?? { type: 'revision', name: '', price: 0, description: '', maxQuantity: null });
      setSaving(false);
    }
  }, [open, addon]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={addon?.id ? 'Edit addon' : 'New addon'}
      maxWidth={520}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            tone="freelancer"
            loading={saving}
            disabled={!form.name || !form.price}
            onClick={async () => {
              setSaving(true);
              try { await onSave(form); } finally { setSaving(false); }
            }}
          >
            Save addon
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="Type">
          <Select
            value={form.type ?? 'revision'}
            onChange={v => setForm({ ...form, type: v as Addon['type'] })}
            options={[
              { value: 'revision', label: 'Revision (required to receive revision requests)' },
              { value: 'extra', label: 'Extra (additional scope)' },
              { value: 'faster_delivery', label: 'Faster delivery (cosmetic, no delivery offset)' },
            ]}
          />
        </FormField>
        <FormField label="Name" required>
          <TextInput
            value={form.name ?? ''}
            onChange={v => setForm({ ...form, name: v })}
            placeholder="e.g. Extra revision round"
            maxLength={100}
          />
        </FormField>
        <FormField label="Description" hint="Optional. One short line about what the buyer gets.">
          <Textarea
            value={form.description ?? ''}
            onChange={v => setForm({ ...form, description: v })}
            rows={2}
            maxLength={500}
          />
        </FormField>
        <FormField label="Price" required>
          <PriceInput value={form.price ?? 0} onChange={v => setForm({ ...form, price: v })} />
        </FormField>
        <Checkbox
          checked={(form.maxQuantity ?? 1) > 1}
          onChange={v => setForm({ ...form, maxQuantity: v ? 5 : null })}
          label="Allow multiple quantities (up to 5)"
        />
      </div>
    </Dialog>
  );
}
