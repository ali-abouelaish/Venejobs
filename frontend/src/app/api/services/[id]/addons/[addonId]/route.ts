import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { assertServiceAccess } from '@/lib/assertions';
import { db } from '@/lib/db/drizzle';
import { serviceAddons } from '@/lib/db/schema/services';

const PatchAddonSchema = z.object({
  type: z.enum(['revision', 'extra', 'faster_delivery']).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  price: z.number().int().positive().optional(),
  maxQuantity: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const EDITABLE_STATES = new Set(['draft', 'rejected']);

async function gate(
  id: string,
  addonId: string,
  userId: number,
): Promise<NextResponse | { service: { status: string } }> {
  if (!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(addonId).success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const service = await assertServiceAccess(id, userId);
  if (!service) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (!EDITABLE_STATES.has(service.status)) {
    return NextResponse.json(
      { error: `Service in state '${service.status}' cannot accept addon changes` },
      { status: 409 },
    );
  }
  return { service };
}

/** PATCH /api/services/:id/addons/:addonId — edit an addon. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; addonId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, addonId } = await params;
  const gated = await gate(id, addonId, session.user.id);
  if (gated instanceof NextResponse) return gated;

  const body = await req.json().catch(() => null);
  const parsed = PatchAddonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const [row] = await db
    .update(serviceAddons)
    .set(parsed.data)
    .where(and(eq(serviceAddons.id, addonId), eq(serviceAddons.serviceId, id)))
    .returning();

  if (!row) {
    return NextResponse.json({ error: 'Addon not found on this service' }, { status: 404 });
  }
  return NextResponse.json(row);
}

/** DELETE /api/services/:id/addons/:addonId — remove an addon. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; addonId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, addonId } = await params;
  const gated = await gate(id, addonId, session.user.id);
  if (gated instanceof NextResponse) return gated;

  const deleted = await db
    .delete(serviceAddons)
    .where(and(eq(serviceAddons.id, addonId), eq(serviceAddons.serviceId, id)))
    .returning({ id: serviceAddons.id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: 'Addon not found on this service' }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
