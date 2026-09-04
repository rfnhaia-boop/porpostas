import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';
import { readUploadedFile } from '@/lib/fileUpload';

type Ctx = { params: Promise<{ id: string; paymentId: string }> };

// Anexar o comprovante já marca a parcela como paga.
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id, paymentId } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const payment = await prisma.payment.findFirst({ where: { id: paymentId, proposalId: id, companyId } });
  if (!payment) return Response.json({ error: 'Parcela não encontrada.' }, { status: 404 });

  const result = await readUploadedFile(request);
  if ('error' in result) return Response.json({ error: result.error }, { status: 400 });

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      receiptFileName: result.fileName,
      receiptMimeType: result.mimeType,
      receiptSize: result.size,
      receiptData: new Uint8Array(result.data),
      status: 'paid',
      paidAt: payment.paidAt ?? new Date(),
    },
    omit: { receiptData: true },
  });
  return Response.json({ ok: true, status: updated.status, paidAt: updated.paidAt });
}

export async function GET(_request: NextRequest, { params }: Ctx) {
  const { id, paymentId } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, proposalId: id, companyId },
    select: { receiptData: true, receiptFileName: true, receiptMimeType: true },
  });
  if (!payment?.receiptData) return Response.json({ error: 'Sem comprovante.' }, { status: 404 });
  return new Response(new Uint8Array(payment.receiptData), {
    headers: {
      'Content-Type': payment.receiptMimeType || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${payment.receiptFileName || 'comprovante'}"`,
    },
  });
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const { id, paymentId } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const payment = await prisma.payment.findFirst({ where: { id: paymentId, proposalId: id, companyId } });
  if (!payment) return Response.json({ error: 'Parcela não encontrada.' }, { status: 404 });
  await prisma.payment.update({
    where: { id: paymentId },
    data: { receiptFileName: null, receiptMimeType: null, receiptSize: null, receiptData: null },
  });
  return new Response(null, { status: 204 });
}
