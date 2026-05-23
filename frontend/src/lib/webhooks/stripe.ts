import { eq, sql } from 'drizzle-orm';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db/drizzle';
import {
  serviceOrderAddons,
  serviceOrders,
} from '@/lib/db/schema/services';
import { stripeConnectAccounts } from '@/lib/db/schema/stripe';
import { contractOrders } from '@/lib/db/schema/contracts';
import {
  InvalidContractTransitionError,
  InvalidTransitionError,
  transitionContractOrder,
  transitionServiceOrder,
} from '@/lib/orders';
import {
  notifyContractPaid,
  notifyOrderCompleted,
  notifyOrderPaid,
  notifyOrderRefunded,
} from '@/lib/email/notifications';
import { broadcastContract, fetchFullContract } from '@/lib/contracts';

/**
 * Dispatches checkout.session.completed by `session.metadata.kind`:
 *   - 'service_base'  → create a new service_orders row + addons
 *   - 'service_addon' → record a mid-order addon purchase against an
 *                       existing order; bump revisions_purchased if
 *                       any revision-type addons were bought.
 */
export async function handleCheckoutCompleted(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;

  if (session.payment_status !== 'paid') {
    console.warn(
      `[stripe webhook] checkout.session.completed with payment_status='${session.payment_status}' (session ${session.id}) — skipping`,
    );
    return;
  }

  switch (session.metadata?.kind) {
    case 'service_base':
      await handleServiceBaseCheckout(session);
      break;
    case 'service_addon':
      await handleServiceAddonCheckout(session);
      break;
    case 'contract':
      await handleContractCheckout(session);
      break;
    default:
      return;
  }
}

interface AddonSnapshot {
  addonId: string;
  type: string;
  name: string;
  price: number;
  quantity: number;
}

function extractLineItemSnapshots(full: Stripe.Checkout.Session): {
  basePrice: number;
  addons: AddonSnapshot[];
} {
  let basePrice = 0;
  const addons: AddonSnapshot[] = [];
  for (const li of full.line_items?.data ?? []) {
    const product = li.price?.product as Stripe.Product | undefined;
    if (!product || typeof product === 'string') continue;
    const meta = product.metadata;
    if (meta.kind === 'base') {
      basePrice = li.price?.unit_amount ?? 0;
    } else if (meta.kind === 'addon') {
      addons.push({
        addonId: meta.addon_id,
        type: meta.type,
        name: product.name,
        price: li.price?.unit_amount ?? 0,
        quantity: li.quantity ?? 1,
      });
    }
  }
  return { basePrice, addons };
}

async function handleServiceBaseCheckout(session: Stripe.Checkout.Session): Promise<void> {
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;
  if (!paymentIntentId) {
    console.error(`[stripe webhook] missing payment_intent on session ${session.id}`);
    return;
  }

  const existing = await db
    .select({ id: serviceOrders.id })
    .from(serviceOrders)
    .where(eq(serviceOrders.paymentIntentId, paymentIntentId))
    .limit(1);
  if (existing.length > 0) return;

  const m = session.metadata!;
  const serviceId = m.service_id;
  const clientId = Number(m.client_id);
  const freelancerId = Number(m.freelancer_id);
  const currency = m.currency;
  const deliveryDays = Number(m.delivery_days);
  const revisionsPurchased = Number(m.revisions_purchased);
  const platformFeePct = m.platform_fee_pct;

  const full = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['line_items.data.price.product'],
  });
  const { basePrice, addons } = extractLineItemSnapshots(full);

  const deliveryDeadline = new Date();
  deliveryDeadline.setUTCDate(deliveryDeadline.getUTCDate() + deliveryDays);

  const createdOrderId = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(serviceOrders)
      .values({
        serviceId,
        clientId,
        freelancerId,
        basePrice,
        currency,
        platformFeePct,
        deliveryDeadline: deliveryDeadline.toISOString(),
        revisionsPurchased,
        state: 'paid',
        paymentIntentId,
      })
      .returning();

    if (addons.length > 0) {
      await tx.insert(serviceOrderAddons).values(
        addons.map((s) => ({
          orderId: order.id,
          addonId: s.addonId,
          type: s.type,
          name: s.name,
          price: s.price,
          quantity: s.quantity,
          paymentIntentId,
        })),
      );
    }

    return order.id;
  });

  await notifyOrderPaid(createdOrderId);
}

