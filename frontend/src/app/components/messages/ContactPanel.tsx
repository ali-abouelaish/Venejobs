'use client';
import { useCallback, useEffect, useState } from 'react';
import { X, FileText, Plus, User, BellOff, Archive, Briefcase, ClipboardList, Wallet } from 'lucide-react';
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
): string | null {
  if (contractSigned && contractPrice) {
    const cur = contractCurrency ?? 'USD';
    return `${cur} ${Number(contractPrice).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  if (proposalPrice != null) {
    return `$${proposalPrice.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} (proposal)`;
  }
  return null;
}

function formatContractPrice(price: string | null, currency: string | null): string | null {
  if (!price) return null;
  const cur = currency ?? 'USD';
  return `${cur} ${Number(price).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  delivered: 'Delivered',
  approved: 'Approved',
  contract_signed: 'Contract signed',
};

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending review',
  revision_requested: 'Revision requested',
  accepted: 'Active',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-msg-surface msg-border rounded-msg-sm p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] text-msg-text-secondary mb-1">
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-[11px] text-msg-text">{children}</div>
    </div>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return <span className="italic text-msg-text-tertiary">{children}</span>;
}

function HeaderTile({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div
      role="presentation"
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center bg-msg-surface msg-border rounded-md text-msg-text-tertiary"
      style={{ width: 26, height: 26 }}
    >
      {icon}
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

  const hasJob = !!job_title;
  const effectiveProposalStatus = contractSigned ? 'contract_signed' : proposal_status;
  const hasProposal = !!effectiveProposalStatus;
  const paymentText = formatPayment(contractPrice, contractCurrency, contractSigned, offered_price);
  const presenceText = last_message_sent_at
    ? `Active ${formatMessageTime(last_message_sent_at)}`
    : 'No recent activity';

  // Orphan contractId pointer that isn't in the fetched list
  const orphanContract = contractId && !contracts.some((c) => c.id === contractId)
    ? contractId
    : null;
  const showContractsList = contracts.length > 0 || !!orphanContract;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="relative px-4 pt-4 pb-3 msg-border-b shrink-0">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-msg-text-tertiary hover:text-msg-text-secondary transition-colors duration-150"
        >
          <X size={14} />
        </button>

        <div className="flex flex-col items-center text-center gap-1.5">
          <Avatar
            id={other_id}
            name={other_name}
            src={other_avatar}
            size={44}
          />
          <span className="text-[12px] font-medium text-msg-text truncate max-w-full px-4">
            {other_name || 'Unknown'}
          </span>
          <span className="text-[10px] text-msg-text-secondary">
            {presenceText}
          </span>
          <div className="flex items-center gap-1.5 mt-2">
            <HeaderTile icon={<User size={13} />} label="Profile" />
            <HeaderTile icon={<BellOff size={13} />} label="Mute" />
            <HeaderTile icon={<Archive size={13} />} label="Archive" />
          </div>
        </div>
      </div>

      {/* Scrollable section: cards + CTA */}
      <div className="flex-1 overflow-y-auto msg-scroll px-3 py-3 flex flex-col gap-2.5">
        {/* CTA — always visible */}
        <button
          onClick={() => setShowComposer(true)}
          className="w-full inline-flex items-center justify-center gap-1.5 bg-msg-brand hover:bg-msg-brand-hover text-white rounded-msg-sm text-[11px] font-medium transition-colors duration-150 active:duration-100"
          style={{ paddingTop: 9, paddingBottom: 9 }}
        >
          <Plus size={13} />
          Send a contract
        </button>

        {/* JOB card — only if linked job */}
        {hasJob && (
          <Card icon={<Briefcase size={11} />} title="Job">
            {job_title}
          </Card>
        )}

        {/* PROPOSAL card — only if proposal exists */}
        {hasProposal && (
          <Card icon={<ClipboardList size={11} />} title="Proposal">
            <div className="flex items-center justify-between gap-2">
              <span>{PROPOSAL_STATUS_LABELS[effectiveProposalStatus!] ?? effectiveProposalStatus}</span>
              {paymentText ? (
                <span className="text-msg-text-secondary tabular-nums">{paymentText}</span>
              ) : (
                <Placeholder>No price set</Placeholder>
              )}
            </div>
          </Card>
        )}

        {/* CONTRACTS — only if any exist */}
        {showContractsList && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-msg-text-secondary px-1">
              <Wallet size={11} />
              <span>Contracts</span>
            </div>
            {isLoadingContracts ? (
              <p className="text-[11px] text-msg-text-tertiary italic px-1">Loading contracts…</p>
            ) : (
              <>
                {contracts.map((c) => {
                  const statusLabel = CONTRACT_STATUS_LABELS[c.status] ?? c.status;
                  const isActive = activeContractId === c.id;
                  const priceText = formatContractPrice(c.price, c.currency);
                  return (
                    <button
                      key={c.id}
                      onClick={() => onOpenContract?.(c.id)}
                      className={`w-full flex items-start gap-2.5 bg-msg-surface rounded-msg-sm p-2.5 text-left transition-colors duration-150 active:duration-100 ${
                        isActive
                          ? 'msg-border ring-1 ring-msg-brand/30'
                          : 'msg-border hover:bg-msg-hover'
                      }`}
                    >
                      <div
                        className="bg-msg-bubble-received text-msg-text-secondary rounded-sm flex items-center justify-center shrink-0"
                        style={{ width: 28, height: 28 }}
                      >
                        <FileText size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-msg-text truncate leading-tight">
                          {c.title ?? <Placeholder>Untitled contract</Placeholder>}
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span className="text-[10px] text-msg-text-secondary">{statusLabel}</span>
                          {priceText ? (
                            <span className="text-[10px] text-msg-text-secondary tabular-nums">
                              {priceText}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Orphan legacy single-contract pointer */}
                {orphanContract && onOpenContract && (
                  <button
                    onClick={() => onOpenContract(orphanContract)}
                    className="w-full flex items-start gap-2.5 bg-msg-surface msg-border rounded-msg-sm p-2.5 text-left hover:bg-msg-hover transition-colors duration-150"
                  >
                    <div
                      className="bg-msg-bubble-received text-msg-text-secondary rounded-sm flex items-center justify-center shrink-0"
                      style={{ width: 28, height: 28 }}
                    >
                      <FileText size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-msg-text leading-tight">
                        View contract
                      </p>
                      <p className="text-[10px] text-msg-text-secondary mt-1">
                        {contractSigned ? 'Signed' : 'In progress'}
                      </p>
                    </div>
                  </button>
                )}
              </>
            )}
          </div>
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
