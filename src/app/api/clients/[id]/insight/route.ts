import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';
import { analyzeClientPunctuality } from '@/lib/paymentIntelligence';

type Ctx = { params: Promise<{ id: string }> };

// Analisa o histórico de parcelas do cliente (todas as propostas) e devolve
// o padrão de pontualidade — usado no aviso de "cliente atrasa recorrente".
export async function GET(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });

  const client = await prisma.client.findFirst({ where: { id, companyId } });
  if (!client) return Response.json({ error: 'Cliente não encontrado.' }, { status: 404 });

  const payments = await prisma.payment.findMany({
    where: { companyId, proposal: { clientId: id } },
    select: { dueDate: true, paidAt: true, status: true },
    orderBy: { dueDate: 'asc' },
  });

  const insight = analyzeClientPunctuality(payments);
  return Response.json(insight);
}
