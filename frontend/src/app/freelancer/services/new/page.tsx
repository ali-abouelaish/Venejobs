'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  Breadcrumbs,
  Button,
  Card,
  FormField,
  ImageGalleryUploader,
  NumberInput,
  PriceInput,
  Select,
  ServicesShell,
  Textarea,
  TextInput,
} from '../../../services-ui';

const CATEGORIES = [
  'Design & Creative',
  'Programming & Tech',
  'Writing & Translation',
  'Video & Animation',
  'Marketing',
  'Business',
];

interface FormShape {
  title: string;
  category: string;
  description: string;
  basePrice: number;
  deliveryDays: number;
  baseRevisions: number;
  gallery: string[];
}

export default function NewServicePage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormShape>({
    defaultValues: {
      title: '',
      category: '',
      description: '',
      basePrice: 0,
      deliveryDays: 5,
      baseRevisions: 1,
      gallery: [],
    },
  });

  register('title', { validate: v => v.trim().length >= 15 || 'Use at least 15 characters so the listing is searchable.' });
  register('category', { validate: v => !!v || 'Pick a category.' });
  register('description', { validate: v => v.trim().length >= 80 || 'Describe the deliverable in at least 80 characters.' });
  register('basePrice', { validate: v => v >= 500 || 'Minimum base price is $5.00.' });
  register('deliveryDays', { validate: v => (v >= 1 && v <= 30) || 'Between 1 and 30 days.' });
  register('baseRevisions', { validate: v => (v >= 0 && v <= 10) || 'Between 0 and 10 revisions.' });
  register('gallery');

  const form = watch();

  async function onSubmit(values: FormShape) {
    setSubmitError(null);
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: values.title.trim(),
          description: values.description.trim(),
          category: values.category,
          basePrice: values.basePrice,
          deliveryDays: values.deliveryDays,
          baseRevisions: values.baseRevisions,
          coverImageUrl: values.gallery[0] ?? null,
          galleryImageUrls: values.gallery.slice(1),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to create');
      router.push(`/freelancer/services/${data.id}/edit`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <ServicesShell mode="freelancer">
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 760, margin: '0 auto' }}>
        <div>
          <Breadcrumbs
            items={[{ label: 'Services', to: '/freelancer/services' }, { label: 'New service' }]}
            onNavigate={to => router.push(to)}
          />
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--fg-1)' }}>Create a new service</h1>
          <p style={{ color: 'var(--fg-4)', fontSize: 14, marginTop: 4 }}>
            Save as draft, then add addons, then submit for review.
          </p>
        </div>

        <Card padding={28}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <FormField
              label="Title"
              required
              error={errors.title?.message}
              hint={'Start with "I will..." for best results.'}
            >
              <TextInput
                value={form.title}
                onChange={v => setValue('title', v, { shouldValidate: true })}
                placeholder="I will design a high-converting landing page in Figma"
                error={!!errors.title}
                maxLength={100}
              />
            </FormField>

            <FormField label="Category" required error={errors.category?.message}>
              <Select
                value={form.category}
                onChange={v => setValue('category', v, { shouldValidate: true })}
                options={CATEGORIES}
                placeholder="Pick a category"
                error={!!errors.category}
              />
            </FormField>

            <FormField
              label="Description"
              required
              hint="Cover what is included, what is not, and what you need from the client."
              error={errors.description?.message}
            >
              <Textarea
                value={form.description}
                onChange={v => setValue('description', v, { shouldValidate: true })}
                rows={5}
                placeholder="Hand-crafted Figma design tailored to your brand. Mobile first, responsive at three breakpoints..."
                error={!!errors.description}
                maxLength={5000}
              />
            </FormField>

            <FormField
              label="Gallery images"
              hint="Up to 10 images. The first one is the cover and OG card image. JPG, PNG, GIF, or WebP, 20MB max each."
            >
              <ImageGalleryUploader
                value={form.gallery}
                onChange={v => setValue('gallery', v, { shouldValidate: true })}
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              <FormField label="Base price" required hint="USD. Stored as integer pence." error={errors.basePrice?.message}>
                <PriceInput
                  value={form.basePrice}
                  onChange={v => setValue('basePrice', v, { shouldValidate: true })}
                  error={!!errors.basePrice}
                />
              </FormField>
              <FormField label="Delivery days" required error={errors.deliveryDays?.message}>
                <NumberInput
                  value={form.deliveryDays}
                  onChange={v => setValue('deliveryDays', v, { shouldValidate: true })}
                  min={1}
                  max={30}
                />
              </FormField>
              <FormField label="Revisions included" error={errors.baseRevisions?.message}>
                <NumberInput
                  value={form.baseRevisions}
                  onChange={v => setValue('baseRevisions', v, { shouldValidate: true })}
                  min={0}
                  max={10}
                />
              </FormField>
            </div>
          </div>
        </Card>

        {submitError && (
          <Card padding={16} style={{ background: 'var(--status-error-bg)', color: '#8a2828', boxShadow: 'none', border: '1px solid var(--status-error)' }}>
            <span style={{ fontSize: 13 }}>{submitError}</span>
          </Card>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button variant="outline" type="button" onClick={() => router.push('/freelancer/services')}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} iconRight="arrowRight" tone="freelancer">
            Save draft and continue
          </Button>
        </div>
      </form>
    </ServicesShell>
  );
}
