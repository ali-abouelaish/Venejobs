'use client';
import { useCallback, useEffect, useState } from 'react';
import { X, CheckCircle2, FileText, Plus } from 'lucide-react';
import type { Conversation } from './types';
import { formatMessageTime } from './utils';
import Avatar from '@/app/components/Avatar';
import ContractComposer from '@/app/components/ContractComposer';

type Props = {
  conversation: Conversation;
  contractPrice?: string | null;
  contractCurrency?: string | null;
  contractSigned?: boolean;
  contractId?: string | null;
  activeContractId?: string | null;
  contractEventVersion?: number;
  onOpenContract?: (contractId: string) => void;
  onClose: () => void;
};

type ContractListItem = {
  id: string;
  status: string;
  title: string | null;
  price: string | null;
  currency: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  other_name: string | null;
  other_id: number | null;
  conversation_id: string;
  job_title: string | null;
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

function formatContractPrice(price: string | null, currency: string | null): string {
  if (!price) return 'TBD';
  const cur = currency ?? 'USD';
  return `${cur} ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  pending:          { label: 'Pending',          bg: '#FEF3C7', text: '#92400E' },
  accepted:         { label: 'Accepted',         bg: '#D1FAE5', text: '#065F46' },
  rejected:         { label: 'Rejected',         bg: '#FEE2E2', text: '#991B1B' },
  delivered:        { label: 'Delivered',         bg: '#DBEAFE', text: '#1E40AF' },
  approved:         { label: 'Approved',          bg: '#D1FAE5', text: '#065F46' },
  contract_signed:  { label: 'Contract Signed',   bg: '#D1FAE5', text: '#065F46' },
};

const CONTRACT_STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  draft:               { label: 'Draft',              bg: '#F3F4F6', text: '#4B5563' },
  pending_review:      { label: 'Pending Review',     bg: '#FEF3C7', text: '#92400E' },
  revision_requested:  { label: 'Revision Requested', bg: '#DBEAFE', text: '#1E40AF' },
  accepted:            { label: 'Active',             bg: '#D1FAE5', text: '#065F46' },
  declined:            { label: 'Declined',           bg: '#FEE2E2', text: '#991B1B' },
  cancelled:           { label: 'Cancelled',          bg: '#FEE2E2', text: '#991B1B' },
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
  activeContractId,
  contractEventVersion,
  onOpenContract,
  onClose,
}: Props) {
  const {
    conversation_id,
    other_id,
    other_name,
    other_avatar,
    job_title,
    offered_price,
    proposal_status,
    last_message_sent_at,
  } = conversation;

  const effectiveStatus = contractSigned ? 'contract_signed' : proposal_status;
  const statusInfo = STATUS_LABELS[effectiveStatus] ?? { label: effectiveStatus ?? 'Unknown', bg: '#F3F4F6', text: '#6B7280' };

  const [showComposer, setShowComposer] = useState(false);
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);

  const fetchContracts = useCallback(async () => {
    try {
      const res = await fetch('/api/contracts/my');
      if (!res.ok) throw new Error('Failed');
      const data = (await res.json()) as { contracts: ContractListItem[] };
      setContracts(
        (data.contracts ?? []).filter((c) => c.conversation_id === conversation_id),
      );
    } catch {
      // non-critical
    } finally {
      setIsLoadingContracts(false);
    }
  }, [conversation_id]);

  useEffect(() => {
    setIsLoadingContracts(true);
    fetchContracts();
  }, [fetchContracts, contractEventVersion]);

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

        {/* Contracts with this user */}
        <SectionHeader>Contracts</SectionHeader>
        <div className="px-5 py-3 flex flex-col gap-2">
          <button
            onClick={() => setShowComposer(true)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg px-3 py-2.5 hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Send a contract
          </button>

          {isLoadingContracts ? (
            <p className="text-xs text-gray-400 text-center py-4">Loading contracts…</p>
          ) : contracts.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">
              No contracts with {other_name ?? 'this user'} yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2 mt-1">
              {contracts.map((c) => {
                const style =
                  CONTRACT_STATUS_LABELS[c.status] ?? CONTRACT_STATUS_LABELS.draft;
                const isActive = activeContractId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => onOpenContract?.(c.id)}
                    className={`w-full flex items-start gap-3 bg-white border rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors text-left ${
                      isActive ? 'border-blue-500 ring-1 ring-blue-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {c.title ?? 'Untitled contract'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: style.bg, color: style.text }}
                        >
                          {style.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatContractPrice(c.price, c.currency)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Currently open contract (legacy single-contract pointer) */}
        {contractId && onOpenContract && !contracts.some((c) => c.id === contractId) && (
          <>
            <SectionHeader>Current Contract</SectionHeader>
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

      {/* Contract composer overlay */}
      {showComposer && (
        <ContractComposer
          mode="create"
          conversationId={conversation_id}
          onSuccess={(contract) => {
            onOpenContract?.(contract.id);
            fetchContracts();
          }}
          onClose={() => setShowComposer(false)}
        />
      )}
    </div>
  );
}
