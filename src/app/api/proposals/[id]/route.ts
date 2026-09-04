import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const proposal = await prisma.proposal.findFirst({
    where: { id, companyId },
    include: { items: true, client: true },
  });
  if (!proposal) return Response.json({ error: 'Proposta não encontrada.' }, { status: 404 });
  return Response.json(proposal);
}

const STATUSES = ['draft', 'sent', 'approved', 'declined', 'changes_requested'] as const;

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const existing = await prisma.proposal.findFirst({ where: { id, companyId } });
  if (!existing) return Response.json({ error: 'Proposta não encontrada.' }, { status: 404 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  for (const key of ['proposalNumber', 'template', 'validityDays', 'timeline', 'paymentTerms', 'notes'] as const) {
    if (typeof body[key] === 'string') data[key] = body[key];
  }
  if ('accessPhrase' in body) {
    const p = typeof body.accessPhrase === 'string' ? body.accessPhrase.trim() : '';
    data.accessPhrase = p ? p.slice(0, 100) : null;
  }
  if (typeof body.status === 'string' && (STATUSES as readonly string[]).includes(body.status)) {
    data.status = body.status;
    if (body.status === 'approved' || body.status === 'declined') data.respondedAt = new Date();
  }

  // Edição da proposta: substitui todos os itens e recalcula o total.
  type ItemInput = { name: string; description: string; price: number };
  const newItems: ItemInput[] | null = Array.isArray(body.items)
    ? (body.items as unknown[])
        .filter((it): it is { name: unknown } => typeof (it as { name?: unknown })?.name === 'string')
        .map((it) => {
          const o = it as { name: string; description?: unknown; price?: unknown };
          return {
            name: String(o.name),
            description: typeof o.description === 'string' ? o.description : '',
            price: Number.isFinite(Number(o.price)) ? Number(o.price) : 0,
          };
        })
    : null;
  if (newItems) {
    data.total = newItems.reduce((sum, it) => sum + it.price, 0);
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (newItems) {
      await tx.proposalItem.deleteMany({ where: { proposalId: id } });
      await tx.proposalItem.createMany({
        data: newItems.map((it) => ({ ...it, proposalId: id })),
      });
    }
    return tx.proposal.update({
      where: { id },
      data,
      include: { items: true, client: true },
    });
  });
  return Response.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const existing = await prisma.proposal.findFirst({ where: { id, companyId } });
  if (!existing) return Response.json({ error: 'Proposta não encontrada.' }, { status: 404 });

  await prisma.proposal.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
