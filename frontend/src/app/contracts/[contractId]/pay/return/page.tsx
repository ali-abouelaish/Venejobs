'use client';

import { Suspense, use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ContractPayReturnPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = use(params);
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto mt-16 p-6 text-center text-sm text-gray-500">
          Verifying payment&hellip;
        </div>
      }
    >
      <ReturnInner contractId={contractId} />
    </Suspense>
  );
}

interface ContractDTO {
  id: string;
  conversationId: string;
  status: string;
  payment: { state: 'paid'; amount: number; currency: string; paidAt: string } | null;
}

function formatMinor(amount: number, currency: string): string {
  return `${currency.toUpperCase()} ${(amount / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function ReturnInner({ contractId }: { contractId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id') ?? null;

  const [stage, setStage] = useState<'verifying' | 'paid' | 'pending' | 'error'>(
    'verifying',
  );
  const [contract, setContract] = useState<ContractDTO | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    // The webhook can take a few seconds locally. Budget ~60s before we
    // tell the user it's "still processing".
    const MAX_ATTEMPTS = 30;
    const INTERVAL_MS = 2000;

    async function poll(n: number): Promise<void> {
      try {
        const res = await fetch(`/api/contracts/${contractId}`);
        if (cancelled) return;
        if (!res.ok) {
          if (n >= MAX_ATTEMPTS) {
            setStage('error');
            return;
          }
          setAttempt(n + 1);
          timer = setTimeout(() => poll(n + 1), INTERVAL_MS);
          return;
        }
        const data = (await res.json()) as { contract: ContractDTO };
        if (data.contract?.payment) {
          setContract(data.contract);
          setStage('paid');
          return;
        }
        if (n >= MAX_ATTEMPTS) {
          setStage('pending');
          return;
        }
        setAttempt(n + 1);
        timer = setTimeout(() => poll(n + 1), INTERVAL_MS);
      } catch {
        if (!cancelled) setStage('error');
      }
    }

    void poll(0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [contractId]);

  if (stage === 'verifying') {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 border border-gray-200 rounded-xl text-center">
        <h1 className="text-lg font-semibold text-gray-900">Verifying your payment</h1>
        <p className="text-sm text-gray-500 mt-2">
          Stripe is confirming the charge with us. This usually takes a few seconds.
          {attempt > 0 && ` (Attempt ${attempt + 1})`}
        </p>
        {sessionId && (
          <p className="text-[11px] text-gray-400 mt-4">
            Session: <code>{sessionId}</code>
          </p>
        )}
      </div>
    );
  }

  if (stage === 'pending' || stage === 'error') {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 border border-amber-200 bg-amber-50 rounded-xl text-center">
        <h1 className="text-lg font-semibold text-amber-900">
          Your payment is still processing
        </h1>
        <p className="text-sm text-amber-800 mt-2">
          We received the payment but the contract hasn&rsquo;t been confirmed yet.
          This usually clears in under a minute. You can safely close this tab — the
          contract page will update once it&rsquo;s confirmed.
        </p>
        <button
          onClick={() => {
            setAttempt(0);
            setStage('verifying');
          }}
          className="mt-4 px-4 py-2 text-sm font-medium border border-amber-300 rounded-lg text-amber-900 hover:bg-amber-100"
        >
          Check again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6 border border-green-200 bg-green-50 rounded-xl text-center">
      <h1 className="text-lg font-semibold text-green-900">Payment received</h1>
      {contract?.payment && (
        <p className="text-sm text-green-800 mt-2">
          {formatMinor(contract.payment.amount, contract.payment.currency)} paid. The
          freelancer has been notified.
        </p>
      )}
      <div className="flex gap-2 justify-center mt-4">
        {contract && (
          <button
            onClick={() => router.push(`/conversations/${contract.conversationId}`)}
            className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Back to conversation
          </button>
        )}
        <button
          onClick={() => router.push('/client/orders')}
          className="px-4 py-2 text-sm font-medium border border-green-300 rounded-lg text-green-900 hover:bg-green-100"
        >
          View my orders
        </button>
      </div>
    </div>
  );
}
