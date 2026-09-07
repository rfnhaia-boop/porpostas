import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';

type Ctx = { params: Promise<{ id: string }> };

async function ownProposal(id: string) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return null;
  return prisma.proposal.findFirst({ where: { id, companyId }, select: { id: true } });
}

export async function GET(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!(await ownProposal(id))) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  const blocks = await prisma.proposalBlock.findMany({
    where: { proposalId: id },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
  return Response.json(blocks);
}

// Cria uma etapa (`{ title }`) ou várias de uma vez (`{ titles: [] }` — ex.: puxando do catálogo).
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!(await ownProposal(id))) return Response.json({ error: 'Não autorizado.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const titles: string[] = Array.isArray(body?.titles)
    ? body.titles.map((t: unknown) => String(t ?? '').trim()).filter(Boolean)
    : typeof body?.title === 'string' && body.title.trim()
      ? [body.title.trim()]
      : [];
  if (titles.length === 0) return Response.json({ error: 'Informe o título da etapa.' }, { status: 400 });

  const last = await prisma.proposalBlock.aggregate({
    where: { proposalId: id },
    _max: { order: true },
  });
  let order = (last._max.order ?? -1) + 1;

  await prisma.proposalBlock.createMany({
    data: titles.slice(0, 40).map((title) => ({ proposalId: id, title: title.slice(0, 200), order: order++ })),
  });

  const blocks = await prisma.proposalBlock.findMany({
    where: { proposalId: id },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
  return Response.json(blocks, { status: 201 });
}
