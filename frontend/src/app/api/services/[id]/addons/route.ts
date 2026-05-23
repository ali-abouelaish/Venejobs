import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { assertServiceAccess } from '@/lib/assertions';
import { db } from '@/lib/db/drizzle';
import { serviceAddons } from '@/lib/db/schema/services';

const CreateAddonSchema = z.object({
  type: z.enum(['revision', 'extra', 'faster_delivery']),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).nullable().optional(),
  price: z.number().int().positive(),
  maxQuantity: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const EDITABLE_STATES = new Set(['draft', 'rejected']);

/** POST /api/services/:id/addons — add an addon to a service. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid service id' }, { status: 400 });
  }

  const service = await assertServiceAccess(id, session.user.id);
  if (!service) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (!EDITABLE_STATES.has(service.status)) {
    return NextResponse.json(
      { error: `Service in state '${service.status}' cannot accept addon changes` },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateAddonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const [row] = await db
    .insert(serviceAddons)
    .values({
      serviceId: id,
      type: parsed.data.type,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      maxQuantity: parsed.data.maxQuantity ?? null,
      sortOrder: parsed.data.sortOrder ?? 0,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
