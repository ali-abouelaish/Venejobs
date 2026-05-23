// Display labels and tone mapping for service and order state machines.
// Mirrors the values in lib/orders.ts VALID_TRANSITIONS but is presentation only.

import type { BadgeTone } from '../components/Primitives';

export type OrderState =
  | 'paid'
  | 'in_progress'
  | 'delivered'
  | 'revision_requested'
  | 'accepted'
  | 'auto_accepted'
  | 'disputed'
  | 'cancelled'
  | 'refunded'
  | 'completed';

export type ServiceStatus = 'draft' | 'pending_review' | 'published' | 'rejected';

export const ORDER_STATE: Record<OrderState, { label: string; tone: BadgeTone; desc: string }> = {
  paid:               { label: 'Paid',               tone: 'info',    desc: 'Funds received. Freelancer can start work.' },
  in_progress:        { label: 'In Progress',        tone: 'info',    desc: 'Work has started.' },
  delivered:          { label: 'Delivered',          tone: 'info',    desc: 'Awaiting client review.' },
  revision_requested: { label: 'Revision Requested', tone: 'warning', desc: 'Client requested changes.' },
  accepted:           { label: 'Accepted',           tone: 'success', desc: 'Awaiting payout transfer.' },
  auto_accepted:      { label: 'Auto Accepted',      tone: 'success', desc: 'Review window elapsed.' },
  disputed:           { label: 'Disputed',           tone: 'error',   desc: 'Under admin review.' },
  cancelled:          { label: 'Cancelled',          tone: 'error',   desc: 'Order cancelled. Refund pending.' },
  refunded:           { label: 'Refunded',           tone: 'neutral', desc: 'Client has been refunded.' },
  completed:          { label: 'Completed',          tone: 'success', desc: 'Funds transferred to freelancer.' },
};

export const SERVICE_STATUS: Record<ServiceStatus, { label: string; tone: BadgeTone }> = {
  draft:          { label: 'Draft',          tone: 'neutral' },
  pending_review: { label: 'Pending Review', tone: 'warning' },
  published:      { label: 'Published',      tone: 'success' },
  rejected:       { label: 'Rejected',       tone: 'error'   },
};

export function orderDisplay(state: string) {
  return ORDER_STATE[state as OrderState] ?? { label: state, tone: 'neutral' as BadgeTone, desc: '' };
}

export function serviceDisplay(status: string) {
  return SERVICE_STATUS[status as ServiceStatus] ?? { label: status, tone: 'neutral' as BadgeTone };
}

export const ACTIVE_ORDER_STATES: OrderState[] = [
  'paid', 'in_progress', 'delivered', 'revision_requested', 'accepted', 'auto_accepted', 'disputed',
];

export function isActiveOrderState(state: string): boolean {
  return ACTIVE_ORDER_STATES.includes(state as OrderState);
}
