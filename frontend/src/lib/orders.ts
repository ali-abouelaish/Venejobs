import { and, eq, sql, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { serviceOrders } from '@/lib/db/schema/services';
import { contractOrders } from '@/lib/db/schema/contracts';

export type ServiceOrderRow = typeof serviceOrders.$inferSelect;
export type ContractOrderRow = typeof contractOrders.$inferSelect;

// Allow raw SQL expressions (e.g. sql`now()`) in place of any column
// value, mirroring what Drizzle's .set() actually accepts.
type ServiceOrderUpdate = {
  [K in keyof typeof serviceOrders.$inferInsert]?:
    | (typeof serviceOrders.$inferInsert)[K]
    | SQL;
};

export class InvalidTransitionError extends Error {
  constructor(
    public readonly orderId: string,
    public readonly fromState: string,
    public readonly toState: string,
  ) {
    super(`Service order ${orderId} cannot transition from '${fromState}' to '${toState}'`);
    this.name = 'InvalidTransitionError';
  }
}

/**
 * Allowed forward transitions for service_orders.state.
 *
 *   paid → in_progress | cancelled
 *   in_progress → delivered | cancelled
 *   delivered → revision_requested | accepted | auto_accepted | disputed
 *   revision_requested → in_progress
 *   accepted | auto_accepted → completed   (settled by transfer.paid webhook)
 *   cancelled → refunded                   (settled by charge.refunded webhook)
 *   disputed → completed | refunded        (admin resolves)
 *
 * Terminal states (no outgoing transitions): completed, refunded.
 */
// `paid → delivered` is allowed in addition to `paid → in_progress → delivered`
// so freelancers can deliver immediately on a paid order without an
// explicit "start work" step. The `in_progress` state remains the target
// of revision_requested → in_progress transitions in Phase 6.
const VALID_TRANSITIONS: Record<string, readonly string[]> = {
  paid: ['in_progress', 'delivered', 'cancelled'],
  in_progress: ['delivered', 'cancelled'],
  delivered: ['revision_requested', 'accepted', 'auto_accepted', 'disputed'],
  revision_requested: ['in_progress', 'disputed'],
  accepted: ['completed'],
  auto_accepted: ['completed'],
  cancelled: ['refunded'],
  disputed: ['completed', 'refunded'],
};

type TxOrDb = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Atomically transitions a service order from `fromState` to `toState`,
 * applying any extra column patches in the same UPDATE. Throws
 * InvalidTransitionError if the transition isn't in VALID_TRANSITIONS or
 * if the row's current state doesn't match `fromState` (compare-and-swap).
 *
 * All state changes on service_orders MUST go through this function. No
 * silent updates to `state` elsewhere.
 */
export async function transitionServiceOrder(
  orderId: string,
  fromState: string,
  toState: string,
  patch: ServiceOrderUpdate = {},
  exec: TxOrDb = db,
): Promise<ServiceOrderRow> {
  const allowed = VALID_TRANSITIONS[fromState];
  if (!allowed || !allowed.includes(toState)) {
    throw new InvalidTransitionError(orderId, fromState, toState);
  }

  const [row] = await exec
    .update(serviceOrders)
    .set({ ...patch, state: toState, updatedAt: sql`now()` })
    .where(and(eq(serviceOrders.id, orderId), eq(serviceOrders.state, fromState)))
    .returning();

  if (!row) {
    throw new InvalidTransitionError(orderId, fromState, toState);
  }
  return row;
}

// ─── Contract orders ────────────────────────────────────────────────────

type ContractOrderUpdate = {
  [K in keyof typeof contractOrders.$inferInsert]?:
    | (typeof contractOrders.$inferInsert)[K]
    | SQL;
};

/**
 * Allowed forward transitions for contract_orders.state.
 *
 *   paid → delivered | disputed                (freelancer delivers / either party disputes)
 *   delivered → accepted | auto_accepted | disputed
 *   accepted | auto_accepted → completed       (settled by transfer.paid webhook)
 *   disputed → completed | refunded            (admin resolves)
 *
 * Terminal states: completed, refunded.
 *
 * Mirrors service_orders state machine intentionally minus revision_requested —
 * contracts are scope-based one-shots without revision allowances.
 */
const CONTRACT_VALID_TRANSITIONS: Record<string, readonly string[]> = {
  paid: ['delivered', 'disputed'],
  delivered: ['accepted', 'auto_accepted', 'disputed'],
  accepted: ['completed'],
  auto_accepted: ['completed'],
  disputed: ['completed', 'refunded'],
};

export class InvalidContractTransitionError extends Error {
  constructor(
    public readonly orderId: string,
    public readonly fromState: string,
    public readonly toState: string,
  ) {
    super(`Contract order ${orderId} cannot transition from '${fromState}' to '${toState}'`);
    this.name = 'InvalidContractTransitionError';
  }
}

/**
 * Atomically transitions a contract order from `fromState` to `toState`.
 * Same compare-and-swap pattern as transitionServiceOrder — see that
 * function's docstring for the invariants this preserves.
 */
export async function transitionContractOrder(
  orderId: string,
  fromState: string,
  toState: string,
  patch: ContractOrderUpdate = {},
  exec: TxOrDb = db,
): Promise<ContractOrderRow> {
  const allowed = CONTRACT_VALID_TRANSITIONS[fromState];
  if (!allowed || !allowed.includes(toState)) {
    throw new InvalidContractTransitionError(orderId, fromState, toState);
  }

  const [row] = await exec
    .update(contractOrders)
    .set({ ...patch, state: toState, updatedAt: sql`now()` })
    .where(and(eq(contractOrders.id, orderId), eq(contractOrders.state, fromState)))
    .returning();

  if (!row) {
    throw new InvalidContractTransitionError(orderId, fromState, toState);
  }
  return row;
}
