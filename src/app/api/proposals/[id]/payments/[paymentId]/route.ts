import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';

type Ctx = { params: Promise<{ id: string; paymentId: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id, paymentId } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const payment = await prisma.payment.findFirst({ where: { id: paymentId, proposalId: id, companyId } });
  if (!payment) return Response.json({ error: 'Parcela não encontrada.' }, { status: 404 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body?.status === 'paid') {
    data.status = 'paid';
    data.paidAt = new Date();
  } else if (body?.status === 'pending') {
    data.status = 'pending';
    data.paidAt = null;
  }
  const updated = await prisma.payment.update({ where: { id: paymentId }, data, omit: { receiptData: true } });
  return Response.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const { id, paymentId } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const payment = await prisma.payment.findFirst({ where: { id: paymentId, proposalId: id, companyId } });
  if (!payment) return Response.json({ error: 'Parcela não encontrada.' }, { status: 404 });
  await prisma.payment.delete({ where: { id: paymentId } });
  return new Response(null, { status: 204 });
}
