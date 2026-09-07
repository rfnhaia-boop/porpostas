import { Prisma } from '@prisma/client';
import { parseCommercial, commercialTotals, commercialPaymentTerms, validateCommercial } from '@/lib/commercial';
import { createCommercialPayments } from '@/lib/commercialServer';
import { formatBRL } from '@/lib/money';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';
import { normalizeProposalItems } from '@/lib/catalog';
import { mailProjectDelivered, mailProposalSent } from '@/lib/mailer';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const proposal = await prisma.proposal.findFirst({
    where: { id, companyId },
    omit: { contractData: true },
    include: { items: true, client: true, reviews: { orderBy: { month: "desc" } }, progressUpdates: { orderBy: { month: "desc" }, include: { deliveries: { orderBy: { createdAt: "asc" } } } }, blocks: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] }, payments: { omit: { receiptData: true }, include: { entries: { omit: { receiptData: true }, orderBy: { createdAt: "asc" } } } } },
  });
  if (!proposal) return Response.json({ error: 'Proposta não encontrada.' }, { status: 404 });
  return Response.json(proposal);
}

const STATUSES = [
  'draft',
  'sent',
  'approved',
  'declined',
  'changes_requested',
  'in_progress',
  'delivered',
] as const;

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const existing = await prisma.proposal.findFirst({ where: { id, companyId } });
  if (!existing) return Response.json({ error: 'Proposta não encontrada.' }, { status: 404 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  for (const key of ['proposalNumber', 'title', 'template', 'validityDays', 'timeline', 'paymentTerms', 'notes', 'pixKeyOverride'] as const) {
    if (typeof body[key] === 'string') data[key] = body[key];
  }
  if ('accessPhrase' in body) {
    const p = typeof body.accessPhrase === 'string' ? body.accessPhrase.trim() : '';
    data.accessPhrase = p ? p.slice(0, 100) : null;
  }
  if (body.maxAccesses !== undefined) {
    const n = Number(body.maxAccesses);
    if (Number.isFinite(n)) data.maxAccesses = Math.min(3, Math.max(1, Math.round(n)));
  }
  if (typeof body.status === 'string' && (STATUSES as readonly string[]).includes(body.status)) {
    data.status = body.status;
    if (body.status === 'approved' || body.status === 'declined') data.respondedAt = new Date();
    if (body.status === 'in_progress') data.startedAt = new Date();
    if (body.status === 'delivered') data.deliveredAt = new Date();
  }

  // Edição da proposta: substitui todos os itens e recalcula o total.
  const newItems = Array.isArray(body.items) ? normalizeProposalItems(body.items) : null;
  if (newItems) {
    data.total = newItems.reduce((sum, it) => sum + it.price, 0);
  }

  try {
  const updated = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Proposal" WHERE id = ${id} FOR UPDATE`;
    const current = await tx.proposal.findUniqueOrThrow({ where: { id }, include: { items: true } });
    const protectedStatus = ['approved', 'in_progress', 'delivered'].includes(current.status);
    const modifiesOffer = ['commercial', 'items', 'paymentTerms', 'notes', 'timeline', 'validityDays'].some(k => k in body);
    if (protectedStatus && (modifiesOffer || ['draft', 'sent', 'declined', 'changes_requested'].includes(body.status))) throw new Error('Esta proposta já foi aceita. Crie uma nova proposta para negociar alterações.');
    const commercial = parseCommercial('commercial' in body ? body.commercial : current.commercial);
    const finalItems = newItems ?? current.items;
    if (commercial) {
      if (Array.isArray(body.items)) validateCommercial(body.items, commercial, body.status === 'sent' || body.status === 'approved');
      validateCommercial(finalItems, commercial, body.status === 'sent' || body.status === 'approved');
      data.commercial = commercial;
      data.total = commercialTotals(finalItems, commercial).total;
      data.paymentTerms = commercialPaymentTerms(finalItems, commercial, formatBRL);
      if (body.status === 'approved' && !protectedStatus) {
        const acceptedCommercial = (await createCommercialPayments(tx, { ...current, commercial }, finalItems)) ?? commercial;
        data.commercial = acceptedCommercial;
        data.paymentTerms = commercialPaymentTerms(finalItems, acceptedCommercial, formatBRL);
      }
    } else if ('commercial' in body) data.commercial = Prisma.DbNull;
    if (newItems) {
      await tx.proposalItem.deleteMany({ where: { proposalId: id } });
      await tx.proposalItem.createMany({
        data: newItems.map((it) => ({ ...it, proposalId: id })),
      });
    }
    return tx.proposal.update({
      where: { id },
      data,
      omit: { contractData: true },
      include: { items: true, client: true, reviews: { orderBy: { month: "desc" } }, progressUpdates: { orderBy: { month: "desc" }, include: { deliveries: { orderBy: { createdAt: "asc" } } } }, blocks: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] }, payments: { omit: { receiptData: true }, include: { entries: { omit: { receiptData: true }, orderBy: { createdAt: "asc" } } } } },
    });
  });

  // E-mails automáticos nas viradas de status (fire-and-forget).
  if (existing.status !== 'sent' && updated.status === 'sent') void mailProposalSent(id);
  if (existing.status !== 'delivered' && updated.status === 'delivered') void mailProjectDelivered(id);

  return Response.json(updated);
  } catch (e) { return Response.json({ error: e instanceof Error ? e.message : 'Não foi possível atualizar.' }, { status: 400 }); }
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
