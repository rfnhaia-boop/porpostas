import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';

type Ctx = { params: Promise<{ id: string; blockId: string }> };

async function loadOwned(id: string, blockId: string) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return null;
  return prisma.proposalBlock.findFirst({
    where: { id: blockId, proposalId: id, proposal: { companyId } },
    select: { id: true },
  });
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id, blockId } = await params;
  if (!(await loadOwned(id, blockId)))
    return Response.json({ error: 'Não encontrado.' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.title === 'string') data.title = body.title.trim().slice(0, 200);
  if (typeof body.description === 'string') data.description = body.description.slice(0, 2000);
  if (typeof body.link === 'string') data.link = body.link.trim().slice(0, 2000);
  if (typeof body.order === 'number' && Number.isFinite(body.order)) data.order = Math.round(body.order);
  if (body.status === 'pending' || body.status === 'done') {
    data.status = body.status;
    data.doneAt = body.status === 'done' ? new Date() : null;
  }

  const updated = await prisma.proposalBlock.update({ where: { id: blockId }, data });
  return Response.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const { id, blockId } = await params;
  if (!(await loadOwned(id, blockId)))
    return Response.json({ error: 'Não encontrado.' }, { status: 404 });
  await prisma.proposalBlock.delete({ where: { id: blockId } });
  return new Response(null, { status: 204 });
}
