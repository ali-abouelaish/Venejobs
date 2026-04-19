'use client';

import { FileText } from 'lucide-react';
import type { ContractData } from '@/app/hooks/useMessages';

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  contract: ContractData;
  onOpen: (contractId: string) => void;
}

// ─── Status styles ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; accent: string }> = {
  draft:              { bg: '#F3F4F6', text: '#6B7280', label: 'Draft',              accent: '#9CA3AF' },
  pending_review:     { bg: '#FEF3C7', text: '#92400E', label: 'Pending Review',     accent: '#F59E0B' },
  revision_requested: { bg: '#DBEAFE', text: '#1E40AF', label: 'Revision Requested', accent: '#3B82F6' },
  accepted:           { bg: '#D1FAE5', text: '#065F46', label: 'Signed',             accent: '#10B981' },
  declined:           { bg: '#FEE2E2', text: '#991B1B', label: 'Declined',           accent: '#EF4444' },
  cancelled:          { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled',          accent: '#EF4444' },
};

// ─── Utilities ──────────────────────────────────────────────────────────────

function formatPrice(price: string, currency: string): string {
  return `${currency} ${Number(price).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ContractCard({ contract, onOpen }: Props) {
  const rev = contract.currentRevision;
  if (!rev) return null;

  const s = STATUS_STYLES[contract.status] ?? STATUS_STYLES.draft;

  return (
    <button
      onClick={() => onOpen(contract.id)}
      className="my-2 mx-auto w-full max-w-[480px] bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow text-left flex"
    >
      {/* Left status accent bar */}
      <div className="w-1 shrink-0 self-stretch" style={{ backgroundColor: s.accent }} />

      {/* Content */}
      <div className="flex-1 p-4">
        {/* Header row: icon + "Contract" label + status badge */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: s.bg }}
          >
            <FileText size={14} style={{ color: s.text }} />
          </div>
          <span className="text-xs uppercase text-gray-500 tracking-wide font-medium">Contract</span>
          <span className="ml-auto shrink-0">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: s.bg, color: s.text }}
            >
              {s.label}
            </span>
          </span>
        </div>

        {/* Title */}
        <p className="text-base font-semibold text-gray-900 mt-2 truncate">{rev.title}</p>

        {/* Price */}
        <p className="text-lg font-semibold text-gray-900 mt-1">
          {formatPrice(rev.price, rev.currency)}
        </p>

        {/* Meta */}
        <p className="text-xs text-gray-500 mt-1">
          by {contract.createdByName}
        </p>

        {/* Footer button */}
        <div className="mt-3 w-full text-sm font-medium text-blue-600 hover:bg-blue-50 py-2 rounded-lg text-center transition-colors">
          View details &rarr;
        </div>
      </div>
    </button>
  );
}
