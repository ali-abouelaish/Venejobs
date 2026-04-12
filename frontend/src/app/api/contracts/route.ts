import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertConversationAccess } from '@/lib/assertions';
import { fetchFullContract } from '@/lib/contracts';

interface CreateContractBody {
  conversationId: string;
  title: string;
  scope: string;
  deliverables: string;
  price: number;
  currency: string;
  deadline: string;
  paymentTerms: string;
  additionalTerms?: string;
}

/** POST /api/contracts — create a new draft contract in a conversation */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CreateContractBody;
  try {
    body = (await req.json()) as CreateContractBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    conversationId,
    title,
    scope,
    deliverables,
    price,
    currency,
    deadline,
    paymentTerms,
    additionalTerms,
  } = body;

  if (!conversationId || !title?.trim() || !scope?.trim() || !deliverables?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!price || price <= 0) {
    return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 });
  }
  if (!currency?.trim() || !deadline?.trim() || !paymentTerms?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
    return NextResponse.json({ error: 'Deadline must be a valid future date' }, { status: 400 });
  }

  if (!(await assertConversationAccess(conversationId, session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const userId = session.user.id;

  const contractId = await sql.begin(async (txRaw) => {
    const tx = txRaw as unknown as typeof sql;

    const [contract] = await tx<{ id: string }[]>`
      INSERT INTO contracts (conversation_id, created_by, status)
      VALUES (${conversationId}::uuid, ${userId}, 'draft')
      RETURNING id::text
    `;

    const [revision] = await tx<{ id: string }[]>`
      INSERT INTO contract_revisions (
        contract_id, proposed_by, revision_number,
        title, scope, deliverables, price, currency,
        deadline, payment_terms, additional_terms, change_summary
      )
      VALUES (
        ${contract.id}::uuid, ${userId}, 1,
        ${title.trim()}, ${scope.trim()}, ${deliverables.trim()},
        ${price}, ${currency.trim()}, ${deadline},
        ${paymentTerms.trim()},
        ${additionalTerms?.trim() || null},
        ${'Initial contract'}
      )
      RETURNING id::text
    `;

    await tx`
      UPDATE contracts
      SET current_revision_id = ${revision.id}::uuid, updated_at = now()
      WHERE id = ${contract.id}::uuid
    `;

    return contract.id;
  });

  const fullContract = await fetchFullContract(contractId as unknown as string);
  if (!fullContract) {
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
  }

  return NextResponse.json({ contract: fullContract }, { status: 201 });
}
