'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

export default function ContractPayPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = use(params);
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function createSession(): Promise<void> {
      try {
        const res = await fetch(`/api/contracts/${contractId}/checkout`, {
          method: 'POST',
        });
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setError(data?.error ?? 'Could not start payment');
          return;
        }
        setClientSecret(data.clientSecret as string);
      } catch {
        if (!cancelled) setError('Could not start payment');
      }
    }

    void createSession();
    return () => {
      cancelled = true;
    };
  }, [contractId]);

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 border border-red-200 bg-red-50 rounded-xl text-center">
        <h1 className="text-lg font-semibold text-red-900 mb-2">
          Can&rsquo;t start payment
        </h1>
        <p className="text-sm text-red-800 mb-4">{error}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium border border-red-300 rounded-lg text-red-900 hover:bg-red-100"
        >
          Go back
        </button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 text-center text-sm text-gray-500">
        Preparing payment&hellip;
      </div>
    );
  }

  return (
    <div id="contract-checkout" className="min-h-screen bg-white">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
