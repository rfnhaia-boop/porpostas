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
