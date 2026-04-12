'use client';
import { X, Star, Clock, Briefcase, DollarSign, CheckCircle2, FileText } from 'lucide-react';
import type { Conversation } from './types';
import { initials, formatMessageTime } from './utils';

type Props = {
  conversation: Conversation;
  contractPrice?: string | null;
  contractCurrency?: string | null;
  contractSigned?: boolean;
  contractId?: string | null;
  onOpenContract?: (contractId: string) => void;
  onClose: () => void;
};

function formatPayment(
  contractPrice: string | null | undefined,
  contractCurrency: string | null | undefined,
  contractSigned: boolean | undefined,
  proposalPrice: number | null,
): string {
  if (contractSigned && contractPrice) {
    const cur = contractCurrency ?? 'USD';
    return `${cur} ${Number(contractPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (proposalPrice != null) {
    return `$${proposalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (proposal)`;
  }
  return 'TBD';
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#92400E' },
  accepted: { label: 'Accepted', color: '#065F46' },
  rejected: { label: 'Rejected', color: '#991B1B' },
  delivered: { label: 'Delivered', color: '#1E40AF' },
  approved: { label: 'Approved', color: '#065F46' },
  contract_signed: { label: 'Contract Signed', color: '#065F46' },
};

export default function ContactPanel({
  conversation,
  contractPrice,
  contractCurrency,
  contractSigned,
  contractId,
  onOpenContract,
  onClose,
}: Props) {
  const { other_name, other_avatar, job_title, offered_price, proposal_status, last_message_sent_at } = conversation;

  const effectiveStatus = contractSigned ? 'contract_signed' : proposal_status;
  const statusInfo = STATUS_LABELS[effectiveStatus] ?? { label: effectiveStatus ?? '—', color: '#6B7280' };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4">
      {/* Header */}
      <div className="relative flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center font-semibold text-base shrink-0 overflow-hidden">
          {other_avatar ? (
            <img src={other_avatar} alt={other_name} className="w-full h-full object-cover" />
          ) : (
            initials(other_name)
          )}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[15px] font-semibold text-[#111827] truncate">
            {other_name || 'Unknown'}
          </span>
          <div className="flex items-center gap-1">
            <Star size={14} className="text-yellow-400 fill-yellow-400 shrink-0" />
            <span className="text-[12px] text-[#6B7280]">No reviews yet</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-0 right-0 text-[#6B7280] hover:text-[#111827]"
        >
          <X size={18} />
        </button>
      </div>

      {/* Info rows */}
      <div className="flex flex-col gap-2.5 mb-3">
        <div className="flex items-center gap-2">
          <Briefcase size={14} className="text-[#6B7280] shrink-0" />
          <span className="text-[12px] text-[#111827] font-medium truncate">
            {job_title || '—'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign size={14} className="text-[#6B7280] shrink-0" />
          <span className="text-[12px] text-[#6B7280]">
            {formatPayment(contractPrice, contractCurrency, contractSigned, offered_price)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-[#6B7280] shrink-0" />
          <span className="text-[12px] text-[#6B7280]">
            {last_message_sent_at ? `Active ${formatMessageTime(last_message_sent_at)}` : 'No activity'}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#E5E7EB] my-3" />

      {/* Proposal status */}
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
          Proposal Status
        </p>
        <div className="flex items-center gap-2.5">
          <CheckCircle2
            size={18}
            className="shrink-0"
            style={{ color: statusInfo.color }}
          />
          <span
            className="text-[13px] font-semibold"
            style={{ color: statusInfo.color }}
          >
            {statusInfo.label}
          </span>
        </div>

        {contractId && onOpenContract && (
          <button
            onClick={() => onOpenContract(contractId)}
            className="flex items-center gap-2 px-3 py-2 mt-1 text-[12px] font-medium text-[#1E3A5F] border border-[#1E3A5F] rounded-lg hover:bg-[#EFF6FF] transition-colors"
          >
            <FileText size={14} />
            View Contract
          </button>
        )}
      </div>
    </div>
  );
}
