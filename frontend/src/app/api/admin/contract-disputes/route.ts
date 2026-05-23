import { NextRequest, NextResponse } from 'next/server';
import { alias } from 'drizzle-orm/pg-core';
import { desc, eq, isNull } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { assertAdminAccess } from '@/lib/assertions';
import { db } from '@/lib/db/drizzle';
import {
  contractOrderDisputes,
  contractOrders,
} from '@/lib/db/schema/contracts';
import { users, contractRevisions, contracts } from '@/lib/db/schema';

/**
 * GET /api/admin/contract-disputes — admin-only. Lists contract-order
 * disputes. Defaults to open (resolution IS NULL); pass ?resolved=true
 * to include resolved ones.
 *
 * Mirrors GET /api/admin/disputes for service orders. Joins through the
 * contract's current revision to surface the title that admins recognise.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await assertAdminAccess(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const showResolved = req.nextUrl.searchParams.get('resolved') === 'true';

  const clientUsers = alias(users, 'client_users');
  const freelancerUsers = alias(users, 'freelancer_users');
  const raisedByUsers = alias(users, 'raised_by_users');

  const baseQuery = db
    .select({
      id: contractOrderDisputes.id,
      contractOrderId: contractOrderDisputes.contractOrderId,
      contractId: contractOrders.contractId,
      reason: contractOrderDisputes.reason,
      resolution: contractOrderDisputes.resolution,
      resolvedBy: contractOrderDisputes.resolvedBy,
      resolvedAt: contractOrderDisputes.resolvedAt,
      createdAt: contractOrderDisputes.createdAt,
      raisedById: contractOrderDisputes.raisedBy,
      raisedByName: raisedByUsers.name,
      orderState: contractOrders.state,
      amount: contractOrders.amount,
      currency: contractOrders.currency,
      contractTitle: contractRevisions.title,
      clientId: contractOrders.clientId,
      clientName: clientUsers.name,
      freelancerId: contractOrders.freelancerId,
      freelancerName: freelancerUsers.name,
    })
    .from(contractOrderDisputes)
    .innerJoin(contractOrders, eq(contractOrders.id, contractOrderDisputes.contractOrderId))
    .innerJoin(contracts, eq(contracts.id, contractOrders.contractId))
    .leftJoin(contractRevisions, eq(contractRevisions.id, contracts.currentRevisionId))
    .innerJoin(clientUsers, eq(clientUsers.id, contractOrders.clientId))
    .innerJoin(freelancerUsers, eq(freelancerUsers.id, contractOrders.freelancerId))
    .innerJoin(raisedByUsers, eq(raisedByUsers.id, contractOrderDisputes.raisedBy));

  const rows = showResolved
    ? await baseQuery.orderBy(desc(contractOrderDisputes.createdAt))
    : await baseQuery
        .where(isNull(contractOrderDisputes.resolution))
        .orderBy(desc(contractOrderDisputes.createdAt));

  return NextResponse.json(rows);
}
