'use client';

import React from 'react';
import { formatBRL } from '@/lib/money';
import { ItemExtras } from './ItemExtras';
import { DEFAULT_PAYMENT_TERMS, type QuoteView } from '@/lib/quoteView';

const money = formatBRL;
const BRASS = '#c9a86a';

export const TemplateExecutivo = ({ q }: { q: QuoteView }) => {
  const { client, company, items } = q;
  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-full w-full bg-[#0c0c0d] px-4 py-16 text-white print:bg-white print:p-0 print:text-black">
      <article className="mx-auto flex min-h-[29.7cm] w-full max-w-[21cm] flex-col bg-[#111113] px-10 py-16 shadow-[0_60px_140px_-40px_rgba(0,0,0,.8)] ring-1 ring-white/[.06] print:min-h-0 print:bg-white print:px-0 print:py-0 print:shadow-none print:ring-0 md:px-20 md:py-20">
        {/* Cabeçalho */}
        <header className="flex items-start justify-between gap-8 border-b border-white/10 pb-12 print:border-black/15">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full ring-1 ring-white/15 print:ring-black/20">
              {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={company.logoUrl} alt={company.name} className="max-h-full max-w-full rounded-full" />
              ) : (
                <span className="font-display text-xl">{company.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <p className="font-grotesque text-sm font-semibold uppercase tracking-[.2em]">{company.name}</p>
              {company.cnpj && (
                <p className="mt-1 text-[11px] uppercase tracking-[.16em] text-white/40 print:text-black/45">
                  CNPJ {company.cnpj}
                </p>
              )}
            </div>
          </div>
          <div className="text-right text-[11px] leading-relaxed text-white/45 print:text-black/50">
            <p>{company.email}</p>
            <p>{company.phone}</p>
          </div>
        </header>

        {/* Título */}
        <div className="flex flex-wrap items-end justify-between gap-6 pt-14">
          <div>
            <p
              className="mb-3 font-grotesque text-[11px] font-semibold uppercase tracking-[.3em]"
              style={{ color: BRASS }}
            >
              Proposta comercial
            </p>
            <h1 className="font-display text-[3.2rem] font-light leading-none tracking-[-.02em] md:text-[4rem]">
              Nº {q.proposalNumber}
            </h1>
          </div>
          <dl className="grid grid-cols-3 gap-x-10 gap-y-1 text-right text-xs">
            {[
              ['Emissão', date],
              ['Validade', q.validityDays],
              ['Entrega', q.timeline],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-grotesque text-[10px] uppercase tracking-[.18em] text-white/35 print:text-black/45">
                  {k}
                </dt>
                <dd className="mt-1 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Cliente */}
        {client && (
          <section className="mt-14 border-l-2 py-1 pl-6" style={{ borderColor: BRASS }}>
            <p className="font-grotesque text-[10px] uppercase tracking-[.22em] text-white/35 print:text-black/45">
              Preparado exclusivamente para
            </p>
            <p className="mt-2 font-display text-3xl font-light">{client.name}</p>
            <p className="mt-1 text-sm text-white/45 print:text-black/55">
              {[client.company, client.document, client.email].filter(Boolean).join('  ·  ')}
            </p>
          </section>
        )}

        {/* Itens */}
        <section className="mt-16 flex-1">
          <div className="flex items-baseline justify-between border-b border-white/15 pb-4 font-grotesque text-[10px] uppercase tracking-[.22em] text-white/40 print:border-black/20 print:text-black/50">
            <span>Item / descrição</span>
            <span>Valor</span>
          </div>
          {items.map((service, i) => (
            <div
              key={service.id}
              className="grid grid-cols-[auto_1fr_auto] items-start gap-6 border-b border-white/[.08] py-7 print:border-black/10"
            >
              <span className="font-grotesque text-xs font-semibold" style={{ color: BRASS }}>
                {(i + 1).toString().padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-display text-xl font-normal leading-tight">{service.name}</h3>
                {service.description && (
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/45 print:text-black/60">
                    {service.description}
                  </p>
                )}
                <ItemExtras item={service} money={money} tone="dark" />
              </div>
              <strong className="whitespace-nowrap font-grotesque text-base font-semibold tabular-nums">
                {money(service.price)}
              </strong>
            </div>
          ))}
        </section>

        {/* Total */}
        <section className="mt-14 grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-md">
            <p className="font-grotesque text-[10px] uppercase tracking-[.22em] text-white/35 print:text-black/45">
              Observações e condições
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/50 print:text-black/60">
              {q.notes}
            </p>
            <p className="mt-4 text-xs text-white/40 print:text-black/50">
              Pagamento · <span className="text-white/70 print:text-black/70">{q.paymentTerms || DEFAULT_PAYMENT_TERMS}</span>
            </p>
          </div>
          <div className="md:text-right">
            <p className="font-grotesque text-[10px] uppercase tracking-[.22em] text-white/35 print:text-black/45">
              Investimento total
            </p>
            <p
              className="mt-1 font-display text-[3.6rem] font-light leading-none tracking-[-.03em] tabular-nums md:text-[4.4rem]"
              style={{ color: BRASS }}
            >
              {money(q.total)}
            </p>
          </div>
        </section>

        {/* Assinaturas */}
        <footer className="mt-24 grid gap-12 border-t border-white/10 pt-14 print:border-black/15 md:grid-cols-2">
          {[company.name, client?.name || 'Cliente'].map((name, idx) => (
            <div key={idx} className="pt-10">
              <div className="border-t border-white/25 print:border-black/40" />
              <p className="mt-3 font-grotesque text-xs font-semibold uppercase tracking-[.14em]">{name}</p>
              <p className="text-[10px] uppercase tracking-[.14em] text-white/35 print:text-black/45">
                {idx === 0 ? company.cnpj || 'Emitente' : 'De acordo · assinatura'}
              </p>
            </div>
          ))}
        </footer>
      </article>
    </div>
  );
};
