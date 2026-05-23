/**
 * High-level notification orchestrators for service-flow events.
 *
 * Each `notify*` function:
 *   - Looks up recipients (client, freelancer, admins) from the DB.
 *   - Builds the appropriate template per recipient.
 *   - Sends the emails in parallel via Promise.allSettled.
 *   - NEVER throws — failures are logged but swallowed so API routes are
 *     never broken by a Brevo outage or missing user row.
 *
 * Callers should `await` the orchestrator so the email actually fires
 * before the serverless function returns (otherwise Vercel terminates
 * the runtime mid-fetch). The internal allSettled keeps the latency hit
 * to one round-trip max.
 */

import { sendEmail } from './client';
import { isUserOnline } from './presence';
import {
  formatMoney,
  getAdminContacts,
  getContractContext,
  getConversationRecipient,
  getOrderContext,
  getServiceContext,
  getUserContact,
  type ContractContext,
  type UserContact,
} from './recipients';
import {
  tOrderAcceptedToAdmin,
  tOrderAcceptedToClient,
  tOrderAcceptedToFreelancer,
  tOrderCancelledToAdmin,
  tOrderCancelledToClient,
  tOrderCancelledToFreelancer,
  tOrderCompletedToFreelancer,
  tOrderDeliveredToAdmin,
  tOrderDeliveredToClient,
  tOrderDeliveredToFreelancer,
  tOrderDisputeResolvedToAdmin,
  tOrderDisputeResolvedToClient,
  tOrderDisputeResolvedToFreelancer,
  tOrderDisputedToAdmin,
  tOrderDisputedToClient,
  tOrderDisputedToFreelancer,
  tOrderPaidToAdmin,
  tOrderPaidToClient,
  tOrderPaidToFreelancer,
  tOrderRefundedToAdmin,
  tOrderRefundedToClient,
  tOrderRevisionRequestedToAdmin,
  tOrderRevisionRequestedToClient,
  tOrderRevisionRequestedToFreelancer,
  tServiceApprovedToAdmin,
  tServiceApprovedToFreelancer,
  tServiceRejectedToAdmin,
  tServiceRejectedToFreelancer,
  tServiceSubmittedToAdmin,
  tServiceSubmittedToFreelancer,
  tNewChatMessage,
  tContractAcceptedToAdmin,
  tContractAcceptedToParty,
  tContractCancelledToAdmin,
  tContractCancelledToParty,
  tContractDeclinedToAdmin,
  tContractDeclinedToParty,
  tContractDisputedToParty,
  tContractDisputedToAdmin,
  tContractDisputeResolvedToClient,
  tContractDisputeResolvedToFreelancer,
  tContractDisputeResolvedToAdmin,
  tContractPaidToAdmin,
  tContractPaidToClient,
  tContractPaidToFreelancer,
  tContractRevisionRequestedToAdmin,
  tContractRevisionRequestedToParty,
  tContractRevisionSubmittedToAdmin,
  tContractRevisionSubmittedToParty,
  tContractSignedAwaitingOther,
  tContractSubmittedToAdmin,
  tContractSubmittedToParty,
  type RenderedEmail,
} from './templates';

function displayName(c: { name: string; lastname: string | null }): string {
  return c.lastname ? `${c.name} ${c.lastname}` : c.name;
}

interface OneShot {
  contact: UserContact;
  email: RenderedEmail;
}

async function dispatch(label: string, jobs: OneShot[]): Promise<void> {
  if (jobs.length === 0) return;
  const settled = await Promise.allSettled(
    jobs.map((j) =>
      sendEmail({
        to: [{ email: j.contact.email, name: displayName(j.contact) }],
        subject: j.email.subject,
        html: j.email.html,
      }),
    ),
  );
  settled.forEach((result, idx) => {
    if (result.status === 'rejected') {
      console.error(
        `[email] ${label} send failed for ${jobs[idx].contact.email}:`,
        result.reason,
      );
    }
  });
}

/**
 * Wraps an orchestrator so a thrown error (e.g. DB lookup failure) is
 * logged but never propagates. Use everywhere this module is invoked
 * from an API route.
 *
 * Emits a `[email] <label> starting`/`done` pair so dev-mode logs make
 * it obvious whether the notify was even reached. Without these,
 * silent early-returns (lookup found nothing) and silent successes
 * (Brevo accepted) look identical from the outside.
 */
