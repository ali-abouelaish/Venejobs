import { NextRequest, NextResponse } from 'next/server';
import { alias } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { assertAdminAccess } from '@/lib/assertions';
import { db } from '@/lib/db/drizzle';
import {
  contractOrderDisputes,
  contractOrders,
} from '@/lib/db/schema/contracts';
import { contractRevisions, contracts, users } from '@/lib/db/schema';

/**
 * GET /api/admin/contract-disputes/:id — admin-only. Returns a single
 * contract-order dispute with the parent contract order, current
 * revision title, parties, and the conversation id (taken from the
 * contract) the admin will use to fetch the chat. Contract orders have
 * no deliveries table — the chat is the entire evidence trail.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await assertAdminAccess(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const clientUsers = alias(users, 'client_users');
  const freelancerUsers = alias(users, 'freelancer_users');
  const raisedByUsers = alias(users, 'raised_by_users');
  const resolvedByUsers = alias(users, 'resolved_by_users');

  const rows = await db
    .select({
      id: contractOrderDisputes.id,
      contractOrderId: contractOrderDisputes.contractOrderId,
      contractId: contractOrders.contractId,
      conversationId: contracts.conversationId,
      reason: contractOrderDisputes.reason,
      attachments: contractOrderDisputes.attachments,
      resolution: contractOrderDisputes.resolution,
      resolvedAt: contractOrderDisputes.resolvedAt,
      resolvedByName: resolvedByUsers.name,
      createdAt: contractOrderDisputes.createdAt,
      raisedById: contractOrderDisputes.raisedBy,
      raisedByName: raisedByUsers.name,
      orderState: contractOrders.state,
      amount: contractOrders.amount,
      currency: contractOrders.currency,
      deliveredAt: contractOrders.deliveredAt,
      acceptedAt: contractOrders.acceptedAt,
      contractTitle: contractRevisions.title,
      contractScope: contractRevisions.scope,
      contractDeliverables: contractRevisions.deliverables,
      clientId: contractOrders.clientId,
      clientName: clientUsers.name,
      freelancerId: contractOrders.freelancerId,
      freelancerName: freelancerUsers.name,
    })
    .from(contractOrderDisputes)
    .innerJoin(
      contractOrders,
      eq(contractOrders.id, contractOrderDisputes.contractOrderId),
    )
    .innerJoin(contracts, eq(contracts.id, contractOrders.contractId))
    .leftJoin(contractRevisions, eq(contractRevisions.id, contracts.currentRevisionId))
    .innerJoin(clientUsers, eq(clientUsers.id, contractOrders.clientId))
    .innerJoin(
      freelancerUsers,
      eq(freelancerUsers.id, contractOrders.freelancerId),
    )
    .innerJoin(raisedByUsers, eq(raisedByUsers.id, contractOrderDisputes.raisedBy))
    .leftJoin(
      resolvedByUsers,
      eq(resolvedByUsers.id, contractOrderDisputes.resolvedBy),
    )
    .where(eq(contractOrderDisputes.id, id))
    .limit(1);

  const dispute = rows[0];
  if (!dispute) {
    return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
  }

  return NextResponse.json({ dispute });
}
