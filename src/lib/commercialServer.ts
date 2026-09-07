import { createHash } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { commercialSchedule, parseCommercial, type CommercialItem } from './commercial';

export function commercialRevision(p: { commercial: unknown; items: (CommercialItem & { order?: number })[]; notes: string; timeline: string; validityDays: string }) {
  return createHash('sha256').update(JSON.stringify({ commercial: p.commercial, items: [...p.items].sort((a,b) => (a.order ?? 0) - (b.order ?? 0)), notes: p.notes, timeline: p.timeline, validityDays: p.validityDays })).digest('hex');
}

/** Called only while the proposal row is locked, within the approval transaction. */
export async function createCommercialPayments(tx: Prisma.TransactionClient, proposal: { id: string; companyId: string; commercial: unknown }, items: CommercialItem[], clientDueDate?: string) {
  const config = parseCommercial(proposal.commercial);
  if (!config) return;
  const existing = await tx.payment.count({ where: { proposalId: proposal.id } });
  if (existing) throw new Error('Já existe cobrança nesta proposta. Revise o plano antes de aprovar novos valores.');
  const plan = commercialSchedule(items, config, { clientDueDate });
  await tx.payment.createMany({ data: plan.map(p => ({ ...p, proposalId: proposal.id, companyId: proposal.companyId })) });
  // Store the actual start date so subsequent previews never move the accepted calendar.
  return { ...config, firstDueDate: plan[0].dueDate.toISOString().slice(0, 10), dueDateMode: config.dueDateMode === 'client' ? (clientDueDate ? 'fixed' as const : 'month_end' as const) : config.dueDateMode };
}
