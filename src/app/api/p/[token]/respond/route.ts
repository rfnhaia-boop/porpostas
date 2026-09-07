import { cookies } from 'next/headers';
import { unlockCookieName, unlockCookieValue } from '@/lib/proposalUnlock';
import { parseCommercial, commercialTotals, commercialPaymentTerms, validateCommercial } from '@/lib/commercial';
import { commercialRevision, createCommercialPayments } from '@/lib/commercialServer';
import { formatBRL } from '@/lib/money';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyProposalEvent } from '@/lib/notify';
import { extractToken } from '@/lib/slug';

type Ctx = { params: Promise<{ token: string }> };

const DECISIONS = ['approved', 'declined', 'changes_requested'] as const;
type Decision = (typeof DECISIONS)[number];

// Público: o cliente responde à proposta pelo link. Sem sessão — o token é a credencial.
// O cliente pode mudar a resposta quantas vezes quiser; o dono sempre vê a atual.
export async function POST(request: NextRequest, { params }: Ctx) {
  const { token: rawToken } = await params;
  const token = extractToken(rawToken);
  const body = await request.json().catch(() => null);

  const decision = body?.decision as Decision;
  if (!DECISIONS.includes(decision)) {
    return Response.json({ error: 'Decisão inválida.' }, { status: 400 });
  }
  const note =
    typeof body?.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 2000) : null;

  if (decision === 'changes_requested' && !note) {
    return Response.json({ error: 'Descreva a alteração desejada.' }, { status: 400 });
  }

  const proposal = await prisma.proposal.findUnique({
    where: { publicToken: token },
    include: { items: true, client: { select: { name: true } } },
  });
  if (!proposal) return Response.json({ error: 'Proposta não encontrada.' }, { status: 404 });

  const provided = (await cookies()).get(unlockCookieName(token))?.value;
  if (proposal.accessPhrase && provided !== unlockCookieValue(token, proposal.accessPhrase)) return Response.json({ error: 'Informe o código de acesso antes de responder.' }, { status: 403 });
  let updated;
  let acceptedTotal = proposal.total;
  try {
    updated = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Proposal" WHERE id = ${proposal.id} FOR UPDATE`;
      const current = await tx.proposal.findUniqueOrThrow({ where: { id: proposal.id }, include: { items: true } });
      if (current.accessPhrase && provided !== unlockCookieValue(token, current.accessPhrase)) throw new Error('O código de acesso mudou. Abra a proposta novamente.');
      const config = parseCommercial(current.commercial);
      if (config && ['approved', 'in_progress', 'delivered'].includes(current.status)) {
        if (decision !== 'approved') throw new Error('Proposta já aceita. Solicite uma revisão ao responsável.');
        return { status: current.status, respondedAt: current.respondedAt, responseNote: current.responseNote };
      }
      if (config && decision === 'approved') {
        if (body.agreed !== true) throw new Error('Confirme que concorda com os valores e condições.');
        if (body.selection?.revision !== commercialRevision(current)) throw new Error('A proposta mudou. Recarregue a página e revise os valores antes de aceitar.');
        const selectedPackage = body.selection?.selectedPackage;
        const optionalIds = body.selection?.optionalIds;
        if (!Array.isArray(optionalIds) || optionalIds.some(id => typeof id !== 'string' || !current.items.some(i => i.optional && i.id === id))) throw new Error('Seleção de adicionais inválida.');
        if (config.model === 'packages') {
          if (!config.packages.some(p => p.id === selectedPackage)) throw new Error('Selecione um pacote válido.');
          config.selectedPackage = selectedPackage;
        }
        const items = current.items.map(i => ({ ...i, selected: i.optional ? optionalIds.includes(i.id) && (!i.packageId || i.packageId === config.selectedPackage) : true }));
        validateCommercial(items, config, true);
        acceptedTotal = commercialTotals(items, config).total;
        await createCommercialPayments(tx, { ...current, commercial: config }, items);
        for (const item of items) if (item.selected !== current.items.find(i => i.id === item.id)?.selected) await tx.proposalItem.update({ where: { id: item.id }, data: { selected: item.selected } });
        return tx.proposal.update({ where: { id: current.id }, data: { status: decision, responseNote: note, respondedAt: new Date(), commercial: config, total: acceptedTotal, paymentTerms: commercialPaymentTerms(items, config, formatBRL) }, select: { status: true, respondedAt: true, responseNote: true } });
      }
      return tx.proposal.update({ where: { id: current.id }, data: { status: decision, responseNote: note, respondedAt: new Date() }, select: { status: true, respondedAt: true, responseNote: true } });
    });
  } catch (e) { return Response.json({ error: e instanceof Error ? e.message : 'Não foi possível registrar o aceite.' }, { status: 409 }); }

  // Notifica sempre que a decisão muda, ou quando é um pedido de alteração (pode repetir com texto novo).
  if (proposal.status !== decision || decision === 'changes_requested') {
    const type =
      decision === 'approved'
        ? 'proposal_approved'
        : decision === 'declined'
          ? 'proposal_declined'
          : 'proposal_changes_requested';
    await notifyProposalEvent({
      companyId: proposal.companyId,
      type,
      proposalId: proposal.id,
      proposalNumber: proposal.proposalNumber,
      clientName: proposal.client?.name ?? null,
      total: acceptedTotal,
      note,
    });
  }

  return Response.json(updated);
}