async function safe(label: string, fn: () => Promise<void>): Promise<void> {
  console.info(`[email] ${label} starting`);
  try {
    await fn();
    console.info(`[email] ${label} done`);
  } catch (err) {
    console.error(`[email] ${label} failed:`, err);
  }
}

// -------- Service lifecycle --------

export async function notifyServiceSubmitted(serviceId: string): Promise<void> {
  return safe('notifyServiceSubmitted', async () => {
    const [ctx, admins] = await Promise.all([
      getServiceContext(serviceId),
      getAdminContacts(),
    ]);
    if (!ctx) return;
    const freelancerName = displayName(ctx.freelancer);
    const jobs: OneShot[] = [
      {
        contact: ctx.freelancer,
        email: tServiceSubmittedToFreelancer({
          name: ctx.freelancer.name,
          serviceTitle: ctx.title,
        }),
      },
      ...admins.map((a) => ({
        contact: a,
        email: tServiceSubmittedToAdmin({
          name: a.name,
          serviceTitle: ctx.title,
          freelancerName,
          serviceId: ctx.id,
        }),
      })),
    ];
    await dispatch('serviceSubmitted', jobs);
  });
}

export async function notifyServiceApproved(serviceId: string): Promise<void> {
  return safe('notifyServiceApproved', async () => {
    const [ctx, admins] = await Promise.all([
      getServiceContext(serviceId),
      getAdminContacts(),
    ]);
    if (!ctx) return;
    const freelancerName = displayName(ctx.freelancer);
    const jobs: OneShot[] = [
      {
        contact: ctx.freelancer,
        email: tServiceApprovedToFreelancer({
          name: ctx.freelancer.name,
          serviceTitle: ctx.title,
          serviceId: ctx.id,
        }),
      },
      ...admins.map((a) => ({
        contact: a,
        email: tServiceApprovedToAdmin({
          name: a.name,
          serviceTitle: ctx.title,
          freelancerName,
        }),
      })),
    ];
    await dispatch('serviceApproved', jobs);
  });
}

export async function notifyServiceRejected(
  serviceId: string,
  reason: string,
): Promise<void> {
  return safe('notifyServiceRejected', async () => {
    const [ctx, admins] = await Promise.all([
      getServiceContext(serviceId),
      getAdminContacts(),
    ]);
    if (!ctx) return;
    const freelancerName = displayName(ctx.freelancer);
    const jobs: OneShot[] = [
      {
        contact: ctx.freelancer,
        email: tServiceRejectedToFreelancer({
          name: ctx.freelancer.name,
          serviceTitle: ctx.title,
          serviceId: ctx.id,
          reason,
        }),
      },
      ...admins.map((a) => ({
        contact: a,
        email: tServiceRejectedToAdmin({
          name: a.name,
          serviceTitle: ctx.title,
          freelancerName,
          reason,
        }),
      })),
    ];
    await dispatch('serviceRejected', jobs);
  });
}

// -------- Order lifecycle --------

export async function notifyOrderPaid(orderId: string): Promise<void> {
  return safe('notifyOrderPaid', async () => {
    const [ctx, admins] = await Promise.all([
      getOrderContext(orderId),
      getAdminContacts(),
    ]);
    if (!ctx) return;
    const clientName = displayName(ctx.client);
    const freelancerName = displayName(ctx.freelancer);
    const amount = formatMoney(ctx.basePrice, ctx.currency);
    const jobs: OneShot[] = [
      {
        contact: ctx.client,
        email: tOrderPaidToClient({
          name: ctx.client.name,
          serviceTitle: ctx.service.title,
          orderId: ctx.id,
          amount,
        }),
      },
      {
        contact: ctx.freelancer,
        email: tOrderPaidToFreelancer({
          name: ctx.freelancer.name,
          serviceTitle: ctx.service.title,
          orderId: ctx.id,
          clientName,
        }),
      },
      ...admins.map((a) => ({
        contact: a,
        email: tOrderPaidToAdmin({
          name: a.name,
          serviceTitle: ctx.service.title,
          clientName,
          freelancerName,
          amount,
          orderId: ctx.id,
        }),
      })),
    ];
    await dispatch('orderPaid', jobs);
  });
}

