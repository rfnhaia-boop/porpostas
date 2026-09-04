'use client';

import React from 'react';
import { formatBRL } from '@/lib/money';
import { ItemExtras } from './ItemExtras';
import { DEFAULT_PAYMENT_TERMS, type QuoteView } from '@/lib/quoteView';

const money = formatBRL;
const PINE = '#0d5b43';

export const TemplateDetalhado = ({ q }: { q: QuoteView }) => {
  const { items, client, company } = q;

  return (
    <div className="min-h-full bg-[#dfe6e2] px-4 py-16 text-[#0f221c] print:bg-white print:p-0 md:px-12">
      <article className="mx-auto min-h-[29.7cm] w-full max-w-[21cm] bg-white px-10 py-14 shadow-[0_50px_120px_-30px_rgba(14,45,35,.3)] ring-1 ring-black/[.04] print:min-h-0 print:px-0 print:py-0 print:shadow-none print:ring-0 md:px-16 md:py-20">
        {/* Cabeçalho */}
        <header className="flex flex-col justify-between gap-8 border-b pb-12 md:flex-row md:items-end" style={{ borderColor: PINE }}>
          <div>
            <p className="font-grotesque text-[11px] font-semibold uppercase tracking-[.3em]" style={{ color: PINE }}>
              Mapa detalhado de custos
            </p>
            <h1 className="mt-4 font-display text-[3.4rem] font-light leading-[.95] tracking-[-.02em] md:text-[4.6rem]">
              Orçamento
              <br />
              detalhado
            </h1>
          </div>
          <div className="font-grotesque text-sm md:text-right">
            <p className="text-base font-semibold uppercase tracking-[.08em]">{company.name}</p>
            <p className="mt-2 text-black/50">CNPJ {company.cnpj}</p>
            <p className="text-black/50">{company.email} · {company.phone}</p>
          </div>
        </header>

        {/* Meta */}
        <section className="mt-10 grid gap-6 border border-black/10 bg-[#f4f7f5] px-6 py-6 font-grotesque text-sm md:grid-cols-4">
          <div className="md:col-span-2">
            <span className="block text-[10px] font-semibold uppercase tracking-[.2em] text-black/40">Cliente</span>
            <strong className="mt-1 block">{client?.name ?? '—'}</strong>
            <p className="text-black/50">{[client?.company, client?.document].filter(Boolean).join(' · ')}</p>
          </div>
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-[.2em] text-black/40">Referência</span>
            <strong className="mt-1 block">{q.proposalNumber}</strong>
          </div>
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-[.2em] text-black/40">Validade</span>
            <strong className="mt-1 block">{q.validityDays}</strong>
          </div>
        </section>

        {/* Tabela */}
        <section className="mt-12">
          <div
            className="grid grid-cols-[44px_1fr_130px] px-4 py-3 font-grotesque text-[10px] font-semibold uppercase tracking-[.2em] text-white md:grid-cols-[52px_1fr_80px_140px]"
            style={{ backgroundColor: PINE }}
          >
            <span>Item</span>
            <span>Descrição técnica</span>
            <span className="hidden text-center md:block">Qtd.</span>
            <span className="text-right">Subtotal</span>
          </div>
          {items.map((service, index) => (
            <div
              key={service.id}
              className="grid grid-cols-[44px_1fr_130px] border-x border-b border-black/10 px-4 py-7 md:grid-cols-[52px_1fr_80px_140px]"
            >
              <span className="font-grotesque text-sm font-semibold" style={{ color: PINE }}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="pr-4">
                <h3 className="font-display text-lg font-normal leading-tight">{service.name}</h3>
                {service.description && (
                  <p className="mt-1.5 text-xs leading-relaxed text-black/55">{service.description}</p>
                )}
                <ItemExtras item={service} money={money} tone="light" />
              </div>
              <span className="hidden text-center font-grotesque text-sm text-black/45 md:block">
                {Number.isInteger(service.quantity) ? service.quantity : service.quantity.toFixed(2)} {service.unitLabel}
              </span>
              <strong className="text-right font-grotesque tabular-nums">{money(service.price)}</strong>
            </div>
          ))}
        </section>

        {/* Escopo + Total */}
        <section className="mt-12 grid gap-10 md:grid-cols-[1fr_300px]">
          <div>
            <p className="font-grotesque text-[10px] font-semibold uppercase tracking-[.2em]" style={{ color: PINE }}>
              Escopo, condições e premissas
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-black/60">{q.notes}</p>
          </div>
          <div className="border-t-4 bg-[#eef4f1] p-6" style={{ borderColor: PINE }}>
            <div className="flex justify-between font-grotesque text-xs text-black/50">
              <span>Itens</span>
              <span>{items.length}</span>
            </div>
            <div className="mt-5">
              <p className="font-grotesque text-[10px] font-semibold uppercase tracking-[.16em] text-black/45">Total geral</p>
              <strong className="mt-1 block font-display text-[2.6rem] font-light leading-none tracking-[-.02em] tabular-nums" style={{ color: PINE }}>
                {money(q.total)}
              </strong>
            </div>
          </div>
        </section>

        {/* Fechamento */}
        <section className="mt-14 grid gap-8 border-t border-black/10 pt-10 font-grotesque md:grid-cols-3">
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-[.2em] text-black/40">Prazo de execução</span>
            <strong className="mt-1 block text-sm">{q.timeline}</strong>
          </div>
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-[.2em] text-black/40">Pagamento</span>
            <strong className="mt-1 block text-sm">{q.paymentTerms || DEFAULT_PAYMENT_TERMS}</strong>
          </div>
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-[.2em] text-black/40">Aceite do cliente</span>
            <div className="mt-8 border-b border-black/30" />
          </div>
        </section>
      </article>
    </div>
  );
};
