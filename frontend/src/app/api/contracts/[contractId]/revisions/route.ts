import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertConversationAccess } from '@/lib/assertions';
import { fetchFullContract, broadcastContract } from '@/lib/contracts';

interface RevisionBody {
  title: string;
  scope: string;
  deliverables: string;
  price: number;
  currency: string;
  deadline: string;
  paymentTerms: string;
  additionalTerms?: string;
  changeSummary: string;
}

/** POST /api/contracts/[contractId]/revisions */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contractId } = await params;
  const userId = session.user.id;

  let body: RevisionBody;
  try {
    body = (await req.json()) as RevisionBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    title,
    scope,
    deliverables,
    price,
    currency,
    deadline,
    paymentTerms,
    additionalTerms,
    changeSummary,
  } = body;

  if (!title?.trim() || !scope?.trim() || !deliverables?.trim() || !changeSummary?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!price || price <= 0) {
    return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 });
  }
  if (!currency?.trim() || !deadline?.trim() || !paymentTerms?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const contracts = await sql<{
    id: string;
    conversation_id: string;
    status: string;
    current_revision_id: string | null;
  }[]>`
    SELECT id::text, conversation_id::text, status::text, current_revision_id::text
    FROM contracts
    WHERE id = ${contractId}::uuid
  `;
  if (contracts.length === 0) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }
  const contract = contracts[0];

  if (!(await assertConversationAccess(contract.conversation_id, userId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (
    contract.status !== 'draft' &&
    contract.status !== 'pending_review' &&
    contract.status !== 'revision_requested'
  ) {
    return NextResponse.json(
      { error: 'Contract is not in a revisable state' },
      { status: 409 },
    );
  }

  const nextStatus =
    contract.status === 'revision_requested' ? 'pending_review' : contract.status;

  await sql.begin(async (txRaw) => {
    const tx = txRaw as unknown as typeof sql;

    const [maxRow] = await tx<{ max: number }[]>`
      SELECT COALESCE(MAX(revision_number), 0)::int AS max
      FROM contract_revisions
      WHERE contract_id = ${contractId}::uuid
    `;
    const nextNumber = (maxRow?.max ?? 0) + 1;

    const [newRev] = await tx<{ id: string }[]>`
      INSERT INTO contract_revisions (
        contract_id, proposed_by, revision_number,
        title, scope, deliverables, price, currency,
        deadline, payment_terms, additional_terms, change_summary
      )
      VALUES (
        ${contractId}::uuid, ${userId}, ${nextNumber},
        ${title.trim()}, ${scope.trim()}, ${deliverables.trim()},
        ${price}, ${currency.trim()}, ${deadline},
        ${paymentTerms.trim()},
        ${additionalTerms?.trim() || null},
        ${changeSummary.trim()}
      )
      RETURNING id::text
    `;

    await tx`
      UPDATE contracts
      SET current_revision_id = ${newRev.id}::uuid,
          status = ${nextStatus}::contract_status,
          updated_at = now()
      WHERE id = ${contractId}::uuid
    `;

    await tx`
      DELETE FROM contract_signatures
      WHERE contract_id = ${contractId}::uuid
    `;
  });

  const fullContract = await fetchFullContract(contractId);
  if (!fullContract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 500 });
  }

  await broadcastContract(contract.conversation_id, 'contract_updated', fullContract);

  return NextResponse.json({ contract: fullContract });
}
