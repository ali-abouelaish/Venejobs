/**
 * Platform fee percentage stamped onto each service order at creation.
 * The stamped value persists on `service_orders.platform_fee_pct`;
 * changing this constant does NOT affect existing orders retroactively.
 *
 * Kept as a constant for MVP. Promote to a platform_settings table when
 * there is a business reason (per-freelancer fees, fee schedules, etc).
 */
export const PLATFORM_FEE_PCT = 10.00;
