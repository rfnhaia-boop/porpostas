import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';

type Ctx = { params: Promise<{ id: string }> };

const MONTH_RE = /^\d{4}-\d{2}$/;

async function ownProposal(id: string) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return null;
  return prisma.proposal.findFirst({ where: { id, companyId }, select: { id: true } });
}

// Lista o diário de andamento da proposta (meses + entregas).
export async function GET(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!(await ownProposal(id))) return Response.json({ error: 'Não autorizado.' }, { status: 401 });

  const updates = await prisma.progressUpdate.findMany({
    where: { proposalId: id },
    orderBy: { month: 'desc' },
    include: { deliveries: { orderBy: { createdAt: 'asc' } } },
  });
  return Response.json(updates);
}

// Cria (ou devolve, se já existe) o mês do diário.
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!(await ownProposal(id))) return Response.json({ error: 'Não autorizado.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const month = typeof body?.month === 'string' && MONTH_RE.test(body.month) ? body.month : null;
  if (!month) return Response.json({ error: 'Mês inválido.' }, { status: 400 });

  const update = await prisma.progressUpdate.upsert({
    where: { proposalId_month: { proposalId: id, month } },
    create: { proposalId: id, month },
    update: {},
    include: { deliveries: { orderBy: { createdAt: 'asc' } } },
  });
  return Response.json(update, { status: 201 });
}
