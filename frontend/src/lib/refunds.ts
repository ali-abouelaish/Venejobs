import { asc, eq, sql } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db/drizzle';
import { serviceOrderAddons } from '@/lib/db/schema/services';
import type { ContractOrderRow, ServiceOrderRow } from '@/lib/orders';

export class RefundError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'RefundError';
  }
}

export interface RefundResult {
  refunds: Array<{ paymentIntentId: string; refundId: string; amount: number }>;
  totalRefunded: number;
}

/**
 * Refunds every PaymentIntent associated with this order (base PI plus
 * any mid-order addon PIs). Idempotent per (order, payment_intent) via
 * a stable Stripe idempotency key.
 */
export async function refundFullOrder(order: ServiceOrderRow): Promise<RefundResult> {
  const breakdown = await loadPiBreakdown(order);
  const refunds: RefundResult['refunds'] = [];
  let totalRefunded = 0;

  for (const pi of breakdown) {
    const refund = await stripe.refunds.create(
      {
        payment_intent: pi.paymentIntentId,
        metadata: { order_id: order.id },
      },
      { idempotencyKey: `order:${order.id}:refund:${pi.paymentIntentId}` },
    );
    refunds.push({
      paymentIntentId: pi.paymentIntentId,
      refundId: refund.id,
      amount: refund.amount,
    });
    totalRefunded += refund.amount;
  }

  return { refunds, totalRefunded };
}

/**
 * Partial refund. Spans PaymentIntents in deterministic order (base PI
 * first, then mid-order addon PIs by earliest purchase). Each PI is
 * exhausted before moving to the next. Used by dispute split resolution.
 */
export async function refundPartialOrder(
  order: ServiceOrderRow,
  amount: number,
): Promise<RefundResult> {
  if (amount <= 0) {
    throw new RefundError('Refund amount must be positive');
  }

  const breakdown = await loadPiBreakdown(order);
  const refunds: RefundResult['refunds'] = [];
  let remaining = amount;
  let totalRefunded = 0;

  for (const pi of breakdown) {
    if (remaining <= 0) break;
    const refundFromPi = Math.min(remaining, pi.amount);
    if (refundFromPi <= 0) continue;
    const refund = await stripe.refunds.create(
      {
        payment_intent: pi.paymentIntentId,
        amount: refundFromPi,
        metadata: { order_id: order.id, kind: 'split' },
      },
      { idempotencyKey: `order:${order.id}:refund:${pi.paymentIntentId}:split` },
    );
    refunds.push({
      paymentIntentId: pi.paymentIntentId,
      refundId: refund.id,
      amount: refund.amount,
    });
    remaining -= refund.amount;
    totalRefunded += refund.amount;
  }

  if (remaining > 0) {
    throw new RefundError(
      `Could not refund full amount: ${remaining} pence remaining after exhausting all PaymentIntents`,
    );
  }

  return { refunds, totalRefunded };
}

/**
 * Full refund for a contract order. Contracts have a single PaymentIntent
 * (no addons), so this is one Stripe call. Idempotent via a stable
 * idempotency key keyed off the contract order id.
 */
export async function refundContractOrder(order: ContractOrderRow): Promise<RefundResult> {
  const refund = await stripe.refunds.create(
    {
      payment_intent: order.paymentIntentId,
      metadata: { contract_order_id: order.id, contract_id: order.contractId },
    },
    { idempotencyKey: `contract_order:${order.id}:refund` },
  );
  return {
    refunds: [
      {
        paymentIntentId: order.paymentIntentId,
        refundId: refund.id,
        amount: refund.amount,
      },
    ],
    totalRefunded: refund.amount,
  };
}

/**
 * Partial refund for a contract order. Used by the dispute split
 * resolution. Single PI so we refund directly off it.
 */
export async function refundPartialContractOrder(
  order: ContractOrderRow,
  amount: number,
): Promise<RefundResult> {
  if (amount <= 0) {
    throw new RefundError('Refund amount must be positive');
  }
  if (amount >= order.amount) {
    throw new RefundError(
      `Partial refund amount (${amount}) must be less than the contract amount (${order.amount})`,
    );
  }

  const refund = await stripe.refunds.create(
    {
      payment_intent: order.paymentIntentId,
      amount,
      metadata: {
        contract_order_id: order.id,
        contract_id: order.contractId,
        kind: 'split',
      },
    },
    { idempotencyKey: `contract_order:${order.id}:refund:split` },
  );
  return {
    refunds: [
      {
        paymentIntentId: order.paymentIntentId,
        refundId: refund.id,
        amount: refund.amount,
      },
    ],
    totalRefunded: refund.amount,
  };
}

interface PiSlice {
  paymentIntentId: string;
  amount: number;
}

/**
 * Returns the order's PaymentIntents and their captured amounts, in
 * deterministic order: base PI first, then mid-order addon PIs by
 * earliest purchase time. The base PI's amount includes any addons that
 * were bought in the initial Checkout (same PI).
 */
async function loadPiBreakdown(order: ServiceOrderRow): Promise<PiSlice[]> {
  const groups = await db
    .select({
      paymentIntentId: serviceOrderAddons.paymentIntentId,
      total: sql<string>`COALESCE(SUM(price * quantity), 0)::text`,
      earliest: sql<string>`MIN(purchased_at)`,
    })
    .from(serviceOrderAddons)
    .where(eq(serviceOrderAddons.orderId, order.id))
    .groupBy(serviceOrderAddons.paymentIntentId)
    .orderBy(asc(sql`MIN(purchased_at)`));

  let baseTotal = order.basePrice;
  const midOrder: PiSlice[] = [];
  for (const g of groups) {
    if (g.paymentIntentId === order.paymentIntentId) {
      baseTotal += Number(g.total);
    } else {
      midOrder.push({ paymentIntentId: g.paymentIntentId, amount: Number(g.total) });
    }
  }

  return [
    { paymentIntentId: order.paymentIntentId, amount: baseTotal },
    ...midOrder,
  ];
}
