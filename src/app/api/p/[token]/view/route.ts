import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyProposalEvent } from '@/lib/notify';

type Ctx = { params: Promise<{ token: string }> };

// Público: a página /p/<token> chama isto ao abrir, para registrar a visualização.
export async function POST(_request: NextRequest, { params }: Ctx) {
  const { token } = await params;

  const proposal = await prisma.proposal.findUnique({
    where: { publicToken: token },
    select: {
      id: true,
      companyId: true,
      proposalNumber: true,
      total: true,
      viewedAt: true,
      client: { select: { name: true } },
    },
  });
  if (!proposal) return Response.json({ error: 'Proposta não encontrada.' }, { status: 404 });

  const firstView = !proposal.viewedAt;

  await prisma.proposal.update({
    where: { id: proposal.id },
    data: {
      viewCount: { increment: 1 },
      ...(firstView ? { viewedAt: new Date() } : {}),
    },
  });

  if (firstView) {
    await notifyProposalEvent({
      companyId: proposal.companyId,
      type: 'proposal_viewed',
      proposalId: proposal.id,
      proposalNumber: proposal.proposalNumber,
      clientName: proposal.client?.name ?? null,
      total: proposal.total,
    });
  }

  return Response.json({ ok: true });
}
