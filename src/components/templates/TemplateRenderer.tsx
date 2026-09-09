'use client';
import { CommercialSummary } from './CommercialSummary';

import { included, commercialTotals, commercialPaymentTerms } from '@/lib/commercial';
import { formatBRL } from '@/lib/money';


import React from 'react';
import type { QuoteView } from '@/lib/quoteView';
import { TemplateCyber } from './TemplateCyber';
import { TemplateMinimalista } from './TemplateMinimalista';
import { TemplateExecutivo } from './TemplateExecutivo';
import { TemplateEscopo } from './TemplateEscopo';
import { TemplateEssencial } from './TemplateEssencial';
import { TemplateDetalhado } from './TemplateDetalhado';

export const TEMPLATE_OPTIONS = [
  { id: 'cyber', name: 'Premium Digital' },
  { id: 'minimalista', name: 'Editorial' },
  { id: 'executivo', name: 'Corporativo' },
  { id: 'escopo', name: 'Escopo de Projeto' },
  { id: 'essencial', name: 'Orçamento Essencial' },
  { id: 'detalhado', name: 'Orçamento Detalhado' },
] as const;

export type TemplateId = (typeof TEMPLATE_OPTIONS)[number]['id'];

const MAP: Record<TemplateId, React.ComponentType<{ q: QuoteView }>> = {
  cyber: TemplateCyber,
  minimalista: TemplateMinimalista,
  executivo: TemplateExecutivo,
  escopo: TemplateEscopo,
  essencial: TemplateEssencial,
  detalhado: TemplateDetalhado,
};

export function TemplateRenderer({ template, q }: { template: string; q: QuoteView }) {
  const Component = MAP[(template as TemplateId)] ?? TemplateCyber;
  if (!q.commercial) return <><Component q={q} /></>;
  const c = q.commercial;
  const rendered: QuoteView = { ...q, total: commercialTotals(q.items, c).total, paymentTerms: commercialPaymentTerms(q.items, c, formatBRL), items: q.items.filter(i => included(i, c)).map(i => ({ ...i, name: i.billingType === 'monthly' ? i.name + ' · ' + c.months + ' mensalidades' : i.name, quantity: i.quantity * (i.billingType === 'monthly' ? c.months : 1), price: Math.round(i.quantity * i.unitPrice) * (i.billingType === 'monthly' ? c.months : 1) })) };
  return <><Component q={rendered} /><CommercialSummary q={q} /></>;
}