async function handleServiceAddonCheckout(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    console.error(`[stripe webhook] service_addon session missing order_id metadata: ${session.id}`);
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;
  if (!paymentIntentId) {
    console.error(`[stripe webhook] service_addon session missing payment_intent: ${session.id}`);
    return;
  }

  // Per-addon-purchase idempotency in addition to the stripe_events table:
  // a duplicate event for the same PI finds an existing addon row and exits.
  const existingAddons = await db
    .select({ id: serviceOrderAddons.id })
    .from(serviceOrderAddons)
    .where(eq(serviceOrderAddons.paymentIntentId, paymentIntentId))
    .limit(1);
  if (existingAddons.length > 0) return;

  const orderRows = await db
    .select({ id: serviceOrders.id })
    .from(serviceOrders)
    .where(eq(serviceOrders.id, orderId))
    .limit(1);
  if (orderRows.length === 0) {
    console.error(`[stripe webhook] service_addon for unknown order ${orderId}`);
    return;
  }

  const full = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['line_items.data.price.product'],
  });
  const { addons } = extractLineItemSnapshots(full);

  if (addons.length === 0) {
    console.warn(`[stripe webhook] service_addon session has no addon line items: ${session.id}`);
    return;
  }

  const revisionsAdded = addons
    .filter((a) => a.type === 'revision')
    .reduce((sum, a) => sum + a.quantity, 0);

  await db.transaction(async (tx) => {
    await tx.insert(serviceOrderAddons).values(
      addons.map((s) => ({
        orderId,
        addonId: s.addonId,
        type: s.type,
        name: s.name,
        price: s.price,
        quantity: s.quantity,
        paymentIntentId,
      })),
    );

    if (revisionsAdded > 0) {
      await tx
        .update(serviceOrders)
        .set({
          revisionsPurchased: sql`revisions_purchased + ${revisionsAdded}`,
          updatedAt: sql`now()`,
        })
        .where(eq(serviceOrders.id, orderId));
    }
  });
}

async function handleContractCheckout(session: Stripe.Checkout.Session): Promise<void> {
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;
  if (!paymentIntentId) {
    console.error(`[stripe webhook] contract session missing payment_intent: ${session.id}`);
    return;
  }

  // PI-level idempotency in addition to the stripe_events table.
  const existing = await db
    .select({ id: contractOrders.id })
    .from(contractOrders)
    .where(eq(contractOrders.paymentIntentId, paymentIntentId))
    .limit(1);
  if (existing.length > 0) return;

  const m = session.metadata!;
  const contractId = m.contract_id;
  const clientId = Number(m.client_id);
  const freelancerId = Number(m.freelancer_id);
  const currency = m.currency;
  const platformFeePct = m.platform_fee_pct;
  const amount = session.amount_total ?? 0;

  if (!contractId || amount <= 0) {
    console.error(
      `[stripe webhook] contract session ${session.id} missing contract_id or amount_total`,
    );
    return;
  }

  await db
    .insert(contractOrders)
    .values({
      contractId,
      clientId,
      freelancerId,
      amount,
      currency,
      platformFeePct,
      state: 'paid',
      paymentIntentId,
    })
    .onConflictDoNothing({ target: contractOrders.contractId });

  // Best-effort WS push so the contract side panel flips Pay → Paid live.
  // Errors logged, not swallowed — broadcast is non-transactional.
  try {
    const full = await fetchFullContract(contractId);
    if (full) {
      await broadcastContract(full.conversationId, 'contract_updated', full);
    }
  } catch (err) {
    console.error(`[stripe webhook] contract broadcast failed for ${contractId}:`, err);
  }

  await notifyContractPaid(contractId, amount, currency);
}

/**
 * Handles transfer.created and transfer.paid (and similar) — once Stripe
 * confirms the transfer to the freelancer's Connect account, transitions
 * the order from accepted | auto_accepted → completed.
 *
 * Idempotent via the state-machine CAS: a duplicate event finds the
 * order already in 'completed' and the transition throws an
 * InvalidTransitionError, which we swallow.
 */
export async function handleTransferEvent(event: Stripe.Event): Promise<void> {
  const transfer = event.data.object as Stripe.Transfer;

  // Contract orders carry { contract_order_id } in metadata; service
  // orders carry { order_id }. Dispatch on whichever is present.
  if (transfer.metadata?.contract_order_id) {
    await handleContractTransferEvent(event, transfer);
    return;
  }

  const orderId = transfer.metadata?.order_id;
  if (!orderId) {
    console.warn(`[stripe webhook] ${event.type} without order_id metadata: ${transfer.id}`);
    return;
  }

  const orders = await db
    .select()
    .from(serviceOrders)
    .where(eq(serviceOrders.id, orderId))
    .limit(1);
  if (orders.length === 0) {
    console.warn(`[stripe webhook] ${event.type} for unknown order ${orderId}`);
    return;
  }
  const order = orders[0];

  if (order.transferId && order.transferId !== transfer.id) {
    console.warn(
      `[stripe webhook] ${event.type} transfer_id mismatch on order ${orderId}: stored=${order.transferId} event=${transfer.id}`,
    );
    return;
  }

  if (order.state !== 'accepted' && order.state !== 'auto_accepted') {
    // Either already completed or in a state where this event is moot.
    return;
  }

  try {
    await transitionServiceOrder(order.id, order.state, 'completed');
  } catch (err) {
    if (err instanceof InvalidTransitionError) return;
    throw err;
  }

  await notifyOrderCompleted(order.id);
}

