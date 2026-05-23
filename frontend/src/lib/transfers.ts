import { eq, sql } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db/drizzle';
import { getConnectAccount } from '@/lib/connect';
import {
  serviceOrderAddons,
  serviceOrders,
} from '@/lib/db/schema/services';
import { contractOrders } from '@/lib/db/schema/contracts';
import type { ContractOrderRow, ServiceOrderRow } from '@/lib/orders';

export class TransferError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'TransferError';
  }
}

/**
 * Computes the freelancer payout (in the smallest currency unit) for an
 * order: base_price + sum(addon.price * addon.quantity), minus
 * platform_fee_pct rounded down to an integer.
 */
export async function computeOrderPayout(order: ServiceOrderRow): Promise<{
  gross: number;
  fee: number;
  net: number;
}> {
  const addons = await db
    .select({ price: serviceOrderAddons.price, quantity: serviceOrderAddons.quantity })
    .from(serviceOrderAddons)
    .where(eq(serviceOrderAddons.orderId, order.id));

  const addonsTotal = addons.reduce((sum, a) => sum + a.price * a.quantity, 0);
  const gross = order.basePrice + addonsTotal;
  const feePct = Number(order.platformFeePct);
  const fee = Math.floor((gross * feePct) / 100);
  const net = gross - fee;
  return { gross, fee, net };
}

/**
 * Creates a Stripe Transfer to the freelancer's Connect account for the
 * given accepted/auto_accepted order. Uses an idempotency key derived
 * from the order id so retries return the same transfer. Persists
 * transfer_id on the order row immediately after Stripe returns.
 *
 * Does NOT transition state — completion is driven by the transfer.*
 * webhook. Caller is responsible for the preceding state transition
 * (delivered → accepted | auto_accepted).
 */
export async function createTransferForOrder(order: ServiceOrderRow): Promise<string> {
  if (order.transferId) {
    return order.transferId;
  }

  const connect = await getConnectAccount(order.freelancerId);
  if (!connect) {
    throw new TransferError(
      `Freelancer ${order.freelancerId} has no Connect account on order ${order.id}`,
    );
  }

  const { net } = await computeOrderPayout(order);
  if (net <= 0) {
    throw new TransferError(`Order ${order.id} has non-positive payout (${net})`);
  }

  // Use accepted_at as the idempotency-key salt so a retry against a
  // freshly-reset order gets a new Stripe call rather than re-reading
  // a cached 24h failure. In production, retries should be rare and a
  // single key per order is correct — but local dev needs to recover
  // from balance_insufficient etc.
  const idemKey = order.acceptedAt
    ? `order:${order.id}:transfer:${new Date(order.acceptedAt).getTime()}`
    : `order:${order.id}:transfer`;

  let transfer;
  try {
    transfer = await stripe.transfers.create(
      {
        amount: net,
        currency: order.currency,
        destination: connect.accountId,
        transfer_group: `order:${order.id}`,
        metadata: { order_id: order.id },
      },
      { idempotencyKey: idemKey },
    );
  } catch (err) {
    const e = err as { type?: string; code?: string; message?: string };
    throw new TransferError(
      `Stripe ${e.type ?? 'error'}${e.code ? ` (${e.code})` : ''}: ${e.message ?? String(err)}`,
      err,
    );
  }

  await db
    .update(serviceOrders)
    .set({ transferId: transfer.id, updatedAt: sql`now()` })
    .where(eq(serviceOrders.id, order.id));

  return transfer.id;
}

/**
 * Computes the freelancer payout for a contract order: amount minus
 * platform_fee_pct rounded down. Contracts have no addons, so this is a
 * straight percentage off the agreed contract price.
 */
export function computeContractOrderPayout(order: ContractOrderRow): {
  gross: number;
  fee: number;
  net: number;
} {
  const gross = order.amount;
  const feePct = Number(order.platformFeePct);
  const fee = Math.floor((gross * feePct) / 100);
  const net = gross - fee;
  return { gross, fee, net };
}

/**
 * Creates a Stripe Transfer for an accepted contract order. Mirrors
 * createTransferForOrder for service orders — same idempotency-key shape
 * (keyed off accepted_at so a retry after a reset can recover from
 * balance_insufficient in dev), same "no state transition" contract
 * (completion comes from the transfer.* webhook), same metadata-driven
 * routing via { contract_order_id }.
 */
