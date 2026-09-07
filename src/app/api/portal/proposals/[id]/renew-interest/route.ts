import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientSession, clientEmailOwnsProposal } from '@/lib/clientAuth';
import { mailRenewalInterest } from '@/lib/mailer';

// O cliente sinaliza que quer continuar/renovar o projeto — vira notificação pro dono.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getClientSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!(await clientEmailOwnsProposal(session.email, id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    select: { companyId: true, proposalNumber: true, title: true, client: { select: { name: true } } },
  });
  if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const who = proposal.client?.name || 'O cliente';
  const what = proposal.title || `proposta ${proposal.proposalNumber}`;

  await prisma.notification.create({
    data: {
      companyId: proposal.companyId,
      type: 'renewal_interest',
      message: `${who} quer CONTINUAR o projeto "${what}"`,
      proposalId: id,
    },
  });

  void mailRenewalInterest(id);
  return NextResponse.json({ ok: true });
}
