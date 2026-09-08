// Disparos de e-mail por evento. Tudo fire-and-forget — nunca lança, nunca
// segura o fluxo. Assunto/texto vêm de emailTemplates.ts (editável por empresa);
// a estrutura (botão, tabela de dados) fica aqui.

import { prisma } from './prisma';
import { formatBRL as money } from './money';
import { buildPublicPath } from './slug';
import { appUrl, button, facts, heading, isEmail, paragraph, sendEmail } from './email';
import { renderEmailTemplate, type EmailKey } from './emailTemplates';

async function ownerInbox(companyId: string) {
  const c = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      name: true,
      email: true,
      users: { take: 1, orderBy: { createdAt: 'asc' }, select: { email: true } },
    },
  });
  if (!c) return null;
  const to = isEmail(c.email) ? c.email : c.users[0]?.email ?? '';
  if (!isEmail(to)) return null;
  return { to, companyName: c.name || 'sua empresa' };
}

async function companyReplyTo(companyId: string) {
  const c = await prisma.company.findUnique({
    where: { id: companyId },
    select: { email: true, emailVerified: true, name: true },
  });
  return {
    replyTo: c?.emailVerified && isEmail(c.email) ? c.email : null,
    companyName: c?.name || 'a empresa',
  };
}

// Monta o HTML final a partir do template renderizado + CTA + tabela opcional.
async function dispatch(opts: {
  companyId: string;
  key: EmailKey;
  to: string;
  replyTo?: string | null;
  vars: Record<string, string | undefined>;
  cta?: { label: string; href: string };
  factRows?: [string, string][];
}): Promise<boolean> {
  const t = await renderEmailTemplate(opts.companyId, opts.key, opts.vars);
  if (!t.enabled) return false;
  const co = await prisma.company.findUnique({
    where: { id: opts.companyId },
    select: { logoUrl: true },
  });
  const html = [
    heading(t.title),
    opts.factRows && opts.factRows.length ? facts(opts.factRows) : '',
    ...t.bodyParagraphs.map((p) => paragraph(p)),
    opts.cta ? button(opts.cta.label, opts.cta.href) : '',
  ]
    .filter(Boolean)
    .join('');
  const plainParagraphs = t.bodyParagraphs.map((p) => p.replace(/<[^>]+>/g, ''));
  const text = [
    t.title,
    '',
    ...(opts.factRows?.map(([k, v]) => `${k}: ${v}`) ?? []),
    opts.factRows?.length ? '' : null,
    ...plainParagraphs,
    opts.cta ? `\n${opts.cta.label}: ${opts.cta.href}` : null,
  ]
    .filter((l) => l !== null)
    .join('\n')
    .trim();
  return sendEmail({
    to: opts.to,
    replyTo: opts.replyTo ?? null,
    subject: t.subject,
    html,
    text,
    brand: opts.vars.empresa,
    logoUrl: co?.logoUrl || undefined,
    preheader: t.bodyParagraphs[0]?.replace(/<[^>]+>/g, '').slice(0, 140),
  });
}

// --- proposta enviada → cliente ------------------------------------------------
export async function mailProposalSent(proposalId: string) {
  try {
    const p = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: {
        proposalNumber: true,
        title: true,
        total: true,
        publicToken: true,
        accessPhrase: true,
        companyId: true,
        client: { select: { name: true, email: true } },
      },
    });
    if (!p?.client?.email || !isEmail(p.client.email)) return;
    const { replyTo, companyName } = await companyReplyTo(p.companyId);
    const link = appUrl(buildPublicPath(p.publicToken, p.client.name));
    const first = p.client.name?.trim().split(/\s+/)[0] || 'Olá';

    await dispatch({
      companyId: p.companyId,
      key: 'proposal_sent',
      to: p.client.email,
      replyTo,
      vars: {
        cliente: first,
        empresa: companyName,
        proposta: p.title || p.proposalNumber,
        valor: money(p.total),
        palavraAcesso: p.accessPhrase || '',
      },
      factRows: [
        ['Proposta', p.proposalNumber],
        ['Valor', money(p.total)],
        ...(p.accessPhrase ? ([['Palavra de acesso', p.accessPhrase]] as [string, string][]) : []),
      ],
      cta: { label: 'Abrir proposta', href: link },
    });
  } catch (err) {
    console.error('[mailer] proposalSent:', err);
  }
}

