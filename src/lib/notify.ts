import { prisma } from './prisma';
import { Resend } from 'resend';
import { formatBRL as money } from './money';

export type NotifyType =
  | 'proposal_viewed'
  | 'proposal_approved'
  | 'proposal_declined'
  | 'proposal_changes_requested';

const MESSAGE: Record<NotifyType, (num: string) => string> = {
  proposal_viewed: (n) => `visualizou a proposta ${n}`,
  proposal_approved: (n) => `APROVOU a proposta ${n}`,
  proposal_declined: (n) => `recusou a proposta ${n}`,
  proposal_changes_requested: (n) => `pediu alteração na proposta ${n}`,
};

/**
 * Registra a notificação in-app e, se houver RESEND_API_KEY, manda e-mail pro dono.
 * Nunca lança — falha de e-mail não quebra o fluxo do cliente.
 */
export async function notifyProposalEvent(opts: {
  companyId: string;
  type: NotifyType;
  proposalId: string;
  proposalNumber: string;
  clientName: string | null;
  total: number;
  note?: string | null;
}) {
  const who = opts.clientName || 'O cliente';
  const message = `${who} ${MESSAGE[opts.type](opts.proposalNumber)}`;

  try {
    await prisma.notification.create({
      data: {
        companyId: opts.companyId,
        type: opts.type,
        message,
        proposalId: opts.proposalId,
      },
    });
  } catch (err) {
    console.error('[notify] falha ao criar notificação:', err);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  try {
    const company = await prisma.company.findUnique({
      where: { id: opts.companyId },
      select: {
        email: true,
        users: { take: 1, orderBy: { createdAt: 'asc' }, select: { email: true } },
      },
    });
    const to = company?.email || company?.users[0]?.email;
    if (!to) return;

    const link = `${process.env.APP_URL ?? ''}/proposals`;
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: process.env.RESEND_FROM || 'NEX Quotes <onboarding@resend.dev>',
      to,
      subject: message,
      text: [
        `${message}.`,
        `Valor: ${money(opts.total)}`,
        opts.note ? `Observação do cliente: ${opts.note}` : null,
        '',
        `Ver no painel: ${link}`,
      ]
        .filter(Boolean)
        .join('\n'),
    });
  } catch (err) {
    console.error('[notify] falha ao enviar e-mail:', err);
  }
}