export async function notifyOrderDelivered(orderId: string): Promise<void> {
  return safe('notifyOrderDelivered', async () => {
    const [ctx, admins] = await Promise.all([
      getOrderContext(orderId),
      getAdminContacts(),
    ]);
    if (!ctx) return;
    const clientName = displayName(ctx.client);
    const freelancerName = displayName(ctx.freelancer);
    const jobs: OneShot[] = [
      {
        contact: ctx.client,
        email: tOrderDeliveredToClient({
          name: ctx.client.name,
          serviceTitle: ctx.service.title,
          orderId: ctx.id,
        }),
      },
      {
        contact: ctx.freelancer,
        email: tOrderDeliveredToFreelancer({
          name: ctx.freelancer.name,
          serviceTitle: ctx.service.title,
          orderId: ctx.id,
        }),
      },
      ...admins.map((a) => ({
        contact: a,
        email: tOrderDeliveredToAdmin({
          name: a.name,
          serviceTitle: ctx.service.title,
          freelancerName,
          clientName,
          orderId: ctx.id,
        }),
      })),
    ];
    await dispatch('orderDelivered', jobs);
  });
}

export async function notifyOrderAccepted(
  orderId: string,
  options: { auto: boolean },
): Promise<void> {
  return safe('notifyOrderAccepted', async () => {
    const [ctx, admins] = await Promise.all([
      getOrderContext(orderId),
      getAdminContacts(),
    ]);
    if (!ctx) return;
    const clientName = displayName(ctx.client);
    const freelancerName = displayName(ctx.freelancer);
    const jobs: OneShot[] = [
      {
        contact: ctx.client,
        email: tOrderAcceptedToClient({
          name: ctx.client.name,
          serviceTitle: ctx.service.title,
          orderId: ctx.id,
          auto: options.auto,
        }),
      },
      {
        contact: ctx.freelancer,
        email: tOrderAcceptedToFreelancer({
          name: ctx.freelancer.name,
          serviceTitle: ctx.service.title,
          orderId: ctx.id,
          auto: options.auto,
        }),
      },
      ...admins.map((a) => ({
        contact: a,
        email: tOrderAcceptedToAdmin({
          name: a.name,
          serviceTitle: ctx.service.title,
          clientName,
          freelancerName,
          orderId: ctx.id,
          auto: options.auto,
        }),
      })),
    ];
    await dispatch('orderAccepted', jobs);
  });
}

export async function notifyOrderCompleted(orderId: string): Promise<void> {
  return safe('notifyOrderCompleted', async () => {
    const ctx = await getOrderContext(orderId);
    if (!ctx) return;
    const jobs: OneShot[] = [
      {
        contact: ctx.freelancer,
        email: tOrderCompletedToFreelancer({
          name: ctx.freelancer.name,
          serviceTitle: ctx.service.title,
          orderId: ctx.id,
        }),
      },
    ];
    await dispatch('orderCompleted', jobs);
  });
}

export async function notifyOrderRevisionRequested(
  orderId: string,
  message: string,
): Promise<void> {
  return safe('notifyOrderRevisionRequested', async () => {
    const [ctx, admins] = await Promise.all([
      getOrderContext(orderId),
      getAdminContacts(),
    ]);
    if (!ctx) return;
    const clientName = displayName(ctx.client);
    const jobs: OneShot[] = [
      {
        contact: ctx.client,
        email: tOrderRevisionRequestedToClient({
          name: ctx.client.name,
          serviceTitle: ctx.service.title,
          orderId: ctx.id,
        }),
      },
      {
        contact: ctx.freelancer,
        email: tOrderRevisionRequestedToFreelancer({
          name: ctx.freelancer.name,
          serviceTitle: ctx.service.title,
          orderId: ctx.id,
          message,
        }),
      },
      ...admins.map((a) => ({
        contact: a,
        email: tOrderRevisionRequestedToAdmin({
          name: a.name,
          serviceTitle: ctx.service.title,
          clientName,
          orderId: ctx.id,
        }),
      })),
    ];
    await dispatch('orderRevisionRequested', jobs);
  });
}