// --- cliente registrou pagamento / anexou comprovante → dono -----------------
export async function mailPaymentSubmitted(paymentId: string) {
  try {
    const pay = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        label: true,
        amount: true,
        proposal: {
          select: { id: true, proposalNumber: true, title: true, companyId: true, client: { select: { name: true } } },
        },
      },
    });
    if (!pay) return;
    const box = await ownerInbox(pay.proposal.companyId);
    if (!box) return;
    const who = pay.proposal.client?.name || 'O cliente';

    await dispatch({
      companyId: pay.proposal.companyId,
      key: 'payment_submitted',
      to: box.to,
      vars: {
        cliente: who,
        projeto: pay.proposal.title || pay.proposal.proposalNumber,
        cobranca: pay.label,
        valor: money(pay.amount),
      },
      factRows: [
        ['Cobrança', pay.label],
        ['Valor', money(pay.amount)],
      ],
      cta: { label: 'Conferir no painel', href: appUrl(`/approved/${pay.proposal.id}`) },
    });
  } catch (err) {
    console.error('[mailer] paymentSubmitted:', err);
  }
}

// --- dono conferiu o pagamento → cliente ------------------------------------
export async function mailPaymentConfirmed(paymentId: string) {
  try {
    const pay = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        label: true,
        amount: true,
        proposal: {
          select: { title: true, proposalNumber: true, companyId: true, client: { select: { email: true } } },
        },
      },
    });
    if (!pay?.proposal.client?.email || !isEmail(pay.proposal.client.email)) return;
    const { replyTo, companyName } = await companyReplyTo(pay.proposal.companyId);

    await dispatch({
      companyId: pay.proposal.companyId,
      key: 'payment_confirmed',
      to: pay.proposal.client.email,
      replyTo,
      vars: {
        empresa: companyName,
        projeto: pay.proposal.title || pay.proposal.proposalNumber,
        cobranca: pay.label,
        valor: money(pay.amount),
      },
      cta: { label: 'Ver no portal', href: appUrl('/portal') },
    });
  } catch (err) {
    console.error('[mailer] paymentConfirmed:', err);
  }
}

// --- dono subiu entrega / atualizou o andamento → cliente -------------------
export async function mailProjectUpdate(proposalId: string, what = 'novas entregas foram adicionadas') {
  try {
    const p = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: { title: true, proposalNumber: true, companyId: true, client: { select: { email: true } } },
    });
    if (!p?.client?.email || !isEmail(p.client.email)) return;
    const { replyTo, companyName } = await companyReplyTo(p.companyId);

    await dispatch({
      companyId: p.companyId,
      key: 'project_update',
      to: p.client.email,
      replyTo,
      vars: { empresa: companyName, projeto: p.title || p.proposalNumber, oQue: what },
      cta: { label: 'Ver andamento', href: appUrl('/portal') },
    });
  } catch (err) {
    console.error('[mailer] projectUpdate:', err);
  }
}

// --- projeto iniciado (contrato anexado) → cliente ---------------------------
export async function mailProjectStarted(proposalId: string) {
  try {
    const p = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: {
        title: true,
        proposalNumber: true,
        timeline: true,
        companyId: true,
        client: { select: { name: true, email: true } },
      },
    });
    if (!p?.client?.email || !isEmail(p.client.email)) return;
    const { replyTo, companyName } = await companyReplyTo(p.companyId);
    const first = p.client.name?.trim().split(/\s+/)[0] || 'Olá';

    await dispatch({
      companyId: p.companyId,
      key: 'project_started',
      to: p.client.email,
      replyTo,
      vars: {
        cliente: first,
        empresa: companyName,
        projeto: p.title || p.proposalNumber,
        prazo: p.timeline || 'a combinar',
      },
      cta: { label: 'Acompanhar no portal', href: appUrl('/portal') },
    });
  } catch (err) {
    console.error('[mailer] projectStarted:', err);
  }
}

