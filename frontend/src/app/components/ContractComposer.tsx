'use client';

import { useRef, useEffect, useState } from 'react';
import { FileText, X } from 'lucide-react';
import { toast } from 'react-toastify';
import type { ContractData, ContractRevision } from '@/app/hooks/useMessages';

// ─── Props ──────────────────────────────────────────────────────────────────

type CreateProps = {
  mode: 'create';
  conversationId: string;
  initialValues?: Partial<InitialValues>;
  onSuccess: (contract: ContractData) => void;
  onClose: () => void;
};

type ReviseProps = {
  mode: 'revise';
  contractId: string;
  initialRevision: ContractRevision;
  onSuccess: (contract: ContractData) => void;
  onClose: () => void;
};

type Props = CreateProps | ReviseProps;

type InitialValues = {
  title: string;
  scope: string;
  deliverables: string;
  price: string;
  currency: string;
  deadline: string;
  paymentTerms: string;
  additionalTerms: string;
};

// ─── Auto-resize textarea ───────────────────────────────────────────────────

function AutoTextarea({
  className,
  value,
  onChange,
  placeholder,
}: {
  className?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={2}
      className={className}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ContractComposer(props: Props) {
  const isCreate = props.mode === 'create';

  const initial: InitialValues = isCreate
    ? {
        title: props.initialValues?.title ?? '',
        scope: props.initialValues?.scope ?? '',
        deliverables: props.initialValues?.deliverables ?? '',
        price: props.initialValues?.price ?? '',
        currency: props.initialValues?.currency ?? 'USD',
        deadline: props.initialValues?.deadline ?? '',
        paymentTerms: props.initialValues?.paymentTerms ?? '',
        additionalTerms: props.initialValues?.additionalTerms ?? '',
      }
    : {
        title: props.initialRevision.title,
        scope: props.initialRevision.scope,
        deliverables: props.initialRevision.deliverables,
        price: props.initialRevision.price,
        currency: props.initialRevision.currency,
        deadline: props.initialRevision.deadline.slice(0, 10),
        paymentTerms: props.initialRevision.paymentTerms,
        additionalTerms: props.initialRevision.additionalTerms ?? '',
      };

  const [title, setTitle] = useState(initial.title);
  const [scope, setScope] = useState(initial.scope);
  const [deliverables, setDeliverables] = useState(initial.deliverables);
  const [price, setPrice] = useState(initial.price);
  const [currency, setCurrency] = useState(initial.currency);
  const [deadline, setDeadline] = useState(initial.deadline);
  const [paymentTerms, setPaymentTerms] = useState(initial.paymentTerms);
  const [additionalTerms, setAdditionalTerms] = useState(initial.additionalTerms);
  const [changeSummary, setChangeSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  function isValid(): boolean {
    const baseValid =
      !!title.trim() &&
      !!scope.trim() &&
      !!deliverables.trim() &&
      !!price &&
      Number(price) > 0 &&
      !!deadline &&
      deadline >= today &&
      !!paymentTerms.trim();
    if (!isCreate) return baseValid && !!changeSummary.trim();
    return baseValid;
  }

  async function handleCreate(): Promise<void> {
    if (!isCreate) return;
    const createRes = await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: props.conversationId,
        title: title.trim(),
        scope: scope.trim(),
        deliverables: deliverables.trim(),
        price: Number(price),
        currency,
        deadline,
        paymentTerms: paymentTerms.trim(),
        additionalTerms: additionalTerms.trim() || undefined,
      }),
    });
    if (!createRes.ok) {
      const err = (await createRes.json()) as { error?: string };
      toast.error(err.error ?? 'Failed to create contract');
      return;
    }
    const { contract: draft } = (await createRes.json()) as { contract: ContractData };

    const submitRes = await fetch(`/api/contracts/${draft.id}/submit`, {
      method: 'POST',
    });
    if (!submitRes.ok) {
      const err = (await submitRes.json()) as { error?: string };
      toast.error(err.error ?? 'Failed to submit contract');
      return;
    }
    const { contract: submitted } = (await submitRes.json()) as { contract: ContractData };

    props.onSuccess(submitted);
    props.onClose();
  }

  async function handleRevise(): Promise<void> {
    if (isCreate) return;
    const res = await fetch(`/api/contracts/${props.contractId}/revisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        scope: scope.trim(),
        deliverables: deliverables.trim(),
        price: Number(price),
        currency,
        deadline,
        paymentTerms: paymentTerms.trim(),
        additionalTerms: additionalTerms.trim() || undefined,
        changeSummary: changeSummary.trim(),
      }),
    });
    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      toast.error(err.error ?? 'Failed to send revision');
      return;
    }
    const { contract } = (await res.json()) as { contract: ContractData };
    props.onSuccess(contract);
    props.onClose();
  }

  async function handleSubmit(): Promise<void> {
    if (!isValid() || submitting) return;
    setSubmitting(true);
    try {
      if (isCreate) {
        await handleCreate();
      } else {
        await handleRevise();
      }
    } catch {
      toast.error(isCreate ? 'Failed to send contract' : 'Failed to send revision');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full px-3 py-2 text-[13px] border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A5F] focus:border-[#1E3A5F]';
  const textareaClass = `${inputClass} resize-none`;
  const labelClass = 'block text-[12px] font-semibold text-[#374151] mb-1';

  const heading = isCreate ? 'New Contract' : `Revise Contract`;
  const submitLabel = submitting
    ? 'Sending...'
    : isCreate
      ? 'Send contract'
      : 'Send revision';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) props.onClose(); }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-[#1E3A5F]" />
              <h2 className="text-[16px] font-bold text-[#111827]">{heading}</h2>
            </div>
            <button
              onClick={props.onClose}
              className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* What changed? (revise only, prominent at top) */}
          {!isCreate && (
            <div className="mb-5 p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg">
              <label className={labelClass} style={{ color: '#1E3A5F' }}>
                What changed? *
              </label>
              <input
                className={inputClass}
                placeholder="e.g. Lowered price and extended deadline by one week"
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
              />
              {!changeSummary.trim() && (
                <p className="text-[11px] text-[#1E3A5F] mt-1">
                  Required. Describe what you changed from the previous revision.
                </p>
              )}
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Title *</label>
              <input
                className={inputClass}
                placeholder="e.g. Website redesign project"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Scope of Work *</label>
              <AutoTextarea
                className={textareaClass}
                placeholder="Describe the scope of the project"
                value={scope}
                onChange={setScope}
              />
            </div>

            <div>
              <label className={labelClass}>Deliverables *</label>
              <AutoTextarea
                className={textareaClass}
                placeholder="List each deliverable on a new line"
                value={deliverables}
                onChange={setDeliverables}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className={labelClass}>Price *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className={inputClass}
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="w-24">
                <label className={labelClass}>Currency</label>
                <select
                  className={inputClass}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="USD">USD</option>
                  <option value="VES">VES</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Deadline *</label>
              <input
                type="date"
                className={inputClass}
                min={today}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Payment Terms *</label>
              <AutoTextarea
                className={textareaClass}
                placeholder="e.g. 50% upfront, 50% on delivery"
                value={paymentTerms}
                onChange={setPaymentTerms}
              />
            </div>

            <div>
              <label className={labelClass}>Additional Terms</label>
              <AutoTextarea
                className={textareaClass}
                placeholder="Any additional terms or conditions (optional)"
                value={additionalTerms}
                onChange={setAdditionalTerms}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-5 pt-4 border-t border-[#E5E7EB]">
            <button
              onClick={handleSubmit}
              disabled={!isValid() || submitting}
              className="flex-1 px-4 py-2.5 bg-[#1E3A5F] text-white text-[13px] font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitLabel}
            </button>
            <button
              onClick={props.onClose}
              className="px-4 py-2.5 border border-[#D1D5DB] text-[#374151] text-[13px] rounded-lg hover:bg-[#F3F4F6] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