export async function notifyOrderCancelled(orderId: string): Promise<void> {
  return safe('notifyOrderCancelled', async () => {
    const [ctx, admins] = await Promise.all([
      getOrderContext(orderId),
      getAdminContacts(),
    ]);
    if (!ctx) return;
    const clientName = displayName(ctx.client);
    const freelancerName = displayName(ctx.freelancer);
    const jobs: OneShot[] = [
      {
        contact: ctx.client,
        email: tOrderCancelledToClient({
          name: ctx.client.name,
          serviceTitle: ctx.service.title,
          orderId: ctx.id,
        }),
      },
      {
        contact: ctx.freelancer,
        email: tOrderCancelledToFreelancer({
          name: ctx.freelancer.name,
          serviceTitle: ctx.service.title,
          orderId: ctx.id,
        }),
      },
      ...admins.map((a) => ({
        contact: a,
        email: tOrderCancelledToAdmin({
          name: a.name,
          serviceTitle: ctx.service.title,
          clientName,
          freelancerName,
          orderId: ctx.id,
        }),
      })),
    ];
    await dispatch('orderCancelled', jobs);
  });
}

export async function notifyOrderRefunded(orderId: string): Promise<void> {
  return safe('notifyOrderRefunded', async () => {
    const [ctx, admins] = await Promise.all([
      getOrderContext(orderId),
      getAdminContacts(),
    ]);
    if (!ctx) return;
    const jobs: OneShot[] = [
      {
        contact: ctx.client,
        email: tOrderRefundedToClient({
          name: ctx.client.name,
          serviceTitle: ctx.service.title,
          orderId: ctx.id,
        }),
      },
      ...admins.map((a) => ({
        contact: a,
        email: tOrderRefundedToAdmin({
          name: a.name,
          serviceTitle: ctx.service.title,
          orderId: ctx.id,
        }),
      })),
    ];
    await dispatch('orderRefunded', jobs);
  });
}

export async function notifyOrderDisputed(
  orderId: string,
  reason: string,
): Promise<void> {
  return safe('notifyOrderDisputed', async () => {
    const [ctx, admins] = await Promise.all([
      getOrderContext(orderId),
      getAdminContacts(),
    ]);
    if (!ctx) return;
    const clientName = displayName(ctx.client);
    const freelancerName = displayName(ctx.freelancer);
    const jobs: OneShot[] = [
      {
        contact: ctx.client,
        email: tOrderDisputedToClient({
          name: ctx.client.name,
          serviceTitle: ctx.service.title,
          orderId: ctx.id,
        }),
      },
      {
        contact: ctx.freelancer,
        email: tOrderDisputedToFreelancer({
          name: ctx.freelancer.name,
          serviceTitle: ctx.service.title,
          orderId: ctx.id,
          reason,
        }),
      },
      ...admins.map((a) => ({
        contact: a,
        email: tOrderDisputedToAdmin({
          name: a.name,
          serviceTitle: ctx.service.title,
          clientName,
          freelancerName,
          orderId: ctx.id,
          reason,
        }),
      })),
    ];
    await dispatch('orderDisputed', jobs);
  });
}

export async function notifyOrderDisputeResolved(
  orderId: string,
  resolution: 'refund_client' | 'pay_freelancer' | 'split',
): Promise<void> {
  return safe('notifyOrderDisputeResolved', async () => {
    const [ctx, admins] = await Promise.all([
      getOrderContext(orderId),
      getAdminContacts(),
    ]);
    if (!ctx) return;
    const jobs: OneShot[] = [
      {
        contact: ctx.client,
        email: tOrderDisputeResolvedToClient({
          name: ctx.client.name,
          serviceTitle: ctx.service.title,
          orderId: ctx.id,
          resolution,
        }),
      },
      {
        contact: ctx.freelancer,
        email: tOrderDisputeResolvedToFreelancer({
          name: ctx.freelancer.name,
          serviceTitle: ctx.service.title,
          orderId: ctx.id,
          resolution,
        }),
      },
      ...admins.map((a) => ({
        contact: a,
        email: tOrderDisputeResolvedToAdmin({
          name: a.name,
          serviceTitle: ctx.service.title,
          orderId: ctx.id,
          resolution,
        }),
      })),
    ];
    await dispatch('orderDisputeResolved', jobs);
  });
}

