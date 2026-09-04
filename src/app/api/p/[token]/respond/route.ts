import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyProposalEvent } from '@/lib/notify';

type Ctx = { params: Promise<{ token: string }> };

// Público: o cliente responde à proposta pelo link. Sem sessão — o token é a credencial.
// O cliente pode mudar a resposta quantas vezes quiser; o dono sempre vê a atual.
export async function POST(request: NextRequest, { params }: Ctx) {
  const { token } = await params;
  const body = await request.json().catch(() => null);

  const decision = body?.decision;
  if (decision !== 'approved' && decision !== 'declined') {
    return Response.json({ error: 'Decisão inválida.' }, { status: 400 });
  }
  const note =
    typeof body?.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 1000) : null;

  const proposal = await prisma.proposal.findUnique({
    where: { publicToken: token },
    select: {
      id: true,
      companyId: true,
      proposalNumber: true,
      total: true,
      status: true,
      client: { select: { name: true } },
    },
  });
  if (!proposal) return Response.json({ error: 'Proposta não encontrada.' }, { status: 404 });

  const updated = await prisma.proposal.update({
    where: { id: proposal.id },
    data: { status: decision, responseNote: note, respondedAt: new Date() },
    select: { status: true, respondedAt: true, responseNote: true },
  });

  // Notifica só quando a decisão muda de fato (evita spam se o cliente reenvia igual).
  if (proposal.status !== decision) {
    await notifyProposalEvent({
      companyId: proposal.companyId,
      type: decision === 'approved' ? 'proposal_approved' : 'proposal_declined',
      proposalId: proposal.id,
      proposalNumber: proposal.proposalNumber,
      clientName: proposal.client?.name ?? null,
      total: proposal.total,
      note,
    });
  }

  return Response.json(updated);
}
