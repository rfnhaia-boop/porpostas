import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';
import { generatePaymentPlan } from '@/lib/payments';

type Ctx = { params: Promise<{ id: string }> };

// Gera o plano de cobrança (único, parcelado ou mensal) de uma proposta.
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const proposal = await prisma.proposal.findFirst({ where: { id, companyId } });
  if (!proposal) return Response.json({ error: 'Proposta não encontrada.' }, { status: 404 });

  if (proposal.commercial) return Response.json({ error: 'As cobranças desta proposta são geradas automaticamente no aceite, a partir do modelo comercial.' }, { status: 400 });

  const existing = await prisma.payment.count({ where: { proposalId: id } });
  if (existing > 0) {
    return Response.json({ error: 'Já existe um plano de cobrança. Apague antes de gerar outro.' }, { status: 400 });
  }

  const body = await request.json();
  const recurrence = body?.recurrence === 'monthly' ? 'monthly' : 'once';
  const occurrences = recurrence === 'monthly' ? Number(body?.occurrences) || 1 : 1;
  const cycleAmount = Number(body?.cycleAmount);
  if (!Number.isFinite(cycleAmount) || cycleAmount <= 0) {
    return Response.json({ error: 'Informe um valor válido.' }, { status: 400 });
  }

  const plan = generatePaymentPlan({
    recurrence,
    occurrences,
    cycleAmount: Math.round(cycleAmount),
  });

  await prisma.payment.createMany({
    data: plan.map((p) => ({
      companyId,
      proposalId: id,
      label: p.label,
      amount: p.amount,
      dueDate: p.dueDate,
    })),
  });

  const payments = await prisma.payment.findMany({
    where: { proposalId: id },
    orderBy: { createdAt: 'asc' },
    omit: { receiptData: true },
  });
  return Response.json(payments, { status: 201 });
}

// Apaga o plano inteiro — só se nada foi pago ainda.
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const proposal = await prisma.proposal.findFirst({ where: { id, companyId } });
  if (!proposal) return Response.json({ error: 'Proposta não encontrada.' }, { status: 404 });

  if (proposal.commercial) return Response.json({ error: 'O calendário está vinculado ao aceite da proposta.' }, { status: 400 });

  const paidCount = await prisma.payment.count({ where: { proposalId: id, status: 'paid' } });
  if (paidCount > 0) {
    return Response.json({ error: 'Já tem parcela paga — não dá pra apagar o plano.' }, { status: 400 });
  }
  await prisma.payment.deleteMany({ where: { proposalId: id } });
  return new Response(null, { status: 204 });
}