// -------- Contracts --------

/** The contract participant who is NOT the given actor. */
function otherParty(ctx: ContractContext, actorId: number): UserContact {
  return ctx.client.id === actorId ? ctx.freelancer : ctx.client;
}

export async function notifyContractSubmitted(
  contractId: string,
  submitterId: number,
): Promise<void> {
  return safe('contractSubmitted', async () => {
    const [ctx, admins] = await Promise.all([
      getContractContext(contractId),
      getAdminContacts(),
    ]);
    if (!ctx) return;
    const submitter = ctx.client.id === submitterId ? ctx.client : ctx.freelancer;
    const recipient = otherParty(ctx, submitterId);
    const submitterName = displayName(submitter);
    const recipientName = displayName(recipient);

    const jobs: OneShot[] = [
      {
        contact: recipient,
        email: tContractSubmittedToParty({
          recipientName: recipient.name,
          contractTitle: ctx.title,
          senderName: submitterName,
          conversationId: ctx.conversationId,
        }),
      },
      ...admins.map((a) => ({
        contact: a,
        email: tContractSubmittedToAdmin({
          name: a.name,
          contractTitle: ctx.title,
          senderName: submitterName,
          recipientName,
        }),
      })),
    ];
    await dispatch('contractSubmitted', jobs);
  });
}

/**
 * Called after a sign event. Two cases:
 *   - contract.status === 'accepted' (now fully signed): email both
 *     parties + admins with the "contract active" message.
 *   - otherwise (first signature recorded, awaiting countersignature):
 *     email the OTHER party with "your signature needed".
 */
export async function notifyContractSigned(
  contractId: string,
  signerId: number,
): Promise<void> {
  return safe('contractSigned', async () => {
    const [ctx, admins] = await Promise.all([
      getContractContext(contractId),
      getAdminContacts(),
    ]);
    if (!ctx) return;

    if (ctx.status === 'accepted') {
      const clientName = displayName(ctx.client);
      const freelancerName = displayName(ctx.freelancer);
      const jobs: OneShot[] = [
        {
          contact: ctx.client,
          email: tContractAcceptedToParty({
            recipientName: ctx.client.name,
            contractTitle: ctx.title,
            conversationId: ctx.conversationId,
          }),
        },
        {
          contact: ctx.freelancer,
          email: tContractAcceptedToParty({
            recipientName: ctx.freelancer.name,
            contractTitle: ctx.title,
            conversationId: ctx.conversationId,
          }),
        },
        ...admins.map((a) => ({
          contact: a,
          email: tContractAcceptedToAdmin({
            name: a.name,
            contractTitle: ctx.title,
            clientName,
            freelancerName,
          }),
        })),
      ];
      await dispatch('contractAccepted', jobs);
      return;
    }

    const signer = ctx.client.id === signerId ? ctx.client : ctx.freelancer;
    const recipient = otherParty(ctx, signerId);
    const jobs: OneShot[] = [
      {
        contact: recipient,
        email: tContractSignedAwaitingOther({
          recipientName: recipient.name,
          contractTitle: ctx.title,
          signerName: displayName(signer),
          conversationId: ctx.conversationId,
        }),
      },
    ];
    await dispatch('contractSignedAwaiting', jobs);
  });
}

export async function notifyContractDeclined(
  contractId: string,
  declinerId: number,
): Promise<void> {
  return safe('contractDeclined', async () => {
    const [ctx, admins] = await Promise.all([
      getContractContext(contractId),
      getAdminContacts(),
    ]);
    if (!ctx) return;
    const decliner = ctx.client.id === declinerId ? ctx.client : ctx.freelancer;
    const recipient = otherParty(ctx, declinerId);
    const declinerName = displayName(decliner);

    const jobs: OneShot[] = [
      {
        contact: recipient,
        email: tContractDeclinedToParty({
          recipientName: recipient.name,
          contractTitle: ctx.title,
          declinerName,
          conversationId: ctx.conversationId,
        }),
      },
      ...admins.map((a) => ({
        contact: a,
        email: tContractDeclinedToAdmin({
          name: a.name,
          contractTitle: ctx.title,
          declinerName,
        }),
      })),
    ];
    await dispatch('contractDeclined', jobs);
  });
}