// --- projeto entregue → cliente -------------------------------------------------
export async function mailProjectDelivered(proposalId: string) {
  try {
    const p = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: { title: true, proposalNumber: true, companyId: true, client: { select: { name: true, email: true } } },
    });
    if (!p?.client?.email || !isEmail(p.client.email)) return;
    const { replyTo, companyName } = await companyReplyTo(p.companyId);
    const first = p.client.name?.trim().split(/\s+/)[0] || 'Olá';

    await dispatch({
      companyId: p.companyId,
      key: 'project_delivered',
      to: p.client.email,
      replyTo,
      vars: { cliente: first, empresa: companyName, projeto: p.title || p.proposalNumber },
      cta: { label: 'Ver resumo no portal', href: appUrl('/portal') },
    });
  } catch (err) {
    console.error('[mailer] projectDelivered:', err);
  }
}

// --- lembrete de vencimento → cliente (chamado pelo cron) -------------------
export async function mailPaymentReminder(paymentId: string) {
  try {
    const pay = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        label: true,
        amount: true,
        dueDate: true,
        proposal: {
          select: { title: true, proposalNumber: true, companyId: true, client: { select: { email: true } } },
        },
      },
    });
    if (!pay?.dueDate || !pay.proposal.client?.email || !isEmail(pay.proposal.client.email)) return;
    const { replyTo, companyName } = await companyReplyTo(pay.proposal.companyId);
    const due = new Date(pay.dueDate);
    const days = Math.max(0, Math.round((due.getTime() - Date.now()) / 86_400_000));
    const dueLabel = due.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    const diasTxt = days === 0 ? 'hoje' : days === 1 ? '1 dia' : `${days} dias`;

    await dispatch({
      companyId: pay.proposal.companyId,
      key: 'payment_reminder',
      to: pay.proposal.client.email,
      replyTo,
      vars: {
        empresa: companyName,
        projeto: pay.proposal.title || pay.proposal.proposalNumber,
        cobranca: pay.label,
        valor: money(pay.amount),
        vencimento: dueLabel,
        dias: diasTxt,
      },
      factRows: [
        ['Cobrança', pay.label],
        ['Valor', money(pay.amount)],
        ['Vencimento', dueLabel],
      ],
      cta: { label: 'Pagar no portal', href: appUrl('/portal') },
    });
  } catch (err) {
    console.error('[mailer] paymentReminder:', err);
  }
}

// --- cliente clicou "quero continuar" → dono -------------------------------
export async function mailRenewalInterest(proposalId: string) {
  try {
    const p = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: { id: true, title: true, proposalNumber: true, companyId: true, client: { select: { name: true } } },
    });
    if (!p) return;
    const box = await ownerInbox(p.companyId);
    if (!box) return;
    const who = p.client?.name || 'O cliente';

    await dispatch({
      companyId: p.companyId,
      key: 'renewal_interest',
      to: box.to,
      vars: { cliente: who, projeto: p.title || p.proposalNumber },
      cta: { label: 'Gerar proposta de continuação', href: appUrl(`/approved/${p.id}`) },
    });
  } catch (err) {
    console.error('[mailer] renewalInterest:', err);
  }
}

// --- boas-vindas no cadastro → novo dono ----------------------------------
export async function mailWelcome(companyId: string, email: string, name?: string | null) {
  try {
    if (!isEmail(email)) return;
    await dispatch({
      companyId,
      key: 'welcome',
      to: email,
      vars: { nome: name?.trim().split(/\s+/)[0] || 'tudo certo' },
      cta: { label: 'Abrir o painel', href: appUrl('/') },
    });
  } catch (err) {
    console.error('[mailer] welcome:', err);
  }
}

// --- confirmação do e-mail da configuração → dono --------------------------
export async function mailVerifyCompanyEmail(email: string, token: string, companyName: string) {
  try {
    if (!isEmail(email)) return;
    await sendEmail({
      to: email,
      subject: 'Confirme seu e-mail na NEX',
      brand: companyName,
      preheader: 'Confirme o e-mail de contato dos seus projetos.',
      html:
        heading('Confirme seu e-mail') +
        paragraph(
          `Esse e-mail vai ser usado como contato e resposta dos e-mails automáticos que a ${companyName} envia pelos seus projetos. Clique para confirmar que ele é seu.`,
        ) +
        button('Confirmar e-mail', appUrl(`/api/company/verify-email?token=${encodeURIComponent(token)}`)) +
        paragraph('<span style="font-size:12px;color:#a1a1aa">Se você não pediu isso, é só ignorar.</span>'),
    });
  } catch (err) {
    console.error('[mailer] verifyCompanyEmail:', err);
  }
}
