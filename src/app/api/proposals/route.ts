import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';

export async function GET() {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const proposals = await prisma.proposal.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    include: { items: true, client: true },
  });
  return Response.json(proposals);
}

type IncomingItem = { name?: unknown; description?: unknown; price?: unknown };

export async function POST(request: NextRequest) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const body = await request.json();

  const rawItems: IncomingItem[] = Array.isArray(body?.items) ? body.items : [];
  const items = rawItems
    .filter((it) => typeof it?.name === 'string')
    .map((it) => ({
      name: String(it.name),
      description: typeof it.description === 'string' ? it.description : '',
      price: Number.isFinite(Number(it.price)) ? Number(it.price) : 0,
    }));

  if (items.length === 0) {
    return Response.json({ error: 'Inclua ao menos um serviço.' }, { status: 400 });
  }

  let clientId: string | null = null;
  if (typeof body?.clientId === 'string' && body.clientId) {
    const client = await prisma.client.findFirst({ where: { id: body.clientId, companyId } });
    if (!client) return Response.json({ error: 'Cliente inválido.' }, { status: 400 });
    clientId = client.id;
  }

  const total = items.reduce((sum, it) => sum + it.price, 0);
  const status = body?.status === 'sent' ? 'sent' : 'draft';

  const proposal = await prisma.proposal.create({
    data: {
      companyId,
      clientId,
      proposalNumber: typeof body?.proposalNumber === 'string' ? body.proposalNumber : 'PRJ-0000',
      template: typeof body?.template === 'string' ? body.template : 'cyber',
      validityDays: typeof body?.validityDays === 'string' ? body.validityDays : '15 Dias',
      timeline: typeof body?.timeline === 'string' ? body.timeline : '30 dias úteis',
      paymentTerms: typeof body?.paymentTerms === 'string' ? body.paymentTerms : '',
      notes: typeof body?.notes === 'string' ? body.notes : '',
      total,
      status,
      items: { create: items },
    },
    include: { items: true, client: true },
  });
  return Response.json(proposal, { status: 201 });
}
