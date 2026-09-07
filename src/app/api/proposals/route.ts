import { parseCommercial, commercialTotals, commercialPaymentTerms, validateCommercial } from '@/lib/commercial';
import { formatBRL } from '@/lib/money';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';
import { normalizeProposalItems } from '@/lib/catalog';
import { generatePublicToken } from '@/lib/token';
import { mailProposalSent } from '@/lib/mailer';

export async function GET() {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const proposals = await prisma.proposal.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    omit: { contractData: true },
    include: { items: true, client: true, reviews: { orderBy: { month: "desc" } }, progressUpdates: { orderBy: { month: "desc" }, include: { deliveries: { orderBy: { createdAt: "asc" } } } }, blocks: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] }, payments: { omit: { receiptData: true }, include: { entries: { omit: { receiptData: true }, orderBy: { createdAt: "asc" } } } } },
  });
  return Response.json(proposals);
}

export async function POST(request: NextRequest) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const body = await request.json();

  const items = normalizeProposalItems(Array.isArray(body?.items) ? body.items : []);
  if (items.length === 0) {
    return Response.json({ error: 'Inclua ao menos um item.' }, { status: 400 });
  }

  let clientId: string | null = null;
  if (typeof body?.clientId === 'string' && body.clientId) {
    const client = await prisma.client.findFirst({ where: { id: body.clientId, companyId } });
    if (!client) return Response.json({ error: 'Cliente inválido.' }, { status: 400 });
    clientId = client.id;
  }

  let commercial;
  try {
    commercial = parseCommercial(body.commercial);
    if (commercial) {
      validateCommercial(Array.isArray(body.items) ? body.items : [], commercial, body.status === 'sent');
      validateCommercial(items, commercial, body.status === 'sent');
    }
  } catch (e) { return Response.json({ error: e instanceof Error ? e.message : 'Modelo inválido.' }, { status: 400 }); }
  const total = commercial ? commercialTotals(items, commercial).total : items.reduce((sum, it) => sum + it.price, 0);
  const status = body?.status === 'sent' ? 'sent' : 'draft';
  const accessPhrase =
    typeof body?.accessPhrase === 'string' && body.accessPhrase.trim()
      ? body.accessPhrase.trim().slice(0, 100)
      : null;

  // Colisão de token é praticamente impossível (62^12 combinações), mas
  // como o campo é @unique, tenta de novo em vez de derrubar a criação.
  let proposal;
  for (let attempt = 0; ; attempt++) {
    try {
      proposal = await prisma.proposal.create({
        data: {
          ...(commercial ? { commercial } : {}),
          companyId,
          clientId,
          publicToken: generatePublicToken(),
          proposalNumber: typeof body?.proposalNumber === 'string' ? body.proposalNumber : 'PRJ-0000',
          title: typeof body?.title === 'string' ? body.title.slice(0, 120) : '',
          template: typeof body?.template === 'string' ? body.template : 'cyber',
          validityDays: typeof body?.validityDays === 'string' ? body.validityDays : '15 Dias',
          timeline: typeof body?.timeline === 'string' ? body.timeline : '30 dias úteis',
          paymentTerms: commercial ? commercialPaymentTerms(items, commercial, formatBRL) : typeof body?.paymentTerms === 'string' ? body.paymentTerms : '',
          notes: typeof body?.notes === 'string' ? body.notes : '',
          accessPhrase,
          total,
          status,
          items: { create: items },
        },
        omit: { contractData: true },
        include: { items: true, client: true, reviews: { orderBy: { month: "desc" } }, progressUpdates: { orderBy: { month: "desc" }, include: { deliveries: { orderBy: { createdAt: "asc" } } } }, blocks: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] }, payments: { omit: { receiptData: true }, include: { entries: { omit: { receiptData: true }, orderBy: { createdAt: "asc" } } } } },
      });
      break;
    } catch (err) {
      const isUniqueClash =
        err instanceof Error && 'code' in err && (err as { code?: string }).code === 'P2002';
      if (!isUniqueClash || attempt >= 3) throw err;
    }
  }
  if (proposal.status === 'sent') void mailProposalSent(proposal.id);

  return Response.json(proposal, { status: 201 });
}