export async function createTransferForContractOrder(
  order: ContractOrderRow,
): Promise<string> {
  if (order.transferId) {
    return order.transferId;
  }

  const connect = await getConnectAccount(order.freelancerId);
  if (!connect) {
    throw new TransferError(
      `Freelancer ${order.freelancerId} has no Connect account on contract order ${order.id}`,
    );
  }

  const { net } = computeContractOrderPayout(order);
  if (net <= 0) {
    throw new TransferError(`Contract order ${order.id} has non-positive payout (${net})`);
  }

  const idemKey = order.acceptedAt
    ? `contract_order:${order.id}:transfer:${new Date(order.acceptedAt).getTime()}`
    : `contract_order:${order.id}:transfer`;

  let transfer;
  try {
    transfer = await stripe.transfers.create(
      {
        amount: net,
        currency: order.currency,
        destination: connect.accountId,
        transfer_group: `contract_order:${order.id}`,
        metadata: { contract_order_id: order.id, contract_id: order.contractId },
      },
      { idempotencyKey: idemKey },
    );
  } catch (err) {
    const e = err as { type?: string; code?: string; message?: string };
    throw new TransferError(
      `Stripe ${e.type ?? 'error'}${e.code ? ` (${e.code})` : ''}: ${e.message ?? String(err)}`,
      err,
    );
  }

  await db
    .update(contractOrders)
    .set({ transferId: transfer.id, updatedAt: sql`now()` })
    .where(eq(contractOrders.id, order.id));

  return transfer.id;
}

/**
 * Split-resolution variant for contract orders: transfers an explicit
 * amount with no platform-fee deduction. Mirrors createSplitTransferForOrder
 * for service orders. Distinct idempotency key suffix so it doesn't
 * collide with a normal acceptance transfer.
 */
export async function createSplitTransferForContractOrder(
  order: ContractOrderRow,
  amount: number,
): Promise<string> {
  if (order.transferId) {
    return order.transferId;
  }
  if (amount <= 0) {
    throw new TransferError(`Split transfer amount must be positive (got ${amount})`);
  }

  const connect = await getConnectAccount(order.freelancerId);
  if (!connect) {
    throw new TransferError(
      `Freelancer ${order.freelancerId} has no Connect account on contract order ${order.id}`,
    );
  }

  let transfer;
  try {
    transfer = await stripe.transfers.create(
      {
        amount,
        currency: order.currency,
        destination: connect.accountId,
        transfer_group: `contract_order:${order.id}`,
        metadata: {
          contract_order_id: order.id,
          contract_id: order.contractId,
          kind: 'split_resolution',
        },
      },
      { idempotencyKey: `contract_order:${order.id}:transfer:split` },
    );
  } catch (err) {
    const e = err as { type?: string; code?: string; message?: string };
    throw new TransferError(
      `Stripe ${e.type ?? 'error'}${e.code ? ` (${e.code})` : ''}: ${e.message ?? String(err)}`,
      err,
    );
  }

  await db
    .update(contractOrders)
    .set({ transferId: transfer.id, updatedAt: sql`now()` })
    .where(eq(contractOrders.id, order.id));

  return transfer.id;
}

/**
 * Creates a Stripe Transfer of an explicit amount (no platform fee
 * deduction). Used by dispute split resolution where the admin has
 * decided exactly how much goes to the freelancer. Distinct idempotency
 * key suffix so it doesn't collide with a normal acceptance transfer.
 */
export async function createSplitTransferForOrder(
  order: ServiceOrderRow,
  amount: number,
): Promise<string> {
  if (order.transferId) {
    return order.transferId;
  }
  if (amount <= 0) {
    throw new TransferError(`Split transfer amount must be positive (got ${amount})`);
  }

  const connect = await getConnectAccount(order.freelancerId);
  if (!connect) {
    throw new TransferError(
      `Freelancer ${order.freelancerId} has no Connect account on order ${order.id}`,
    );
  }

  let transfer;
  try {
    transfer = await stripe.transfers.create(
      {
        amount,
        currency: order.currency,
        destination: connect.accountId,
        transfer_group: `order:${order.id}`,
        metadata: { order_id: order.id, kind: 'split_resolution' },
      },
      { idempotencyKey: `order:${order.id}:transfer:split` },
    );
  } catch (err) {
    const e = err as { type?: string; code?: string; message?: string };
    throw new TransferError(
      `Stripe ${e.type ?? 'error'}${e.code ? ` (${e.code})` : ''}: ${e.message ?? String(err)}`,
      err,
    );
  }

  await db
    .update(serviceOrders)
    .set({ transferId: transfer.id, updatedAt: sql`now()` })
    .where(eq(serviceOrders.id, order.id));

  return transfer.id;
}
