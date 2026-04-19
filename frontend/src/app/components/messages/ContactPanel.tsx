'use client';
import { X, CheckCircle2, FileText } from 'lucide-react';
import type { Conversation } from './types';
import { formatMessageTime } from './utils';
import Avatar from '@/app/components/Avatar';

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

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  pending:          { label: 'Pending',          bg: '#FEF3C7', text: '#92400E' },
  accepted:         { label: 'Accepted',         bg: '#D1FAE5', text: '#065F46' },
  rejected:         { label: 'Rejected',         bg: '#FEE2E2', text: '#991B1B' },
  delivered:        { label: 'Delivered',         bg: '#DBEAFE', text: '#1E40AF' },
  approved:         { label: 'Approved',          bg: '#D1FAE5', text: '#065F46' },
  contract_signed:  { label: 'Contract Signed',   bg: '#D1FAE5', text: '#065F46' },
};

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] uppercase tracking-wider text-gray-500 px-5 py-2 bg-gray-50 border-b border-gray-200 font-medium">
      {children}
    </div>
  );
}

export default function ContactPanel({
  conversation,
  contractPrice,
  contractCurrency,
  contractSigned,
  contractId,
  onOpenContract,
  onClose,
}: Props) {
  const { other_id, other_name, other_avatar, job_title, offered_price, proposal_status, last_message_sent_at } = conversation;

  const effectiveStatus = contractSigned ? 'contract_signed' : proposal_status;
  const statusInfo = STATUS_LABELS[effectiveStatus] ?? { label: effectiveStatus ?? 'Unknown', bg: '#F3F4F6', text: '#6B7280' };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#FAFBFC]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200 shrink-0" style={{ minHeight: '64px' }}>
        <Avatar id={other_id} name={other_name} src={other_avatar} size={32} />
        <span className="text-sm font-semibold text-gray-900 truncate flex-1">
          {other_name || 'Unknown'}
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Job context */}
        <SectionHeader>Job</SectionHeader>
        <div className="px-5 py-3 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-900">{job_title || 'No job title'}</p>
          <p className="text-xs text-gray-500 mt-1">
            {last_message_sent_at ? `Active ${formatMessageTime(last_message_sent_at)}` : 'No activity'}
          </p>
        </div>

        {/* Proposal context */}
        <SectionHeader>Proposal</SectionHeader>
        <div className="px-5 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={14} style={{ color: statusInfo.text }} className="shrink-0" />
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: statusInfo.bg, color: statusInfo.text }}
            >
              {statusInfo.label}
            </span>
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-medium">Amount: </span>
            {formatPayment(contractPrice, contractCurrency, contractSigned, offered_price)}
          </div>
        </div>

        {/* Contract context */}
        {contractId && onOpenContract && (
          <>
            <SectionHeader>Contract</SectionHeader>
            <div className="px-5 py-3">
              <button
                onClick={() => onOpenContract(contractId)}
                className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center shrink-0">
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">View contract</p>
                  <p className="text-xs text-gray-500">
                    {contractSigned ? 'Signed' : 'In progress'}
                  </p>
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
