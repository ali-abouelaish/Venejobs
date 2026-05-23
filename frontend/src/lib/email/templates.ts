/**
 * HTML email templates. Inline styling only (most clients strip <style>).
 * One source of truth for branding (header gradient, footer, link colors).
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:5173';

function appLink(path: string): string {
  const base = APP_URL.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface ShellArgs {
  heading: string;
  greetingName: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
  accentFrom?: string;
  accentTo?: string;
}

function shell({
  heading,
  greetingName,
  bodyHtml,
  ctaLabel,
  ctaHref,
  accentFrom = '#0072ff',
  accentTo = '#00c6ff',
}: ShellArgs): string {
  const cta =
    ctaLabel && ctaHref
      ? `<div style="text-align:center;margin:30px 0;">
           <a href="${ctaHref}" style="background:${accentFrom};color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:bold;display:inline-block;">
             ${escapeHtml(ctaLabel)}
           </a>
         </div>`
      : '';

  return `
  <div style="font-family:Arial,sans-serif;background-color:#f4f6f8;padding:30px;">
    <div style="max-width:600px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.1);">
      <div style="background:linear-gradient(135deg,${accentFrom},${accentTo});padding:20px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;">${escapeHtml(heading)}</h1>
      </div>
      <div style="padding:30px;color:#333;font-size:15px;line-height:1.55;">
        <p style="margin:0 0 16px 0;">Hello, ${escapeHtml(greetingName)}!</p>
        ${bodyHtml}
        ${cta}
      </div>
      <div style="background:#f0f0f0;padding:15px;text-align:center;font-size:12px;color:#888;">
        © ${new Date().getFullYear()} Venejob. All rights reserved.
      </div>
    </div>
  </div>`;
}

export interface RenderedEmail {
  subject: string;
  html: string;
}

// -------- Service lifecycle --------

export function tServiceSubmittedToFreelancer(args: {
  name: string;
  serviceTitle: string;
}): RenderedEmail {
  return {
    subject: `Your service "${args.serviceTitle}" was submitted for review`,
    html: shell({
      heading: 'Service submitted',
      greetingName: args.name,
      bodyHtml: `
        <p>Your service <strong>${escapeHtml(args.serviceTitle)}</strong> has been submitted to the Venejob team for review.</p>
        <p>We'll email you again as soon as an admin approves it or sends it back with feedback.</p>
      `,
      ctaLabel: 'View my services',
      ctaHref: appLink('/freelancer/services'),
    }),
  };
}

export function tServiceSubmittedToAdmin(args: {
  name: string;
  serviceTitle: string;
  freelancerName: string;
  serviceId: string;
}): RenderedEmail {
  return {
    subject: `New service awaiting review: "${args.serviceTitle}"`,
    html: shell({
      heading: 'Service awaiting review',
      greetingName: args.name,
      bodyHtml: `
        <p><strong>${escapeHtml(args.freelancerName)}</strong> just submitted a new service for approval:</p>
        <p style="background:#f8f9fb;border-left:3px solid #0072ff;padding:10px 14px;margin:14px 0;">
          ${escapeHtml(args.serviceTitle)}
        </p>
      `,
      ctaLabel: 'Review in admin',
      ctaHref: appLink('/admin/services'),
    }),
  };
}

export function tServiceApprovedToFreelancer(args: {
  name: string;
  serviceTitle: string;
  serviceId: string;
}): RenderedEmail {
  return {
    subject: `Approved: your service "${args.serviceTitle}" is now live`,
    html: shell({
      heading: 'Service approved',
      greetingName: args.name,
      bodyHtml: `
        <p>Great news — your service <strong>${escapeHtml(args.serviceTitle)}</strong> has been approved and is now live on Venejob.</p>
        <p>Clients can discover and order it right away.</p>
      `,
      ctaLabel: 'View live service',
      ctaHref: appLink(`/services/${args.serviceId}`),
      accentFrom: '#16a34a',
      accentTo: '#22c55e',
    }),
  };
}

export function tServiceApprovedToAdmin(args: {
  name: string;
  serviceTitle: string;
  freelancerName: string;
}): RenderedEmail {
  return {
    subject: `Service approved: "${args.serviceTitle}"`,
    html: shell({
      heading: 'Service approved',
      greetingName: args.name,
      bodyHtml: `
        <p>The service <strong>${escapeHtml(args.serviceTitle)}</strong> by <strong>${escapeHtml(args.freelancerName)}</strong> has been approved and is now live.</p>
      `,
      accentFrom: '#16a34a',
      accentTo: '#22c55e',
    }),
  };
}

export function tServiceRejectedToFreelancer(args: {
  name: string;
  serviceTitle: string;
  reason: string;
  serviceId: string;
}): RenderedEmail {
  return {
    subject: `Action needed: "${args.serviceTitle}" was sent back for revisions`,
    html: shell({
      heading: 'Service needs revisions',
      greetingName: args.name,
      bodyHtml: `
        <p>Your service <strong>${escapeHtml(args.serviceTitle)}</strong> wasn't approved this round. Our admin team left this feedback:</p>
        <p style="background:#fff7ed;border-left:3px solid #ea580c;padding:10px 14px;margin:14px 0;white-space:pre-wrap;">
          ${escapeHtml(args.reason)}
        </p>
        <p>Edit your service and resubmit when you're ready — there's no limit on resubmissions.</p>
      `,
      ctaLabel: 'Edit service',
      ctaHref: appLink(`/freelancer/services/${args.serviceId}`),
      accentFrom: '#ea580c',
      accentTo: '#f97316',
    }),
  };
}

export function tServiceRejectedToAdmin(args: {
  name: string;
  serviceTitle: string;
  freelancerName: string;
  reason: string;
}): RenderedEmail {
  return {
    subject: `Service rejected: "${args.serviceTitle}"`,
    html: shell({
      heading: 'Service rejected',
      greetingName: args.name,
      bodyHtml: `
        <p>The service <strong>${escapeHtml(args.serviceTitle)}</strong> by <strong>${escapeHtml(args.freelancerName)}</strong> has been rejected with reason:</p>
        <p style="background:#fff7ed;border-left:3px solid #ea580c;padding:10px 14px;margin:14px 0;white-space:pre-wrap;">
          ${escapeHtml(args.reason)}
        </p>
      `,
      accentFrom: '#ea580c',
      accentTo: '#f97316',
    }),
  };
}

// -------- Order lifecycle --------

export function tOrderPaidToClient(args: {
  name: string;
  serviceTitle: string;
  orderId: string;
  amount: string;
}): RenderedEmail {
  return {
    subject: `Order confirmed: "${args.serviceTitle}"`,
    html: shell({
      heading: 'Order confirmed',
      greetingName: args.name,
      bodyHtml: `
        <p>Thanks for your order. Your payment of <strong>${escapeHtml(args.amount)}</strong> has been received and the freelancer has been notified.</p>
        <p>You'll get another email as soon as work is delivered.</p>
      `,
      ctaLabel: 'View order',
      ctaHref: appLink(`/orders/${args.orderId}`),
    }),
  };
}

export function tOrderPaidToFreelancer(args: {
  name: string;
  serviceTitle: string;
  orderId: string;
  clientName: string;
}): RenderedEmail {
  return {
    subject: `New order received: "${args.serviceTitle}"`,
    html: shell({
      heading: 'New order',
      greetingName: args.name,
      bodyHtml: `
        <p>You just got a new order from <strong>${escapeHtml(args.clientName)}</strong> for <strong>${escapeHtml(args.serviceTitle)}</strong>.</p>
        <p>The funds are held in escrow. Deliver your work via the order page to release the payout.</p>
      `,
      ctaLabel: 'Open order',
      ctaHref: appLink(`/orders/${args.orderId}`),
    }),
  };
}

export function tOrderPaidToAdmin(args: {
  name: string;
  serviceTitle: string;
  clientName: string;
  freelancerName: string;
  amount: string;
  orderId: string;
}): RenderedEmail {
  return {
    subject: `New order: "${args.serviceTitle}"`,
    html: shell({
      heading: 'New order on the platform',
      greetingName: args.name,
      bodyHtml: `
        <p><strong>${escapeHtml(args.clientName)}</strong> ordered <strong>${escapeHtml(args.serviceTitle)}</strong> from <strong>${escapeHtml(args.freelancerName)}</strong>.</p>
        <p>Gross: <strong>${escapeHtml(args.amount)}</strong></p>
        <p>Order id: <code>${escapeHtml(args.orderId)}</code></p>
      `,
    }),
  };
}

export function tOrderDeliveredToClient(args: {
  name: string;
  serviceTitle: string;
  orderId: string;
}): RenderedEmail {
  return {
    subject: `Delivery received: "${args.serviceTitle}"`,
    html: shell({
      heading: 'Work delivered',
      greetingName: args.name,
      bodyHtml: `
        <p>The freelancer has delivered work for <strong>${escapeHtml(args.serviceTitle)}</strong>.</p>
        <p>Please review the delivery. You can accept it, request a revision, or open a dispute. If you take no action within 7 days the order will auto-accept.</p>
      `,
      ctaLabel: 'Review delivery',
      ctaHref: appLink(`/orders/${args.orderId}`),
    }),
  };
}

export function tOrderDeliveredToFreelancer(args: {
  name: string;
  serviceTitle: string;
  orderId: string;
}): RenderedEmail {
  return {
    subject: `Delivery submitted for "${args.serviceTitle}"`,
    html: shell({
      heading: 'Delivery submitted',
      greetingName: args.name,
      bodyHtml: `
        <p>Your delivery for <strong>${escapeHtml(args.serviceTitle)}</strong> has been sent to the client.</p>
        <p>They have 7 days to accept or request a revision. If they don't respond the order will auto-accept.</p>
      `,
      ctaLabel: 'View order',
      ctaHref: appLink(`/orders/${args.orderId}`),
    }),
  };
}

export function tOrderDeliveredToAdmin(args: {
  name: string;
  serviceTitle: string;
  freelancerName: string;
  clientName: string;
  orderId: string;
}): RenderedEmail {
  return {
    subject: `Delivery submitted: "${args.serviceTitle}"`,
    html: shell({
      heading: 'Delivery submitted',
      greetingName: args.name,
      bodyHtml: `
        <p><strong>${escapeHtml(args.freelancerName)}</strong> just submitted a delivery for order <code>${escapeHtml(args.orderId)}</code> (<strong>${escapeHtml(args.serviceTitle)}</strong>) bought by <strong>${escapeHtml(args.clientName)}</strong>.</p>
      `,
    }),
  };
}

export function tOrderAcceptedToClient(args: {
  name: string;
  serviceTitle: string;
  orderId: string;
  auto: boolean;
}): RenderedEmail {
  return {
    subject: args.auto
      ? `Order auto-accepted: "${args.serviceTitle}"`
      : `Order accepted: "${args.serviceTitle}"`,
    html: shell({
      heading: args.auto ? 'Order auto-accepted' : 'Order accepted',
      greetingName: args.name,
      bodyHtml: args.auto
        ? `<p>The 7-day review window on <strong>${escapeHtml(args.serviceTitle)}</strong> has passed with no action, so the order was auto-accepted. The freelancer is being paid out.</p>`
        : `<p>You accepted the delivery for <strong>${escapeHtml(args.serviceTitle)}</strong>. The freelancer is being paid out.</p>`,
      ctaLabel: 'View order',
      ctaHref: appLink(`/orders/${args.orderId}`),
      accentFrom: '#16a34a',
      accentTo: '#22c55e',
    }),
  };
}

export function tOrderAcceptedToFreelancer(args: {
  name: string;
  serviceTitle: string;
  orderId: string;
  auto: boolean;
}): RenderedEmail {
  return {
    subject: args.auto
      ? `Auto-accepted and payout in progress: "${args.serviceTitle}"`
      : `Accepted! Payout in progress: "${args.serviceTitle}"`,
    html: shell({
      heading: args.auto ? 'Auto-accepted' : 'Order accepted',
      greetingName: args.name,
      bodyHtml: args.auto
        ? `<p>The client didn't action the delivery in 7 days, so <strong>${escapeHtml(args.serviceTitle)}</strong> has been auto-accepted. A Stripe transfer to your Connect account is in progress and you'll be emailed again once it settles.</p>`
        : `<p>The client accepted your delivery for <strong>${escapeHtml(args.serviceTitle)}</strong>. A Stripe transfer to your Connect account is in progress.</p>`,
      ctaLabel: 'View order',
      ctaHref: appLink(`/orders/${args.orderId}`),
      accentFrom: '#16a34a',
      accentTo: '#22c55e',
    }),
  };
}

export function tOrderAcceptedToAdmin(args: {
  name: string;
  serviceTitle: string;
  freelancerName: string;
  clientName: string;
  orderId: string;
  auto: boolean;
}): RenderedEmail {
  return {
    subject: args.auto
      ? `Order auto-accepted: "${args.serviceTitle}"`
      : `Order accepted: "${args.serviceTitle}"`,
    html: shell({
      heading: args.auto ? 'Order auto-accepted' : 'Order accepted',
      greetingName: args.name,
      bodyHtml: `
        <p>Order <code>${escapeHtml(args.orderId)}</code> (<strong>${escapeHtml(args.serviceTitle)}</strong>) was ${args.auto ? 'auto-accepted by cron' : `accepted by ${escapeHtml(args.clientName)}`}. Payout initiated to <strong>${escapeHtml(args.freelancerName)}</strong>.</p>
      `,
      accentFrom: '#16a34a',
      accentTo: '#22c55e',
    }),
  };
}

export function tOrderCompletedToFreelancer(args: {
  name: string;
  serviceTitle: string;
  orderId: string;
}): RenderedEmail {
  return {
    subject: `Payout completed for "${args.serviceTitle}"`,
    html: shell({
      heading: 'Payout completed',
      greetingName: args.name,
      bodyHtml: `
        <p>The Stripe transfer for <strong>${escapeHtml(args.serviceTitle)}</strong> has settled and the order is now complete. Funds are in your Connect balance.</p>
      `,
      ctaLabel: 'View order',
      ctaHref: appLink(`/orders/${args.orderId}`),
      accentFrom: '#16a34a',
      accentTo: '#22c55e',
    }),
  };
}

export function tOrderRevisionRequestedToFreelancer(args: {
  name: string;
  serviceTitle: string;
  orderId: string;
  message: string;
}): RenderedEmail {
  return {
    subject: `Revision requested on "${args.serviceTitle}"`,
    html: shell({
      heading: 'Revision requested',
      greetingName: args.name,
      bodyHtml: `
        <p>The client requested a revision on <strong>${escapeHtml(args.serviceTitle)}</strong>:</p>
        <p style="background:#f8f9fb;border-left:3px solid #0072ff;padding:10px 14px;margin:14px 0;white-space:pre-wrap;">
          ${escapeHtml(args.message)}
        </p>
        <p>The order is back in progress. Deliver again when the revision is ready.</p>
      `,
      ctaLabel: 'Open order',
      ctaHref: appLink(`/orders/${args.orderId}`),
      accentFrom: '#ea580c',
      accentTo: '#f97316',
    }),
  };
}

export function tOrderRevisionRequestedToClient(args: {
  name: string;
  serviceTitle: string;
  orderId: string;
}): RenderedEmail {
  return {
    subject: `Revision requested for "${args.serviceTitle}"`,
    html: shell({
      heading: 'Revision sent',
      greetingName: args.name,
      bodyHtml: `
        <p>Your revision request for <strong>${escapeHtml(args.serviceTitle)}</strong> has been sent to the freelancer. We'll email you once the new delivery is ready.</p>
      `,
      ctaLabel: 'View order',
      ctaHref: appLink(`/orders/${args.orderId}`),
    }),
  };
}

export function tOrderRevisionRequestedToAdmin(args: {
  name: string;
  serviceTitle: string;
  clientName: string;
  orderId: string;
}): RenderedEmail {
  return {
    subject: `Revision requested: "${args.serviceTitle}"`,
    html: shell({
      heading: 'Revision requested',
      greetingName: args.name,
      bodyHtml: `
        <p><strong>${escapeHtml(args.clientName)}</strong> requested a revision on order <code>${escapeHtml(args.orderId)}</code> (<strong>${escapeHtml(args.serviceTitle)}</strong>).</p>
      `,
    }),
  };
}

export function tOrderCancelledToClient(args: {
  name: string;
  serviceTitle: string;
  orderId: string;
}): RenderedEmail {
  return {
    subject: `Cancellation initiated: "${args.serviceTitle}"`,
    html: shell({
      heading: 'Cancellation initiated',
      greetingName: args.name,
      bodyHtml: `
        <p>Your cancellation of <strong>${escapeHtml(args.serviceTitle)}</strong> was processed. Refunds have been issued and should appear on your statement within 5–10 business days.</p>
      `,
      ctaLabel: 'View order',
      ctaHref: appLink(`/orders/${args.orderId}`),
      accentFrom: '#dc2626',
      accentTo: '#ef4444',
    }),
  };
}

export function tOrderCancelledToFreelancer(args: {
  name: string;
  serviceTitle: string;
  orderId: string;
}): RenderedEmail {
  return {
    subject: `Order cancelled: "${args.serviceTitle}"`,
    html: shell({
      heading: 'Order cancelled',
      greetingName: args.name,
      bodyHtml: `
        <p>The client cancelled their order for <strong>${escapeHtml(args.serviceTitle)}</strong> after the delivery deadline passed. Funds are being refunded to them.</p>
      `,
      ctaLabel: 'View order',
      ctaHref: appLink(`/orders/${args.orderId}`),
      accentFrom: '#dc2626',
      accentTo: '#ef4444',
    }),
  };
}

export function tOrderCancelledToAdmin(args: {
  name: string;
  serviceTitle: string;
  clientName: string;
  freelancerName: string;
  orderId: string;
}): RenderedEmail {
  return {
    subject: `Order cancelled: "${args.serviceTitle}"`,
    html: shell({
      heading: 'Order cancelled',
      greetingName: args.name,
      bodyHtml: `
        <p><strong>${escapeHtml(args.clientName)}</strong> cancelled order <code>${escapeHtml(args.orderId)}</code> (<strong>${escapeHtml(args.serviceTitle)}</strong>) bought from <strong>${escapeHtml(args.freelancerName)}</strong>. Refunds have been initiated.</p>
      `,
      accentFrom: '#dc2626',
      accentTo: '#ef4444',
    }),
  };
}

export function tOrderRefundedToClient(args: {
  name: string;
  serviceTitle: string;
  orderId: string;
}): RenderedEmail {
  return {
    subject: `Refund settled for "${args.serviceTitle}"`,
    html: shell({
      heading: 'Refund settled',
      greetingName: args.name,
      bodyHtml: `
        <p>The refund for your cancelled order <strong>${escapeHtml(args.serviceTitle)}</strong> has been processed by Stripe and should reach your card shortly.</p>
      `,
      ctaLabel: 'View order',
      ctaHref: appLink(`/orders/${args.orderId}`),
    }),
  };
}

export function tOrderRefundedToAdmin(args: {
  name: string;
  serviceTitle: string;
  orderId: string;
}): RenderedEmail {
  return {
    subject: `Refund settled: "${args.serviceTitle}"`,
    html: shell({
      heading: 'Refund settled',
      greetingName: args.name,
      bodyHtml: `
        <p>Refund for order <code>${escapeHtml(args.orderId)}</code> (<strong>${escapeHtml(args.serviceTitle)}</strong>) has settled at Stripe.</p>
      `,
    }),
  };
}

export function tOrderDisputedToClient(args: {
  name: string;
  serviceTitle: string;
  orderId: string;
}): RenderedEmail {
  return {
    subject: `Dispute opened on "${args.serviceTitle}"`,
    html: shell({
      heading: 'Dispute opened',
      greetingName: args.name,
      bodyHtml: `
        <p>We've recorded your dispute on <strong>${escapeHtml(args.serviceTitle)}</strong>. An admin will review the case and contact both sides before resolving it.</p>
      `,
      ctaLabel: 'View order',
      ctaHref: appLink(`/orders/${args.orderId}`),
      accentFrom: '#dc2626',
      accentTo: '#ef4444',
    }),
  };
}

export function tOrderDisputedToFreelancer(args: {
  name: string;
  serviceTitle: string;
  orderId: string;
  reason: string;
}): RenderedEmail {
  return {
    subject: `Dispute opened on your order "${args.serviceTitle}"`,
    html: shell({
      heading: 'Dispute opened',
      greetingName: args.name,
      bodyHtml: `
        <p>The client opened a dispute on <strong>${escapeHtml(args.serviceTitle)}</strong>. Their reason:</p>
        <p style="background:#fef2f2;border-left:3px solid #dc2626;padding:10px 14px;margin:14px 0;white-space:pre-wrap;">
          ${escapeHtml(args.reason)}
        </p>
        <p>The order is now under admin review. Funds remain in escrow until the dispute is resolved.</p>
      `,
      ctaLabel: 'View order',
      ctaHref: appLink(`/orders/${args.orderId}`),
      accentFrom: '#dc2626',
      accentTo: '#ef4444',
    }),
  };
}

export function tOrderDisputedToAdmin(args: {
  name: string;
  serviceTitle: string;
  clientName: string;
  freelancerName: string;
  orderId: string;
  reason: string;
}): RenderedEmail {
  return {
    subject: `Dispute opened: "${args.serviceTitle}"`,
    html: shell({
      heading: 'Dispute needs review',
      greetingName: args.name,
      bodyHtml: `
        <p><strong>${escapeHtml(args.clientName)}</strong> opened a dispute on order <code>${escapeHtml(args.orderId)}</code> (<strong>${escapeHtml(args.serviceTitle)}</strong>) bought from <strong>${escapeHtml(args.freelancerName)}</strong>.</p>
        <p style="background:#fef2f2;border-left:3px solid #dc2626;padding:10px 14px;margin:14px 0;white-space:pre-wrap;">
          ${escapeHtml(args.reason)}
        </p>
      `,
      ctaLabel: 'Review in admin',
      ctaHref: appLink('/admin/disputes'),
      accentFrom: '#dc2626',
      accentTo: '#ef4444',
    }),
  };
}

export function tOrderDisputeResolvedToClient(args: {
  name: string;
  serviceTitle: string;
  orderId: string;
  resolution: 'refund_client' | 'pay_freelancer' | 'split';
}): RenderedEmail {
  const summaries: Record<typeof args.resolution, string> = {
    refund_client: `The admin team decided to refund you in full for <strong>${escapeHtml(args.serviceTitle)}</strong>.`,
    pay_freelancer: `The admin team decided in favor of the freelancer on <strong>${escapeHtml(args.serviceTitle)}</strong>; the order will complete and the freelancer will be paid out.`,
    split: `The admin team resolved <strong>${escapeHtml(args.serviceTitle)}</strong> with a partial refund to you and a partial payout to the freelancer.`,
  };
  return {
    subject: `Dispute resolved: "${args.serviceTitle}"`,
    html: shell({
      heading: 'Dispute resolved',
      greetingName: args.name,
      bodyHtml: `<p>${summaries[args.resolution]}</p>`,
      ctaLabel: 'View order',
      ctaHref: appLink(`/orders/${args.orderId}`),
    }),
  };
}

export function tOrderDisputeResolvedToFreelancer(args: {
  name: string;
  serviceTitle: string;
  orderId: string;
  resolution: 'refund_client' | 'pay_freelancer' | 'split';
}): RenderedEmail {
  const summaries: Record<typeof args.resolution, string> = {
    refund_client: `The admin team decided to refund the client in full for <strong>${escapeHtml(args.serviceTitle)}</strong>. No payout will be issued for this order.`,
    pay_freelancer: `The admin team decided in your favor on <strong>${escapeHtml(args.serviceTitle)}</strong>. The full payout is being transferred to your Connect account.`,
    split: `The admin team resolved <strong>${escapeHtml(args.serviceTitle)}</strong> with a partial refund to the client. A partial payout is being transferred to your Connect account.`,
  };
  return {
    subject: `Dispute resolved: "${args.serviceTitle}"`,
    html: shell({
      heading: 'Dispute resolved',
      greetingName: args.name,
      bodyHtml: `<p>${summaries[args.resolution]}</p>`,
      ctaLabel: 'View order',
      ctaHref: appLink(`/orders/${args.orderId}`),
    }),
  };
}

// -------- Contracts --------

function contractCtaHref(conversationId: string): string {
  return appLink(`/messages?c=${encodeURIComponent(conversationId)}`);
}

export function tContractSubmittedToParty(args: {
  recipientName: string;
  contractTitle: string;
  senderName: string;
  conversationId: string;
}): RenderedEmail {
  return {
    subject: `Contract for review: "${args.contractTitle}"`,
    html: shell({
      heading: 'New contract for review',
      greetingName: args.recipientName,
      bodyHtml: `
        <p><strong>${escapeHtml(args.senderName)}</strong> sent you a contract titled <strong>${escapeHtml(args.contractTitle)}</strong> and is asking you to review and sign it.</p>
        <p>You can accept, request changes, or decline from the conversation page.</p>
      `,
      ctaLabel: 'Review contract',
      ctaHref: contractCtaHref(args.conversationId),
    }),
  };
}

export function tContractSubmittedToAdmin(args: {
  name: string;
  contractTitle: string;
  senderName: string;
  recipientName: string;
}): RenderedEmail {
  return {
    subject: `New contract: "${args.contractTitle}"`,
    html: shell({
      heading: 'New contract submitted',
      greetingName: args.name,
      bodyHtml: `
        <p><strong>${escapeHtml(args.senderName)}</strong> submitted a contract titled <strong>${escapeHtml(args.contractTitle)}</strong> to <strong>${escapeHtml(args.recipientName)}</strong> for review.</p>
      `,
    }),
  };
}

export function tContractSignedAwaitingOther(args: {
  recipientName: string;
  contractTitle: string;
  signerName: string;
  conversationId: string;
}): RenderedEmail {
  return {
    subject: `${args.signerName} signed "${args.contractTitle}" — your signature needed`,
    html: shell({
      heading: 'Awaiting your signature',
      greetingName: args.recipientName,
      bodyHtml: `
        <p><strong>${escapeHtml(args.signerName)}</strong> signed the contract <strong>${escapeHtml(args.contractTitle)}</strong>. It becomes active as soon as you countersign.</p>
      `,
      ctaLabel: 'Sign contract',
      ctaHref: contractCtaHref(args.conversationId),
      accentFrom: '#16a34a',
      accentTo: '#22c55e',
    }),
  };
}

export function tContractAcceptedToParty(args: {
  recipientName: string;
  contractTitle: string;
  conversationId: string;
}): RenderedEmail {
  return {
    subject: `Contract active: "${args.contractTitle}"`,
    html: shell({
      heading: 'Contract fully signed',
      greetingName: args.recipientName,
      bodyHtml: `
        <p>Both parties have signed <strong>${escapeHtml(args.contractTitle)}</strong>. The contract is now active and ready to proceed.</p>
      `,
      ctaLabel: 'Open contract',
      ctaHref: contractCtaHref(args.conversationId),
      accentFrom: '#16a34a',
      accentTo: '#22c55e',
    }),
  };
}

export function tContractAcceptedToAdmin(args: {
  name: string;
  contractTitle: string;
  clientName: string;
  freelancerName: string;
}): RenderedEmail {
  return {
    subject: `Contract accepted: "${args.contractTitle}"`,
    html: shell({
      heading: 'Contract accepted',
      greetingName: args.name,
      bodyHtml: `
        <p><strong>${escapeHtml(args.contractTitle)}</strong> has been countersigned by <strong>${escapeHtml(args.clientName)}</strong> and <strong>${escapeHtml(args.freelancerName)}</strong>. The proposal has been marked accepted.</p>
      `,
      accentFrom: '#16a34a',
      accentTo: '#22c55e',
    }),
  };
}

export function tContractDeclinedToParty(args: {
  recipientName: string;
  contractTitle: string;
  declinerName: string;
  conversationId: string;
}): RenderedEmail {
  return {
    subject: `Contract declined: "${args.contractTitle}"`,
    html: shell({
      heading: 'Contract declined',
      greetingName: args.recipientName,
      bodyHtml: `
        <p><strong>${escapeHtml(args.declinerName)}</strong> declined the contract <strong>${escapeHtml(args.contractTitle)}</strong>. You can discuss next steps in the conversation.</p>
      `,
      ctaLabel: 'Open conversation',
      ctaHref: contractCtaHref(args.conversationId),
      accentFrom: '#dc2626',
      accentTo: '#ef4444',
    }),
  };
}

export function tContractDeclinedToAdmin(args: {
  name: string;
  contractTitle: string;
  declinerName: string;
}): RenderedEmail {
  return {
    subject: `Contract declined: "${args.contractTitle}"`,
    html: shell({
      heading: 'Contract declined',
      greetingName: args.name,
      bodyHtml: `
        <p><strong>${escapeHtml(args.declinerName)}</strong> declined the contract <strong>${escapeHtml(args.contractTitle)}</strong>.</p>
      `,
      accentFrom: '#dc2626',
      accentTo: '#ef4444',
    }),
  };
}

export function tContractCancelledToParty(args: {
  recipientName: string;
  contractTitle: string;
  creatorName: string;
  conversationId: string;
}): RenderedEmail {
  return {
    subject: `Contract cancelled: "${args.contractTitle}"`,
    html: shell({
      heading: 'Contract cancelled',
      greetingName: args.recipientName,
      bodyHtml: `
        <p><strong>${escapeHtml(args.creatorName)}</strong> cancelled the contract <strong>${escapeHtml(args.contractTitle)}</strong>. No further action is required from you.</p>
      `,
      ctaLabel: 'Open conversation',
      ctaHref: contractCtaHref(args.conversationId),
      accentFrom: '#dc2626',
      accentTo: '#ef4444',
    }),
  };
}

export function tContractCancelledToAdmin(args: {
  name: string;
  contractTitle: string;
  creatorName: string;
}): RenderedEmail {
  return {
    subject: `Contract cancelled: "${args.contractTitle}"`,
    html: shell({
      heading: 'Contract cancelled',
      greetingName: args.name,
      bodyHtml: `
        <p><strong>${escapeHtml(args.creatorName)}</strong> cancelled their contract <strong>${escapeHtml(args.contractTitle)}</strong>.</p>
      `,
      accentFrom: '#dc2626',
      accentTo: '#ef4444',
    }),
  };
}

export function tContractRevisionRequestedToParty(args: {
  recipientName: string;
  contractTitle: string;
  requesterName: string;
  conversationId: string;
}): RenderedEmail {
  return {
    subject: `Revision requested on "${args.contractTitle}"`,
    html: shell({
      heading: 'Revision requested',
      greetingName: args.recipientName,
      bodyHtml: `
        <p><strong>${escapeHtml(args.requesterName)}</strong> reviewed the contract <strong>${escapeHtml(args.contractTitle)}</strong> and would like changes before signing.</p>
        <p>Update the terms and submit a new revision when ready.</p>
      `,
      ctaLabel: 'Open contract',
      ctaHref: contractCtaHref(args.conversationId),
      accentFrom: '#ea580c',
      accentTo: '#f97316',
    }),
  };
}

export function tContractRevisionRequestedToAdmin(args: {
  name: string;
  contractTitle: string;
  requesterName: string;
}): RenderedEmail {
  return {
    subject: `Revision requested: "${args.contractTitle}"`,
    html: shell({
      heading: 'Contract revision requested',
      greetingName: args.name,
      bodyHtml: `
        <p><strong>${escapeHtml(args.requesterName)}</strong> requested changes on contract <strong>${escapeHtml(args.contractTitle)}</strong>.</p>
      `,
      accentFrom: '#ea580c',
      accentTo: '#f97316',
    }),
  };
}

export function tContractRevisionSubmittedToParty(args: {
  recipientName: string;
  contractTitle: string;
  submitterName: string;
  conversationId: string;
}): RenderedEmail {
  return {
    subject: `New revision on "${args.contractTitle}"`,
    html: shell({
      heading: 'New contract revision',
      greetingName: args.recipientName,
      bodyHtml: `
        <p><strong>${escapeHtml(args.submitterName)}</strong> submitted an updated version of the contract <strong>${escapeHtml(args.contractTitle)}</strong>.</p>
        <p>Review the new terms and sign if you're happy with them.</p>
      `,
      ctaLabel: 'Review revision',
      ctaHref: contractCtaHref(args.conversationId),
    }),
  };
}

export function tContractRevisionSubmittedToAdmin(args: {
  name: string;
  contractTitle: string;
  submitterName: string;
}): RenderedEmail {
  return {
    subject: `Contract revision submitted: "${args.contractTitle}"`,
    html: shell({
      heading: 'Contract revision submitted',
      greetingName: args.name,
      bodyHtml: `
        <p><strong>${escapeHtml(args.submitterName)}</strong> submitted a new revision of contract <strong>${escapeHtml(args.contractTitle)}</strong>.</p>
      `,
    }),
  };
}

export function tContractPaidToClient(args: {
  recipientName: string;
  contractTitle: string;
  amount: string;
  conversationId: string;
}): RenderedEmail {
  return {
    subject: `Payment confirmed: "${args.contractTitle}"`,
    html: shell({
      heading: 'Payment confirmed',
      greetingName: args.recipientName,
      bodyHtml: `
        <p>Your payment of <strong>${escapeHtml(args.amount)}</strong> for the contract <strong>${escapeHtml(args.contractTitle)}</strong> has been received.</p>
        <p>Funds are held by the platform and will be released to the freelancer once the work is complete.</p>
      `,
      ctaLabel: 'Open contract',
      ctaHref: contractCtaHref(args.conversationId),
      accentFrom: '#16a34a',
      accentTo: '#22c55e',
    }),
  };
}

export function tContractPaidToFreelancer(args: {
  recipientName: string;
  contractTitle: string;
  amount: string;
  conversationId: string;
}): RenderedEmail {
  return {
    subject: `Contract funded: "${args.contractTitle}"`,
    html: shell({
      heading: 'Contract funded',
      greetingName: args.recipientName,
      bodyHtml: `
        <p>The client paid <strong>${escapeHtml(args.amount)}</strong> for the contract <strong>${escapeHtml(args.contractTitle)}</strong>. Funds are held by the platform and will be released to your Connect account once the work is complete.</p>
      `,
      ctaLabel: 'Open contract',
      ctaHref: contractCtaHref(args.conversationId),
      accentFrom: '#16a34a',
      accentTo: '#22c55e',
    }),
  };
}

export function tContractPaidToAdmin(args: {
  name: string;
  contractTitle: string;
  amount: string;
  clientName: string;
  freelancerName: string;
}): RenderedEmail {
  return {
    subject: `Contract paid: "${args.contractTitle}"`,
    html: shell({
      heading: 'Contract paid',
      greetingName: args.name,
      bodyHtml: `
        <p><strong>${escapeHtml(args.clientName)}</strong> paid <strong>${escapeHtml(args.amount)}</strong> for the contract <strong>${escapeHtml(args.contractTitle)}</strong> with <strong>${escapeHtml(args.freelancerName)}</strong>.</p>
      `,
      accentFrom: '#16a34a',
      accentTo: '#22c55e',
    }),
  };
}

export function tContractDisputedToParty(args: {
  recipientName: string;
  contractTitle: string;
  conversationId: string;
  reason: string;
  raisedByYou: boolean;
}): RenderedEmail {
  const lead = args.raisedByYou
    ? `We've recorded your dispute on <strong>${escapeHtml(args.contractTitle)}</strong>. The escrow is frozen and our team will reach out to both sides before resolving it.`
    : `The other party opened a dispute on <strong>${escapeHtml(args.contractTitle)}</strong>. Their reason:`;
  const body = args.raisedByYou
    ? `<p>${lead}</p>`
    : `
        <p>${lead}</p>
        <p style="background:#fef2f2;border-left:3px solid #dc2626;padding:10px 14px;margin:14px 0;white-space:pre-wrap;">
          ${escapeHtml(args.reason)}
        </p>
        <p>The contract is now under admin review. Funds remain in escrow until the dispute is resolved.</p>
      `;
  return {
    subject: `Dispute opened on contract "${args.contractTitle}"`,
    html: shell({
      heading: 'Dispute opened',
      greetingName: args.recipientName,
      bodyHtml: body,
      ctaLabel: 'Open contract',
      ctaHref: contractCtaHref(args.conversationId),
      accentFrom: '#dc2626',
      accentTo: '#ef4444',
    }),
  };
}

export function tContractDisputedToAdmin(args: {
  name: string;
  contractTitle: string;
  contractOrderId: string;
  raisedByName: string;
  clientName: string;
  freelancerName: string;
  reason: string;
}): RenderedEmail {
  return {
    subject: `Contract dispute opened: "${args.contractTitle}"`,
    html: shell({
      heading: 'Contract dispute needs review',
      greetingName: args.name,
      bodyHtml: `
        <p><strong>${escapeHtml(args.raisedByName)}</strong> opened a dispute on contract order <code>${escapeHtml(args.contractOrderId)}</code> (<strong>${escapeHtml(args.contractTitle)}</strong>) between client <strong>${escapeHtml(args.clientName)}</strong> and freelancer <strong>${escapeHtml(args.freelancerName)}</strong>.</p>
        <p style="background:#fef2f2;border-left:3px solid #dc2626;padding:10px 14px;margin:14px 0;white-space:pre-wrap;">
          ${escapeHtml(args.reason)}
        </p>
      `,
      ctaLabel: 'Review in admin',
      ctaHref: appLink('/admin/contract-disputes'),
      accentFrom: '#dc2626',
      accentTo: '#ef4444',
    }),
  };
}

export function tContractDisputeResolvedToClient(args: {
  recipientName: string;
  contractTitle: string;
  conversationId: string;
  resolution: 'refund_client' | 'pay_freelancer' | 'split';
}): RenderedEmail {
  const summaries: Record<typeof args.resolution, string> = {
    refund_client: `The admin team decided to refund you in full for <strong>${escapeHtml(args.contractTitle)}</strong>.`,
    pay_freelancer: `The admin team decided in favor of the freelancer on <strong>${escapeHtml(args.contractTitle)}</strong>; the contract will complete and funds will be released to the freelancer.`,
    split: `The admin team resolved <strong>${escapeHtml(args.contractTitle)}</strong> with a partial refund to you and a partial payout to the freelancer.`,
  };
  return {
    subject: `Contract dispute resolved: "${args.contractTitle}"`,
    html: shell({
      heading: 'Dispute resolved',
      greetingName: args.recipientName,
      bodyHtml: `<p>${summaries[args.resolution]}</p>`,
      ctaLabel: 'Open contract',
      ctaHref: contractCtaHref(args.conversationId),
    }),
  };
}

export function tContractDisputeResolvedToFreelancer(args: {
  recipientName: string;
  contractTitle: string;
  conversationId: string;
  resolution: 'refund_client' | 'pay_freelancer' | 'split';
}): RenderedEmail {
  const summaries: Record<typeof args.resolution, string> = {
    refund_client: `The admin team decided to refund the client in full for <strong>${escapeHtml(args.contractTitle)}</strong>. No payout will be issued for this contract.`,
    pay_freelancer: `The admin team decided in your favor on <strong>${escapeHtml(args.contractTitle)}</strong>. The full payout is being transferred to your Connect account.`,
    split: `The admin team resolved <strong>${escapeHtml(args.contractTitle)}</strong> with a partial refund to the client. A partial payout is being transferred to your Connect account.`,
  };
  return {
    subject: `Contract dispute resolved: "${args.contractTitle}"`,
    html: shell({
      heading: 'Dispute resolved',
      greetingName: args.recipientName,
      bodyHtml: `<p>${summaries[args.resolution]}</p>`,
      ctaLabel: 'Open contract',
      ctaHref: contractCtaHref(args.conversationId),
    }),
  };
}

export function tContractDisputeResolvedToAdmin(args: {
  name: string;
  contractTitle: string;
  contractOrderId: string;
  resolution: 'refund_client' | 'pay_freelancer' | 'split';
}): RenderedEmail {
  return {
    subject: `Contract dispute resolved: "${args.contractTitle}"`,
    html: shell({
      heading: 'Contract dispute resolved',
      greetingName: args.name,
      bodyHtml: `
        <p>Dispute on contract order <code>${escapeHtml(args.contractOrderId)}</code> (<strong>${escapeHtml(args.contractTitle)}</strong>) has been resolved as <strong>${escapeHtml(args.resolution)}</strong>.</p>
      `,
    }),
  };
}

// -------- Chat messages --------

export function tNewChatMessage(args: {
  recipientName: string;
  senderName: string;
  preview: string;
  hasAttachments: boolean;
  conversationId: string;
}): RenderedEmail {
  const trimmedPreview = args.preview.length > 280
    ? `${args.preview.slice(0, 277)}...`
    : args.preview;
  const previewBlock = trimmedPreview
    ? `<blockquote style="background:#f8f9fb;border-left:3px solid #0072ff;padding:10px 14px;margin:14px 0;white-space:pre-wrap;font-style:italic;">
         ${escapeHtml(trimmedPreview)}
       </blockquote>`
    : '';
  const attachmentLine = args.hasAttachments
    ? `<p style="color:#666;font-size:13px;">(Includes one or more attachments.)</p>`
    : '';

  return {
    subject: `New message from ${args.senderName}`,
    html: shell({
      heading: 'You have a new message',
      greetingName: args.recipientName,
      bodyHtml: `
        <p><strong>${escapeHtml(args.senderName)}</strong> sent you a message:</p>
        ${previewBlock}
        ${attachmentLine}
        <p>Open Venejob to reply.</p>
      `,
      ctaLabel: 'Open chat',
      ctaHref: appLink(`/messages?c=${encodeURIComponent(args.conversationId)}`),
    }),
  };
}

export function tOrderDisputeResolvedToAdmin(args: {
  name: string;
  serviceTitle: string;
  orderId: string;
  resolution: 'refund_client' | 'pay_freelancer' | 'split';
}): RenderedEmail {
  return {
    subject: `Dispute resolved: "${args.serviceTitle}"`,
    html: shell({
      heading: 'Dispute resolved',
      greetingName: args.name,
      bodyHtml: `
        <p>Dispute on order <code>${escapeHtml(args.orderId)}</code> (<strong>${escapeHtml(args.serviceTitle)}</strong>) has been resolved as <strong>${escapeHtml(args.resolution)}</strong>.</p>
      `,
    }),
  };
}
