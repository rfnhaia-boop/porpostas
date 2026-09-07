// Resumo de valor do projeto — alimenta o relatório de encerramento e o card
// de "projeto concluído" no portal. Tudo derivado de uma proposta só.

import type { Proposal } from './api';
import type { MonthPoint } from './analytics';

export interface DeliveryEntry {
  title: string;
  url: string;
  month: string; // "2026-09" — vazio se for de etapa sem mês
  context: string;
}

export interface ReviewPoint {
  month: string;
  label: string;
  rating: number;
  comment: string;
}

export interface ProjectSummary {
  months: number;
  totalPaid: number; // centavos
  deliveriesCount: number;
  blocksTotal: number;
  blocksDone: number;
  reviewAvg: number | null;
  reviewCount: number;
  deliveriesByMonth: MonthPoint[];
  reviews: ReviewPoint[];
  deliveries: DeliveryEntry[];
}

function ymLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
}
function ymLabelLong(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export function buildProjectSummary(p: Proposal): ProjectSummary {
  const start = p.startedAt ? new Date(p.startedAt) : new Date(p.createdAt);
  const end = p.deliveredAt ? new Date(p.deliveredAt) : new Date();
  const months = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)),
  );

  const totalPaid = (p.payments ?? [])
    .filter((pay) => pay.status === 'paid')
    .reduce((s, pay) => s + pay.amount, 0);

  const deliveries: DeliveryEntry[] = [];
  const byMonth = new Map<string, number>();
  for (const u of p.progressUpdates ?? []) {
    for (const d of u.deliveries ?? []) {
      deliveries.push({
        title: d.title || 'Entrega',
        url: d.url,
        month: u.month,
        context: ymLabelLong(u.month),
      });
      byMonth.set(u.month, (byMonth.get(u.month) ?? 0) + 1);
    }
  }
  for (const b of p.blocks ?? []) {
    if (b.link) {
      deliveries.push({
        title: b.title,
        url: b.link,
        month: '',
        context: b.status === 'done' ? 'Etapa concluída' : 'Etapa',
      });
    }
  }

  const months2 = [...byMonth.keys()].sort();
  const deliveriesByMonth: MonthPoint[] = months2.map((k) => ({
    key: k,
    label: ymLabel(k),
    value: byMonth.get(k) ?? 0,
  }));

  const reviewsRaw = (p.reviews ?? []).slice().sort((a, b) => a.month.localeCompare(b.month));
  const reviews: ReviewPoint[] = reviewsRaw.map((r) => ({
    month: r.month,
    label: ymLabelLong(r.month),
    rating: r.rating,
    comment: r.comment,
  }));
  const reviewCount = reviews.length;
  const reviewAvg = reviewCount
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
    : null;

  const blocks = p.blocks ?? [];

  return {
    months,
    totalPaid,
    deliveriesCount: deliveries.length,
    blocksTotal: blocks.length,
    blocksDone: blocks.filter((b) => b.status === 'done').length,
    reviewAvg,
    reviewCount,
    deliveriesByMonth,
    reviews,
    deliveries,
  };
}