export async function notifyContractCancelled(
  contractId: string,
): Promise<void> {
  return safe('contractCancelled', async () => {
    const [ctx, admins] = await Promise.all([
      getContractContext(contractId),
      getAdminContacts(),
    ]);
    if (!ctx) return;
    const creator = ctx.client.id === ctx.createdBy ? ctx.client : ctx.freelancer;
    const recipient = otherParty(ctx, ctx.createdBy);
    const creatorName = displayName(creator);

    const jobs: OneShot[] = [
      {
        contact: recipient,
        email: tContractCancelledToParty({
          recipientName: recipient.name,
          contractTitle: ctx.title,
          creatorName,
          conversationId: ctx.conversationId,
        }),
      },
      ...admins.map((a) => ({
        contact: a,
        email: tContractCancelledToAdmin({
          name: a.name,
          contractTitle: ctx.title,
          creatorName,
        }),
      })),
    ];
    await dispatch('contractCancelled', jobs);
  });
}

export async function notifyContractRevisionRequested(
  contractId: string,
  requesterId: number,
): Promise<void> {
  return safe('contractRevisionRequested', async () => {
    const [ctx, admins] = await Promise.all([
      getContractContext(contractId),
      getAdminContacts(),
    ]);
    if (!ctx) return;
    const requester = ctx.client.id === requesterId ? ctx.client : ctx.freelancer;
    const recipient = otherParty(ctx, requesterId);
    const requesterName = displayName(requester);

    const jobs: OneShot[] = [
      {
        contact: recipient,
        email: tContractRevisionRequestedToParty({
          recipientName: recipient.name,
          contractTitle: ctx.title,
          requesterName,
          conversationId: ctx.conversationId,
        }),
      },
      ...admins.map((a) => ({
        contact: a,
        email: tContractRevisionRequestedToAdmin({
          name: a.name,
          contractTitle: ctx.title,
          requesterName,
        }),
      })),
    ];
    await dispatch('contractRevisionRequested', jobs);
  });
}

export async function notifyContractRevisionSubmitted(
  contractId: string,
  submitterId: number,
): Promise<void> {
  return safe('contractRevisionSubmitted', async () => {
    const [ctx, admins] = await Promise.all([
      getContractContext(contractId),
      getAdminContacts(),
    ]);
    if (!ctx) return;
    const submitter = ctx.client.id === submitterId ? ctx.client : ctx.freelancer;
    const recipient = otherParty(ctx, submitterId);
    const submitterName = displayName(submitter);

    const jobs: OneShot[] = [
      {
        contact: recipient,
        email: tContractRevisionSubmittedToParty({
          recipientName: recipient.name,
          contractTitle: ctx.title,
          submitterName,
          conversationId: ctx.conversationId,
        }),
      },
      ...admins.map((a) => ({
        contact: a,
        email: tContractRevisionSubmittedToAdmin({
          name: a.name,
          contractTitle: ctx.title,
          submitterName,
        }),
      })),
    ];
    await dispatch('contractRevisionSubmitted', jobs);
  });
}

/**
 * Fired after a successful contract checkout (handleContractCheckout in
 * the Stripe webhook). Amount is in the smallest currency unit and is
 * passed in directly so the orchestrator doesn't need to re-fetch the
 * contract_orders row.
 */
export async function notifyContractPaid(
  contractId: string,
  amount: number,
  currency: string,
): Promise<void> {
  return safe('contractPaid', async () => {
    const [ctx, admins] = await Promise.all([
      getContractContext(contractId),
      getAdminContacts(),
    ]);
    if (!ctx) return;
    const amountStr = formatMoney(amount, currency);
    const clientName = displayName(ctx.client);
    const freelancerName = displayName(ctx.freelancer);

    const jobs: OneShot[] = [
      {
        contact: ctx.client,
        email: tContractPaidToClient({
          recipientName: ctx.client.name,
          contractTitle: ctx.title,
          amount: amountStr,
          conversationId: ctx.conversationId,
        }),
      },
      {
        contact: ctx.freelancer,
        email: tContractPaidToFreelancer({
          recipientName: ctx.freelancer.name,
          contractTitle: ctx.title,
          amount: amountStr,
          conversationId: ctx.conversationId,
        }),
      },
      ...admins.map((a) => ({
        contact: a,
        email: tContractPaidToAdmin({
          name: a.name,
          contractTitle: ctx.title,
          amount: amountStr,
          clientName,
          freelancerName,
        }),
      })),
    ];
    await dispatch('contractPaid', jobs);
  });
}

