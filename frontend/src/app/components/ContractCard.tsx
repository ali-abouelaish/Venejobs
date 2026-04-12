'use client';

import { FileText, ChevronRight } from 'lucide-react';
import type { ContractData } from '@/app/hooks/useMessages';

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  contract: ContractData;
  onOpen: (contractId: string) => void;
}

// ─── Status styles ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: '#F3F4F6', text: '#6B7280', label: 'Draft' },
  pending_review: { bg: '#FEF3C7', text: '#92400E', label: 'Pending Review' },
  revision_requested: { bg: '#DBEAFE', text: '#1E40AF', label: 'Revision Requested' },
  accepted: { bg: '#D1FAE5', text: '#065F46', label: 'Signed' },
  declined: { bg: '#FEE2E2', text: '#991B1B', label: 'Declined' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' },
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
      className="my-1 mx-auto w-full max-w-[420px] flex items-center gap-3 px-4 py-3 border border-[#D1D5DB] bg-white rounded-xl shadow-sm hover:shadow-md hover:border-[#1E3A5F] transition-all text-left"
      style={{ minHeight: '72px' }}
    >
      <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
        <FileText size={18} className="text-[#1E3A5F]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-semibold text-[#111827] truncate flex-1">
            {rev.title}
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
            style={{ background: s.bg, color: s.text }}
          >
            {s.label}
          </span>
        </div>
        <p className="text-[12px] text-[#6B7280]">
          {formatPrice(rev.price, rev.currency)}
        </p>
      </div>

      <ChevronRight size={16} className="text-[#9CA3AF] shrink-0" />
    </button>
  );
}
