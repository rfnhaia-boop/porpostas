// Métricas do dashboard — tudo derivado do que já vem de /api/proposals e
// /api/services (sem endpoint novo). Cálculos puros, testáveis isolados.

import type { Proposal, Service } from './api';

const CLOSED_STATUSES = ['approved', 'in_progress', 'delivered'] as const;

export interface MonthPoint {
  key: string;
  label: string;
  value: number;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * `dueDate` é uma data pura, gravada como meia-noite UTC. Comparar com `new Date()`
 * local jogava um vencimento de HOJE pra "1 dia atrás" no fuso do Brasil (UTC−3).
 * Aqui a diferença é calculada só entre os DIAS de calendário, sem hora/fuso.
 */
function dueDaysFromToday(dueIso: string | null | undefined): number | null {
  if (!dueIso) return null;
  const due = new Date(dueIso);
  if (Number.isNaN(due.getTime())) return null;
  const dueDay = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const now = new Date();
  const todayDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((dueDay - todayDay) / 86_400_000);
}

function monthLabel(d: Date) {
  const s = d.toLocaleDateString('pt-BR', { month: 'short' });
  return s.replace('.', '');
}

export function lastNMonths(n: number): { key: string; label: string; date: Date }[] {
  const out: { key: string; label: string; date: Date }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: monthKey(d), label: monthLabel(d), date: d });
  }
  return out;
}

