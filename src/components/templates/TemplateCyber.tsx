'use client';

import React from 'react';
import { formatBRL } from '@/lib/money';
import { ItemExtras } from './ItemExtras';
import { DEFAULT_PAYMENT_TERMS, type QuoteView } from '@/lib/quoteView';

const money = formatBRL;
const EMBER = '#ff7a1a';

export const TemplateCyber = ({ q }: { q: QuoteView }) => {
  const { client, company, items } = q;

  return (
    <div className="relative min-h-full w-full overflow-hidden bg-[#08080a] px-4 py-20 text-white print:bg-white print:p-0 print:text-black">
      {/* brilho único, discreto */}
      <div
        className="pointer-events-none absolute -top-40 right-[-10%] h-[720px] w-[720px] rounded-full opacity-[.14] blur-[160px] print:hidden"
        style={{ background: EMBER }}
      />

      <article className="relative mx-auto flex min-h-[29.7cm] w-full max-w-[21cm] flex-col rounded-[2rem] bg-white/[.04] px-10 py-16 ring-1 ring-white/10 backdrop-blur-sm print:min-h-0 print:rounded-none print:bg-white print:px-0 print:py-0 print:ring-0 md:px-16 md:py-20">
        {/* Cabeçalho */}
        <header className="flex items-start justify-between gap-8 border-b border-white/10 pb-12 print:border-black/15">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.32em] text-white/45 print:text-black/45">
              Proposta {q.proposalNumber}
            </p>
            <h1 className="mt-4 font-display text-[3.4rem] font-light leading-[.95] tracking-[-.03em] md:text-[4.6rem]">
              {company.name}
            </h1>
            {company.cnpj && (
              <p className="mt-2 font-mono text-[11px] tracking-[.18em] text-white/40 print:text-black/45">
                CNPJ {company.cnpj}
              </p>
            )}
          </div>
          <div
            className="shrink-0 rounded-full px-3 py-1 font-mono text-[9px] uppercase tracking-[.24em]"
            style={{ color: EMBER, border: `1px solid ${EMBER}55` }}
          >
            Documento comercial
          </div>
        </header>

        {/* Cliente */}
        {client && (
          <div className="flex flex-wrap items-end justify-between gap-6 pt-12">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.26em] text-white/45 print:text-black/45">Preparado para</p>
              <p className="mt-2 font-display text-3xl font-light">{client.name}</p>
              {client.company && (
                <p className="mt-1 font-mono text-xs uppercase tracking-[.16em] text-white/45 print:text-black/50">
                  {client.company}
                </p>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-1 text-right font-mono text-[11px]">
              <div>
                <dt className="text-[9px] uppercase tracking-[.2em] text-white/35 print:text-black/45">Validade</dt>
                <dd className="mt-0.5 text-white/80 print:text-black">{q.validityDays}</dd>
              </div>
              <div>
                <dt className="text-[9px] uppercase tracking-[.2em] text-white/35 print:text-black/45">Prazo</dt>
                <dd className="mt-0.5 text-white/80 print:text-black">{q.timeline}</dd>
              </div>
            </dl>
          </div>
        )}

        {/* Itens */}
        <section className="mt-16 flex-1">
          <div className="flex items-baseline justify-between border-b border-white/15 pb-4 font-mono text-[10px] uppercase tracking-[.24em] text-white/45 print:border-black/20 print:text-black/50">
            <span>Escopo</span>
            <span>Investimento</span>
          </div>
          {items.map((service, index) => (
            <div
              key={service.id}
              className="grid grid-cols-[auto_1fr_auto] items-start gap-6 border-b border-white/[.09] py-8 print:border-black/10"
            >
              <span className="font-mono text-xs" style={{ color: EMBER }}>
                {(index + 1).toString().padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-display text-[1.6rem] font-normal leading-tight">{service.name}</h3>
                {service.description && (
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50 print:text-black/60">
                    {service.description}
                  </p>
                )}
                <ItemExtras item={service} money={money} tone="dark" />
              </div>
              <strong className="whitespace-nowrap font-mono text-base font-medium tabular-nums">
                {money(service.price)}
              </strong>
            </div>
          ))}
        </section>

        {/* Total */}
        <section className="mt-16 grid gap-10 border-t border-white/15 pt-12 print:border-black/20 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-md">
            <p className="font-mono text-[10px] uppercase tracking-[.24em] text-white/45 print:text-black/45">Condições</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/50 print:text-black/60">{q.notes}</p>
            <p className="mt-4 font-mono text-[11px] text-white/45 print:text-black/50">
              PGTO · <span className="text-white/80 print:text-black/70">{q.paymentTerms || DEFAULT_PAYMENT_TERMS}</span>
            </p>
          </div>
          <div className="md:text-right">
            <p className="font-mono text-[10px] uppercase tracking-[.24em] text-white/45 print:text-black/45">Investimento total</p>
            <p className="mt-1 font-display text-[3.8rem] font-light leading-none tracking-[-.03em] tabular-nums md:text-[5rem]">
              {money(q.total)}
            </p>
          </div>
        </section>

        {/* Rodapé */}
        <footer className="mt-20 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-8 font-mono text-[10px] uppercase tracking-[.16em] text-white/40 print:border-black/15 print:text-black/50">
          <span>{company.email} · {company.phone}</span>
          <span>Emitido pelo NEX · {new Date().toLocaleDateString('pt-BR')}</span>
        </footer>
      </article>
    </div>
  );
};