async function handleContractTransferEvent(
  event: Stripe.Event,
  transfer: Stripe.Transfer,
): Promise<void> {
  const contractOrderId = transfer.metadata!.contract_order_id!;

  const orders = await db
    .select()
    .from(contractOrders)
    .where(eq(contractOrders.id, contractOrderId))
    .limit(1);
  if (orders.length === 0) {
    console.warn(
      `[stripe webhook] ${event.type} for unknown contract order ${contractOrderId}`,
    );
    return;
  }
  const order = orders[0];

  if (order.transferId && order.transferId !== transfer.id) {
    console.warn(
      `[stripe webhook] ${event.type} transfer_id mismatch on contract order ${contractOrderId}: stored=${order.transferId} event=${transfer.id}`,
    );
    return;
  }

  if (order.state !== 'accepted' && order.state !== 'auto_accepted') {
    return;
  }

  try {
    await transitionContractOrder(order.id, order.state, 'completed');
  } catch (err) {
    if (err instanceof InvalidContractTransitionError) return;
    throw err;
  }

  // Best-effort UI refresh.
  try {
    const full = await fetchFullContract(order.contractId);
    if (full) {
      await broadcastContract(full.conversationId, 'contract_updated', full);
    }
  } catch (err) {
    console.error(
      `[stripe webhook] contract completion broadcast failed for ${order.contractId}:`,
      err,
    );
  }
}

/**
 * Handles charge.refunded — fires when a charge is fully refunded
 * (i.e. all refunds on it sum to the charge amount).
 *
 *   - Service orders: advances cancelled → refunded.
 *   - Contract orders: advances disputed → refunded if the admin route
 *     happened to skip the in-handler transition (rare) or if a refund
 *     was issued directly from the Stripe dashboard.
 *
 * Dispute resolutions ('refund_client' / 'split') already transition
 * directly in the resolve endpoint, so when this event arrives the row
 * is typically already refunded/completed and the CAS no-ops via the
 * swallowed InvalidTransitionError. Partial refunds (split path) don't
 * fire charge.refunded.
 */
export async function handleChargeRefunded(event: Stripe.Event): Promise<void> {
  const charge = event.data.object as Stripe.Charge;
  if (charge.refunded !== true) return;

  const paymentIntentId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  const orders = await db
    .select()
    .from(serviceOrders)
    .where(eq(serviceOrders.paymentIntentId, paymentIntentId))
    .limit(1);
  if (orders.length > 0) {
    const order = orders[0];
    if (order.state !== 'cancelled') return;

    try {
      await transitionServiceOrder(order.id, 'cancelled', 'refunded');
    } catch (err) {
      if (err instanceof InvalidTransitionError) return;
      throw err;
    }

    await notifyOrderRefunded(order.id);
    return;
  }

  // Not a service order PI — check contract_orders.
  const contractRows = await db
    .select()
    .from(contractOrders)
    .where(eq(contractOrders.paymentIntentId, paymentIntentId))
    .limit(1);
  if (contractRows.length === 0) {
    // Probably a mid-order addon PI or unrelated charge; nothing to do.
    return;
  }
  const contractOrder = contractRows[0];
  if (contractOrder.state !== 'disputed') {
    // Either already refunded (admin route pre-transitioned) or in some
    // other state where this event is moot. The CAS would no-op anyway,
    // but the early return avoids a noisy error log.
    return;
  }

  try {
    await transitionContractOrder(contractOrder.id, 'disputed', 'refunded');
  } catch (err) {
    if (err instanceof InvalidContractTransitionError) return;
    throw err;
  }

  // Best-effort UI refresh.
  try {
    const full = await fetchFullContract(contractOrder.contractId);
    if (full) {
      await broadcastContract(full.conversationId, 'contract_updated', full);
    }
  } catch (err) {
    console.error(
      `[stripe webhook] contract refund broadcast failed for ${contractOrder.contractId}:`,
      err,
    );
  }
}

/**
 * Handles account.updated for Connect accounts — keeps the cached
 * capability flags in stripe_connect_accounts fresh between live syncs.
 * Looks up the row via metadata.user_id stored at account creation.
 */
export async function handleAccountUpdated(event: Stripe.Event): Promise<void> {
  const account = event.data.object as Stripe.Account;
  const userIdRaw = account.metadata?.user_id;
  if (!userIdRaw) return;
  const userId = Number(userIdRaw);
  if (!Number.isFinite(userId)) return;

  await db
    .update(stripeConnectAccounts)
    .set({
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
      detailsSubmitted: account.details_submitted ?? false,
      requirementsCurrentlyDue: account.requirements?.currently_due ?? [],
      lastSyncedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(stripeConnectAccounts.userId, userId));
}