/** Quantas propostas foram fechadas (aprovadas) em cada um dos últimos N meses. */
export function closedByMonth(proposals: Proposal[], months = 6): MonthPoint[] {
  const buckets = lastNMonths(months);
  const counts = new Map(buckets.map((b) => [b.key, 0]));
  for (const p of proposals) {
    if (!p.respondedAt) continue;
    if (!(CLOSED_STATUSES as readonly string[]).includes(p.status)) continue;
    const k = monthKey(new Date(p.respondedAt));
    if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return buckets.map((b) => ({ key: b.key, label: b.label, value: counts.get(b.key) ?? 0 }));
}

/** Quanto entrou de verdade (parcelas pagas) em cada um dos últimos N meses. */
export function revenueByMonth(proposals: Proposal[], months = 6): MonthPoint[] {
  const buckets = lastNMonths(months);
  const sums = new Map(buckets.map((b) => [b.key, 0]));
  for (const p of proposals) {
    for (const pay of p.payments) {
      if (pay.status !== 'paid' || !pay.paidAt) continue;
      const k = monthKey(new Date(pay.paidAt));
      if (sums.has(k)) sums.set(k, (sums.get(k) ?? 0) + pay.amount);
    }
  }
  return buckets.map((b) => ({ key: b.key, label: b.label, value: sums.get(b.key) ?? 0 }));
}

/** Saúde da carteira de recebíveis — tudo derivado de proposals[].payments[].entries[]. */
export interface PaymentHealth {
  toReceive: number; // centavos ainda em aberto, dentro do prazo
  overdue: number; // centavos vencidos e não pagos
  overdueCount: number; // nº de meses/cobranças vencidos
  awaitingCount: number; // recibos que o cliente anexou e o dono ainda não conferiu
  receivedThisMonth: number; // centavos que entraram no mês corrente
}

export function paymentHealth(proposals: Proposal[]): PaymentHealth {
  const thisKey = monthKey(new Date());
  let toReceive = 0;
  let overdue = 0;
  let overdueCount = 0;
  let awaitingCount = 0;
  let receivedThisMonth = 0;

  for (const p of proposals) {
    for (const pay of p.payments) {
      if (pay.status === 'paid') {
        if (pay.paidAt && monthKey(new Date(pay.paidAt)) === thisKey) receivedThisMonth += pay.amount;
        continue;
      }
      const entries = pay.entries ?? [];
      const verified = entries.filter((e) => e.status === 'verified').reduce((s, e) => s + e.amount, 0);
      const remaining = Math.max(0, pay.amount - verified);
      awaitingCount += entries.filter((e) => e.status === 'awaiting_verification').length;
      if (remaining <= 0) continue;
      const d = dueDaysFromToday(pay.dueDate);
      if (d !== null && d < 0) {
        overdue += remaining;
        overdueCount += 1;
      } else {
        toReceive += remaining;
      }
    }
  }

  return { toReceive, overdue, overdueCount, awaitingCount, receivedThisMonth };
}

/** Quantas propostas em cada status — pra rosca de "quem aprovou, quem não". */
export interface StatusSlice {
  key: string;
  label: string;
  color: string;
  count: number;
}

const STATUS_META: { key: Proposal['status']; label: string; color: string }[] = [
  { key: 'draft', label: 'Rascunho', color: '#6b7280' },
  { key: 'sent', label: 'Enviada', color: '#f59e0b' },
  { key: 'changes_requested', label: 'Alteração pedida', color: '#eab308' },
  { key: 'approved', label: 'Aprovada', color: '#22c55e' },
  { key: 'in_progress', label: 'Em execução', color: '#3b82f6' },
  { key: 'delivered', label: 'Entregue', color: '#14b8a6' },
  { key: 'declined', label: 'Recusada', color: '#ef4444' },
];

export function statusBreakdown(proposals: Proposal[]): StatusSlice[] {
  const counts = new Map<string, number>();
  for (const p of proposals) counts.set(p.status, (counts.get(p.status) ?? 0) + 1);
  return STATUS_META.map((m) => ({
    key: m.key,
    label: m.label,
    color: m.color,
    count: counts.get(m.key) ?? 0,
  })).filter((s) => s.count > 0);
}

/** Ranking de clientes por valor fechado (aprovado + execução + entregue). */
export interface ClientRank {
  name: string;
  total: number; // centavos
  count: number;
}
export function topClients(proposals: Proposal[], limit = 5): ClientRank[] {
  const m = new Map<string, { total: number; count: number }>();
  for (const p of proposals) {
    if (!(CLOSED_STATUSES as readonly string[]).includes(p.status)) continue;
    const name = p.client?.name?.trim() || 'Sem cliente';
    const cur = m.get(name) ?? { total: 0, count: 0 };
    cur.total += p.total;
    cur.count += 1;
    m.set(name, cur);
  }
  return [...m.entries()]
    .map(([name, v]) => ({ name, total: v.total, count: v.count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/** Serviços/produtos que mais aparecem em propostas fechadas (por receita gerada). */
export interface ServiceRank {
  name: string;
  count: number;
  revenue: number; // centavos
}
export function topServices(proposals: Proposal[], limit = 5): ServiceRank[] {
  const m = new Map<string, { count: number; revenue: number }>();
  for (const p of proposals) {
    if (!(CLOSED_STATUSES as readonly string[]).includes(p.status)) continue;
    for (const it of p.items) {
      const key = it.name.trim();
      if (!key) continue;
      const cur = m.get(key) ?? { count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += it.price;
      m.set(key, cur);
    }
  }
  return [...m.entries()]
    .map(([name, v]) => ({ name, count: v.count, revenue: v.revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/** Próximas cobranças em aberto (e as vencidas primeiro), ordenadas por vencimento. */
export interface UpcomingBill {
  id: string;
  project: string;
  client: string;
  label: string;
  amount: number; // centavos ainda em aberto
  dueDate: string | null;
  daysUntil: number | null;
  overdue: boolean;
}
export function upcomingBills(proposals: Proposal[], limit = 6): UpcomingBill[] {
  const out: UpcomingBill[] = [];
  for (const p of proposals) {
    for (const pay of p.payments) {
      if (pay.status === 'paid') continue;
      const verified = (pay.entries ?? [])
        .filter((e) => e.status === 'verified')
        .reduce((s, e) => s + e.amount, 0);
      const remaining = Math.max(0, pay.amount - verified);
      if (remaining <= 0) continue;
      const daysUntil = dueDaysFromToday(pay.dueDate);
      out.push({
        id: pay.id,
        project: p.title?.trim() || `#${p.proposalNumber}`,
        client: p.client?.name?.trim() || '',
        label: pay.label,
        amount: remaining,
        dueDate: pay.dueDate,
        daysUntil,
        overdue: daysUntil !== null && daysUntil < 0,
      });
    }
  }
  return out
    .sort((a, b) => {
      if (a.dueDate === null) return 1;
      if (b.dueDate === null) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    })
    .slice(0, limit);
}

/** Nota média das avaliações mensais + quantas foram feitas. */
export interface Satisfaction {
  avg: number | null;
  count: number;
}
export function satisfaction(proposals: Proposal[]): Satisfaction {
  let sum = 0;
  let count = 0;
  for (const p of proposals) {
    for (const r of p.reviews ?? []) {
      sum += r.rating;
      count += 1;
    }
  }
  return { avg: count ? sum / count : null, count };
}

/** Valor médio das propostas fechadas. */
export function avgTicket(proposals: Proposal[]): number | null {
  const closed = proposals.filter((p) => (CLOSED_STATUSES as readonly string[]).includes(p.status));
  if (!closed.length) return null;
  return Math.round(closed.reduce((s, p) => s + p.total, 0) / closed.length);
}

/** Propostas enviadas e sem resposta há N+ dias — pra cobrar retorno. */
export interface StaleProposal {
  id: string;
  title: string;
  client: string;
  days: number;
}
export function staleProposals(proposals: Proposal[], minDays = 3): StaleProposal[] {
  const now = Date.now();
  return proposals
    .filter((p) => (p.status === 'sent' || p.status === 'changes_requested') && !p.respondedAt)
    .map((p) => ({
      id: p.id,
      title: p.title?.trim() || `#${p.proposalNumber}`,
      client: p.client?.name?.trim() || '',
      days: Math.floor((now - new Date(p.createdAt).getTime()) / 86_400_000),
    }))
    .filter((p) => p.days >= minDays)
    .sort((a, b) => b.days - a.days);
}

/** Aprovadas / (aprovadas + recusadas). Ignora rascunho, enviada, pedido de alteração. */
export function conversionRate(proposals: Proposal[]): number | null {
  const approved = proposals.filter((p) => (CLOSED_STATUSES as readonly string[]).includes(p.status)).length;
  const declined = proposals.filter((p) => p.status === 'declined').length;
  const total = approved + declined;
  return total === 0 ? null : approved / total;
}

function diffDays(a: string | Date, b: string | Date): number {
  const da = a instanceof Date ? a : new Date(a);
  const db = b instanceof Date ? b : new Date(b);
  return (da.getTime() - db.getTime()) / 86_400_000;
}

/** Dias entre enviar a proposta e o cliente responder. */
export function avgResponseDays(proposals: Proposal[]): number | null {
  const samples = proposals.filter((p) => p.respondedAt).map((p) => diffDays(p.respondedAt as string, p.createdAt));
  if (!samples.length) return null;
  return samples.reduce((a, b) => a + b, 0) / samples.length;
}

/** Dias entre iniciar a execução e marcar como entregue. */
export function avgDeliveryDays(proposals: Proposal[]): number | null {
  const samples = proposals
    .filter((p) => p.startedAt && p.deliveredAt)
    .map((p) => diffDays(p.deliveredAt as string, p.startedAt as string));
  if (!samples.length) return null;
  return samples.reduce((a, b) => a + b, 0) / samples.length;
}

/** "20 dias úteis" → 20, "2 semanas" → 14, "1 mês" → 30. Sem número reconhecível → null. */
export function parseDaysFromTimeline(text: string | null | undefined): number | null {
  if (!text) return null;
  const m = text.toLowerCase().match(/(\d+)\s*(dia|dias|semana|semanas|m[eê]s|meses)/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (m[2].startsWith('semana')) return n * 7;
  if (m[2].startsWith('m')) return n * 30;
  return n;
}

export interface ServiceTimelineSuggestion {
  serviceName: string;
  estimatedDays: number;
  avgRealDays: number;
  sampleCount: number;
  suggestion: string;
}

const DELAY_MARGIN = 1.2; // só alerta se a média real passar o estimado em 20%+
const MIN_SAMPLES = 2;

/** Compara o prazo padrão do serviço com o tempo real de execução das entregas. */
export function analyzeServiceTimelines(services: Service[], proposals: Proposal[]): ServiceTimelineSuggestion[] {
  const delivered = proposals.filter((p) => p.startedAt && p.deliveredAt);
  const out: ServiceTimelineSuggestion[] = [];

  for (const service of services) {
    const estimated = parseDaysFromTimeline(service.defaultTimeline);
    if (!estimated) continue;

    const samples = delivered
      .filter((p) => p.items.some((it) => it.name.trim().toLowerCase() === service.name.trim().toLowerCase()))
      .map((p) => diffDays(p.deliveredAt as string, p.startedAt as string));

    if (samples.length < MIN_SAMPLES) continue;
    const avgReal = samples.reduce((a, b) => a + b, 0) / samples.length;
    if (avgReal <= estimated * DELAY_MARGIN) continue;

    const avgRealRounded = Math.round(avgReal);
    out.push({
      serviceName: service.name,
      estimatedDays: estimated,
      avgRealDays: avgRealRounded,
      sampleCount: samples.length,
      suggestion: `"${service.name}" tá com prazo padrão de ${estimated} dias, mas a média real de entrega é ${avgRealRounded} dias (${samples.length} projeto${samples.length === 1 ? '' : 's'}). Vale ajustar o prazo padrão desse serviço no catálogo.`,
    });
  }

  return out;
}