export async function notifyContractDisputed(
  contractId: string,
  raisedById: number,
  reason: string,
): Promise<void> {
  return safe('notifyContractDisputed', async () => {
    const [ctx, admins] = await Promise.all([
      getContractContext(contractId),
      getAdminContacts(),
    ]);
    if (!ctx) return;

    const raisedByContact = ctx.client.id === raisedById ? ctx.client : ctx.freelancer;
    const raisedByName = displayName(raisedByContact);
    const clientName = displayName(ctx.client);
    const freelancerName = displayName(ctx.freelancer);

    const jobs: OneShot[] = [
      {
        contact: ctx.client,
        email: tContractDisputedToParty({
          recipientName: ctx.client.name,
          contractTitle: ctx.title,
          conversationId: ctx.conversationId,
          reason,
          raisedByYou: ctx.client.id === raisedById,
        }),
      },
      {
        contact: ctx.freelancer,
        email: tContractDisputedToParty({
          recipientName: ctx.freelancer.name,
          contractTitle: ctx.title,
          conversationId: ctx.conversationId,
          reason,
          raisedByYou: ctx.freelancer.id === raisedById,
        }),
      },
      ...admins.map((a) => ({
        contact: a,
        email: tContractDisputedToAdmin({
          name: a.name,
          contractTitle: ctx.title,
          contractOrderId: ctx.id,
          raisedByName,
          clientName,
          freelancerName,
          reason,
        }),
      })),
    ];
    await dispatch('contractDisputed', jobs);
  });
}

export async function notifyContractDisputeResolved(
  contractId: string,
  contractOrderId: string,
  resolution: 'refund_client' | 'pay_freelancer' | 'split',
): Promise<void> {
  return safe('notifyContractDisputeResolved', async () => {
    const [ctx, admins] = await Promise.all([
      getContractContext(contractId),
      getAdminContacts(),
    ]);
    if (!ctx) return;

    const jobs: OneShot[] = [
      {
        contact: ctx.client,
        email: tContractDisputeResolvedToClient({
          recipientName: ctx.client.name,
          contractTitle: ctx.title,
          conversationId: ctx.conversationId,
          resolution,
        }),
      },
      {
        contact: ctx.freelancer,
        email: tContractDisputeResolvedToFreelancer({
          recipientName: ctx.freelancer.name,
          contractTitle: ctx.title,
          conversationId: ctx.conversationId,
          resolution,
        }),
      },
      ...admins.map((a) => ({
        contact: a,
        email: tContractDisputeResolvedToAdmin({
          name: a.name,
          contractTitle: ctx.title,
          contractOrderId,
          resolution,
        }),
      })),
    ];
    await dispatch('contractDisputeResolved', jobs);
  });
}

// -------- Chat messages --------

/**
 * Emails the OTHER participant in a conversation when a new message
 * arrives — but ONLY if they have no active WebSocket connection. If
 * they're connected, real-time delivery handled by ws-server is enough.
 *
 * One email per message (no throttling). This is intentional per the
 * product choice: users only get emails when they aren't around, and
 * one-per-message gives full context when they return.
 */
export async function notifyChatMessage(args: {
  conversationId: string;
  senderId: number;
  body: string | null;
  hasAttachments: boolean;
}): Promise<void> {
  return safe('chatMessage', async () => {
    const [recipient, sender] = await Promise.all([
      getConversationRecipient(args.conversationId, args.senderId),
      getUserContact(args.senderId),
    ]);
    if (!recipient || !sender) return;

    if (await isUserOnline(recipient.id)) {
      console.info(`[email] chatMessage skipped — recipient ${recipient.id} is online`);
      return;
    }

    const job: OneShot = {
      contact: recipient,
      email: tNewChatMessage({
        recipientName: recipient.name,
        senderName: displayName(sender),
        preview: args.body ?? '',
        hasAttachments: args.hasAttachments,
        conversationId: args.conversationId,
      }),
    };
    await dispatch('chatMessage', [job]);
  });
}
