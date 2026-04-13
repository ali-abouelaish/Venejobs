'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  X,
  FileText,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-toastify';
import type { ContractData, ContractRevision } from '@/app/hooks/useMessages';
import ContractComposer from './ContractComposer';

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  contractId: string;
  currentUserId: number;
  currentUserName: string;
  otherPartyName: string;
  wsConnected: boolean;
  refreshCounter: number;
  onClose: () => void;
  onContractLoaded?: (contract: ContractData) => void;
}

// ─── Status styles ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string; border: string }
> = {
  draft: { bg: '#F3F4F6', text: '#6B7280', label: 'Draft', border: '#E5E7EB' },
  pending_review: {
    bg: '#FEF3C7',
    text: '#92400E',
    label: 'Pending Review',
    border: '#FDE68A',
  },
  revision_requested: {
    bg: '#DBEAFE',
    text: '#1E40AF',
    label: 'Revision Requested',
    border: '#BFDBFE',
  },
  accepted: {
    bg: '#D1FAE5',
    text: '#065F46',
    label: 'Signed',
    border: '#A7F3D0',
  },
  declined: { bg: '#FEE2E2', text: '#991B1B', label: 'Declined', border: '#FECACA' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled', border: '#FECACA' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function formatPrice(price: string, currency: string): string {
  return `${currency} ${Number(price).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─── Field block ────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-[13px] text-[#111827] whitespace-pre-wrap">{value}</p>
    </div>
  );
}

// ─── Revision history list ──────────────────────────────────────────────────

function RevisionHistory({ revisions }: { revisions: ContractRevision[] }) {
  const [expanded, setExpanded] = useState(revisions.length <= 1);

  if (revisions.length === 0) return null;

  const sorted = [...revisions].sort((a, b) => b.revisionNumber - a.revisionNumber);

  return (
    <div className="border border-[#E5E7EB] rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-3 py-2 text-[13px] font-semibold text-[#111827] hover:bg-[#F9FAFB] rounded-t-lg"
      >
        <span>Revision history ({revisions.length})</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expanded && (
        <div className="border-t border-[#E5E7EB] divide-y divide-[#F3F4F6]">
          {sorted.map((rev) => (
            <div key={rev.id} className="px-3 py-2.5 text-[12px]">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold text-[#111827]">
                  Version {rev.revisionNumber}
                </span>
                <span className="text-[#9CA3AF]">{formatDateTime(rev.createdAt)}</span>
              </div>
              <p className="text-[#6B7280] mb-0.5">By {rev.proposedByName}</p>
              {rev.changeSummary && (
                <p className="text-[#374151] italic">{rev.changeSummary}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sign confirm step (inline, not a modal) ────────────────────────────────

function SignSection({
  currentUserName,
  revision,
  onConfirm,
  onCancel,
  busy,
}: {
  currentUserName: string;
  revision: ContractRevision;
  onConfirm: (typedName: string) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [typedName, setTypedName] = useState(currentUserName);
  const nameMatches =
    typedName.trim().toLowerCase() === currentUserName.trim().toLowerCase();

  return (
    <div className="border border-green-300 bg-green-50 rounded-lg p-3">
      <p className="text-[13px] font-semibold text-green-900 mb-2">
        Sign this contract
      </p>
      <p className="text-[12px] text-[#374151] mb-3">
        You are agreeing to: <strong>{revision.title}</strong> for{' '}
        <strong>{formatPrice(revision.price, revision.currency)}</strong> due{' '}
        <strong>{formatDate(revision.deadline)}</strong>.
      </p>
      <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
        Type your full name
      </label>
      <input
        className="w-full px-2.5 py-2 mt-1 text-[13px] border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600"
        value={typedName}
        onChange={(e) => setTypedName(e.target.value)}
      />
      {typedName.trim() && !nameMatches && (
        <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
          <AlertCircle size={11} />
          Name must match your profile name
        </p>
      )}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onConfirm(typedName.trim())}
          disabled={!nameMatches || busy}
          className="flex-1 px-3 py-2 bg-green-600 text-white text-[13px] font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {busy ? 'Signing…' : 'Sign & accept'}
        </button>
        <button
          onClick={onCancel}
          disabled={busy}
          className="px-3 py-2 border border-[#D1D5DB] text-[#374151] text-[13px] rounded-lg hover:bg-[#F3F4F6] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Confirm block for decline / request-revision ───────────────────────────

function ConfirmSection({
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
  onCancel,
  busy,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  destructive: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <div
      className={`border rounded-lg p-3 ${
        destructive ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'
      }`}
    >
      <p
        className={`text-[13px] font-semibold mb-1 ${
          destructive ? 'text-red-900' : 'text-blue-900'
        }`}
      >
        {title}
      </p>
      <p className="text-[12px] text-[#374151] mb-3">{description}</p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={busy}
          className={`flex-1 px-3 py-2 text-white text-[13px] font-medium rounded-lg disabled:opacity-50 transition-colors ${
            destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
        <button
          onClick={onCancel}
          disabled={busy}
          className="px-3 py-2 border border-[#D1D5DB] text-[#374151] text-[13px] rounded-lg hover:bg-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main ContractSidePanel ─────────────────────────────────────────────────

export default function ContractSidePanel({
  contractId,
  currentUserId,
  currentUserName,
  otherPartyName,
  wsConnected,
  refreshCounter,
  onClose,
  onContractLoaded,
}: Props) {
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<
    'none' | 'sign' | 'decline' | 'request-revision' | 'revise' | 'edit-draft'
  >('none');

  const fetchContract = useCallback(async () => {
    try {
      const res = await fetch(`/api/contracts/${contractId}`);
      if (!res.ok) {
        setFetchError('Failed to load contract');
        return;
      }
      const data = (await res.json()) as { contract: ContractData };
      setContract(data.contract);
      onContractLoaded?.(data.contract);
      setFetchError(null);
    } catch {
      setFetchError('Failed to load contract');
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  // Initial load + reload when contractId changes
  useEffect(() => {
    setLoading(true);
    setContract(null);
    fetchContract();
  }, [contractId, fetchContract]);

  // Refresh when parent signals a contract_updated WS event landed
  useEffect(() => {
    if (refreshCounter > 0) {
      fetchContract();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCounter]);

  // ── Action callers ────────────────────────────────────────────────────────

  const postAction = useCallback(
    async (
      path: string,
      body: Record<string, unknown> | null,
      actionKey: string,
    ): Promise<ContractData | null> => {
      setBusyAction(actionKey);
      try {
        const res = await fetch(`/api/contracts/${contractId}/${path}`, {
          method: 'POST',
          headers: body ? { 'Content-Type': 'application/json' } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          toast.error(err.error ?? `Failed to ${actionKey}`);
          return null;
        }
        const data = (await res.json()) as { contract: ContractData };
        setContract(data.contract);
        onContractLoaded?.(data.contract);
        return data.contract;
      } catch {
        toast.error(`Failed to ${actionKey}`);
        return null;
      } finally {
        setBusyAction(null);
      }
    },
    [contractId, onContractLoaded],
  );

  const handleSign = useCallback(
    async (typedName: string) => {
      const updated = await postAction('sign', { typedName }, 'sign');
      if (updated) {
        setActiveSheet('none');
        toast.success('Contract signed');
      }
    },
    [postAction],
  );

  const handleDecline = useCallback(async () => {
    const updated = await postAction('decline', null, 'decline');
    if (updated) setActiveSheet('none');
  }, [postAction]);

  const handleRequestRevision = useCallback(async () => {
    const updated = await postAction('request-revision', null, 'request revision');
    if (updated) setActiveSheet('none');
  }, [postAction]);

  const handleSubmit = useCallback(async () => {
    const updated = await postAction('submit', null, 'submit');
    if (updated) toast.success('Submitted for review');
  }, [postAction]);

  const handleCancel = useCallback(async () => {
    await postAction('cancel', null, 'cancel');
  }, [postAction]);

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Shell onClose={onClose} wsConnected={wsConnected}>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[13px] text-[#6B7280]">Loading contract…</p>
        </div>
      </Shell>
    );
  }

  if (fetchError || !contract) {
    return (
      <Shell onClose={onClose} wsConnected={wsConnected}>
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-[13px] text-[#6B7280]">{fetchError ?? 'Contract not found'}</p>
          <button
            onClick={fetchContract}
            className="flex items-center gap-1.5 text-[13px] text-[#1E3A5F] font-semibold underline"
          >
            <RefreshCw size={12} />
            Try again
          </button>
        </div>
      </Shell>
    );
  }

  const rev = contract.currentRevision;
  if (!rev) {
    return (
      <Shell onClose={onClose} wsConnected={wsConnected}>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[13px] text-[#6B7280]">Contract has no content yet</p>
        </div>
      </Shell>
    );
  }

  const status = contract.status;
  const isCreator = contract.createdBy === currentUserId;
  const iSigned = contract.signatures.some((s) => s.userId === currentUserId);
  const otherPartySignature = contract.signatures.find(
    (s) => s.userId !== currentUserId,
  );
  const isTerminal =
    status === 'accepted' || status === 'declined' || status === 'cancelled';

  // Derived: expected signer placeholders
  const mySignature = contract.signatures.find((s) => s.userId === currentUserId);

  // Show revise modal
  if (activeSheet === 'revise' || activeSheet === 'edit-draft') {
    return (
      <>
        <Shell onClose={onClose} wsConnected={wsConnected}>
          <ContractBody
            contract={contract}
            rev={rev}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            otherPartyName={otherPartyName}
            mySignature={mySignature}
            otherPartySignature={otherPartySignature}
          />
        </Shell>
        <ContractComposer
          mode="revise"
          contractId={contract.id}
          initialRevision={rev}
          onSuccess={(updated) => {
            setContract(updated);
            toast.success(
              activeSheet === 'edit-draft' ? 'Draft updated' : 'Revision sent',
            );
          }}
          onClose={() => setActiveSheet('none')}
        />
      </>
    );
  }

  return (
    <Shell onClose={onClose} wsConnected={wsConnected}>
      {/* Body (scrollable) */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {/* Header block */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={16} className="text-[#1E3A5F] shrink-0" />
            <StatusBadge status={status} />
          </div>
          <h2 className="text-[17px] font-bold text-[#111827] leading-tight mt-1">
            {rev.title}
          </h2>
          <p className="text-[12px] text-[#6B7280] mt-1">
            Created by {contract.createdByName} · {formatDateTime(contract.createdAt)}
          </p>
          {rev.revisionNumber > 1 && (
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">
              Current version: {rev.revisionNumber}
            </p>
          )}
        </div>

        {/* Current revision body */}
        <div className="border border-[#E5E7EB] rounded-lg p-3">
          <Field label="Scope" value={rev.scope} />
          <Field label="Deliverables" value={rev.deliverables} />
          <Field label="Price" value={formatPrice(rev.price, rev.currency)} />
          <Field label="Deadline" value={formatDate(rev.deadline)} />
          <Field label="Payment terms" value={rev.paymentTerms} />
          {rev.additionalTerms && (
            <Field label="Additional terms" value={rev.additionalTerms} />
          )}
        </div>

        {/* Signatures */}
        <div className="border border-[#E5E7EB] rounded-lg p-3">
          <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
            Signatures
          </p>

          {/* Me */}
          <div className="flex items-center gap-2 mb-1.5 text-[12px]">
            {mySignature ? (
              <>
                <Check size={13} className="text-green-600 shrink-0" />
                <span className="text-[#111827] font-medium">{mySignature.typedName}</span>
                <span className="text-[#9CA3AF]">
                  Signed {formatDateTime(mySignature.signedAt)}
                </span>
              </>
            ) : (
              <>
                <span className="w-[13px] h-[13px] rounded-full border border-[#D1D5DB] shrink-0" />
                <span className="text-[#9CA3AF] italic">
                  Awaiting {currentUserName} (you)
                </span>
              </>
            )}
          </div>

          {/* Other party */}
          <div className="flex items-center gap-2 text-[12px]">
            {otherPartySignature ? (
              <>
                <Check size={13} className="text-green-600 shrink-0" />
                <span className="text-[#111827] font-medium">
                  {otherPartySignature.typedName}
                </span>
                <span className="text-[#9CA3AF]">
                  Signed {formatDateTime(otherPartySignature.signedAt)}
                </span>
              </>
            ) : (
              <>
                <span className="w-[13px] h-[13px] rounded-full border border-[#D1D5DB] shrink-0" />
                <span className="text-[#9CA3AF] italic">Awaiting {otherPartyName}</span>
              </>
            )}
          </div>
        </div>

        {/* Revision history */}
        {contract.revisionHistory.length > 0 && (
          <RevisionHistory revisions={contract.revisionHistory} />
        )}

        {/* Inline sheets (sign / decline / request-revision) */}
        {activeSheet === 'sign' && (
          <SignSection
            currentUserName={currentUserName}
            revision={rev}
            busy={busyAction === 'sign'}
            onConfirm={handleSign}
            onCancel={() => setActiveSheet('none')}
          />
        )}
        {activeSheet === 'decline' && (
          <ConfirmSection
            title="Decline this contract?"
            description="This ends the contract. The other party will see it as declined. This cannot be undone."
            confirmLabel="Yes, decline"
            destructive
            busy={busyAction === 'decline'}
            onConfirm={handleDecline}
            onCancel={() => setActiveSheet('none')}
          />
        )}
        {activeSheet === 'request-revision' && (
          <ConfirmSection
            title="Request a revision?"
            description="The other party will be asked to propose a new revision. You can still sign or decline later."
            confirmLabel="Yes, request revision"
            destructive={false}
            busy={busyAction === 'request revision'}
            onConfirm={handleRequestRevision}
            onCancel={() => setActiveSheet('none')}
          />
        )}

        {/* Terminal outcome message */}
        {isTerminal && activeSheet === 'none' && (
          <div
            className={`border rounded-lg p-3 text-[12px] ${
              status === 'accepted'
                ? 'border-green-200 bg-green-50 text-green-900'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            {status === 'accepted' &&
              'This contract has been fully signed by both parties.'}
            {status === 'declined' && 'This contract was declined.'}
            {status === 'cancelled' && 'This contract was cancelled by the creator.'}
          </div>
        )}
      </div>

      {/* Action bar (sticky bottom) */}
      {!isTerminal && activeSheet === 'none' && (
        <div className="shrink-0 border-t border-[#E5E7EB] px-5 py-3 flex flex-wrap gap-2 bg-[#F9FAFB]">
          {/* draft + creator */}
          {status === 'draft' && isCreator && (
            <>
              <button
                onClick={() => setActiveSheet('edit-draft')}
                disabled={busyAction !== null}
                className="px-3 py-2 text-[12px] font-medium border border-[#D1D5DB] text-[#374151] rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
              >
                Edit draft
              </button>
              <button
                onClick={handleSubmit}
                disabled={busyAction !== null}
                className="flex-1 px-3 py-2 text-[12px] font-medium bg-[#1E3A5F] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {busyAction === 'submit' ? 'Submitting…' : 'Submit for review'}
              </button>
            </>
          )}

          {/* pending_review + I have NOT signed */}
          {status === 'pending_review' && !iSigned && (
            <>
              <button
                onClick={() => setActiveSheet('sign')}
                disabled={busyAction !== null}
                className="flex-1 px-3 py-2 text-[12px] font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                Sign
              </button>
              <button
                onClick={() => setActiveSheet('revise')}
                disabled={busyAction !== null}
                className="px-3 py-2 text-[12px] font-medium border border-[#D1D5DB] text-[#374151] rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
              >
                Propose revision
              </button>
              <button
                onClick={() => setActiveSheet('request-revision')}
                disabled={busyAction !== null}
                className="px-3 py-2 text-[12px] font-medium border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
              >
                Request revision
              </button>
              <button
                onClick={() => setActiveSheet('decline')}
                disabled={busyAction !== null}
                className="px-3 py-2 text-[12px] font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                Decline
              </button>
            </>
          )}

          {/* pending_review + I have already signed */}
          {status === 'pending_review' && iSigned && (
            <p className="flex-1 text-[12px] italic text-[#9CA3AF] py-2">
              You have signed. Awaiting {otherPartyName}…
            </p>
          )}

          {/* revision_requested */}
          {status === 'revision_requested' && (
            <>
              <button
                onClick={() => setActiveSheet('revise')}
                disabled={busyAction !== null}
                className="flex-1 px-3 py-2 text-[12px] font-medium bg-[#1E3A5F] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                Propose revision
              </button>
              <button
                onClick={() => setActiveSheet('decline')}
                disabled={busyAction !== null}
                className="px-3 py-2 text-[12px] font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                Decline
              </button>
            </>
          )}

          {/* Cancel affordance for the creator in any non-terminal state */}
          {isCreator && !isTerminal && status !== 'draft' && (
            <button
              onClick={handleCancel}
              disabled={busyAction !== null}
              className="w-full mt-1 px-3 py-1.5 text-[11px] text-[#6B7280] hover:text-red-600 disabled:opacity-50 transition-colors"
            >
              {busyAction === 'cancel' ? 'Cancelling…' : 'Cancel contract'}
            </button>
          )}
        </div>
      )}
    </Shell>
  );
}

// ─── Body helper used in revise-modal overlay render ────────────────────────

function ContractBody({
  contract,
  rev,
  currentUserName,
  otherPartyName,
  mySignature,
  otherPartySignature,
}: {
  contract: ContractData;
  rev: ContractRevision;
  currentUserId: number;
  currentUserName: string;
  otherPartyName: string;
  mySignature: { typedName: string; signedAt: string } | undefined;
  otherPartySignature: { typedName: string; signedAt: string } | undefined;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 pointer-events-none opacity-60">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileText size={16} className="text-[#1E3A5F] shrink-0" />
          <StatusBadge status={contract.status} />
        </div>
        <h2 className="text-[17px] font-bold text-[#111827] mt-1">{rev.title}</h2>
      </div>
      <div className="border border-[#E5E7EB] rounded-lg p-3">
        <Field label="Scope" value={rev.scope} />
        <Field label="Price" value={formatPrice(rev.price, rev.currency)} />
        <Field label="Deadline" value={formatDate(rev.deadline)} />
      </div>
      <div className="border border-[#E5E7EB] rounded-lg p-3 text-[12px]">
        <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
          Signatures
        </p>
        <p className="text-[#6B7280]">
          {mySignature ? `You signed ${formatDate(mySignature.signedAt)}` : `Awaiting ${currentUserName}`}
        </p>
        <p className="text-[#6B7280]">
          {otherPartySignature
            ? `${otherPartySignature.typedName} signed ${formatDate(otherPartySignature.signedAt)}`
            : `Awaiting ${otherPartyName}`}
        </p>
      </div>
    </div>
  );
}

// ─── Shell (chrome: header + close + WS banner + container) ─────────────────

function Shell({
  children,
  onClose,
  wsConnected,
}: {
  children: React.ReactNode;
  onClose: () => void;
  wsConnected: boolean;
}) {
  return (
    <div className="flex flex-col h-full w-full bg-white">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="lg:hidden text-[#6B7280] hover:text-[#111827] mr-1"
            aria-label="Back to chat"
          >
            ←
          </button>
          <span className="text-[14px] font-semibold text-[#111827]">Contract</span>
        </div>
        <button
          onClick={onClose}
          className="text-[#9CA3AF] hover:text-[#111827] hidden lg:block"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Reconnecting banner */}
      {!wsConnected && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-[12px] text-amber-900">
          <WifiOff size={13} />
          <span>Reconnecting… live updates paused.</span>
        </div>
      )}

      {children}
    </div>
  );
}
