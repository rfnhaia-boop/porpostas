'use client';

import React from 'react';
import { formatBRL } from '@/lib/money';
import { ItemExtras } from './ItemExtras';
import { DEFAULT_PAYMENT_TERMS, type QuoteView } from '@/lib/quoteView';

const money = formatBRL;

export const TemplateEssencial = ({ q }: { q: QuoteView }) => {
  const client = q.client;
  const company = q.company;

  return (
    <div className="min-h-full bg-[#efe9dd] px-4 py-16 text-[#1c1a14] print:bg-white print:p-0 md:px-12">
      <article className="mx-auto min-h-[29.7cm] w-full max-w-[21cm] overflow-hidden bg-[#fdfbf4] shadow-[0_50px_120px_-30px_rgba(28,26,20,.35)] ring-1 ring-black/[.04] print:min-h-0 print:shadow-none print:ring-0">
        {/* Cabeçalho */}
        <header className="px-10 pb-14 pt-16 md:px-20 md:pt-20">
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.32em] text-[#b1502f] font-grotesque">
            <span className="h-px w-8 bg-[#b1502f]" />
            Proposta comercial
          </div>
          <h1 className="mt-8 max-w-2xl font-display text-[3.4rem] font-light leading-[1.02] tracking-[-.02em] md:text-[5rem]">
            Claro no escopo.
            <br />
            <span className="italic text-[#b1502f]">Justo</span> no valor.
          </h1>
          <div className="mt-12 grid gap-8 border-t border-black/10 pt-8 text-sm md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-black/40 font-grotesque">De</p>
              <p className="mt-2 font-grotesque text-base font-semibold">{company.name}</p>
              {company.cnpj && <p className="mt-0.5 text-black/45">{company.cnpj}</p>}
              {company.email && <p className="text-black/45">{company.email}</p>}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-black/40 font-grotesque">Proposta nº</p>
              <p className="mt-2 font-grotesque text-base font-semibold">{q.proposalNumber}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-black/40 font-grotesque">Validade</p>
              <p className="mt-2 font-grotesque text-base font-semibold">{q.validityDays}</p>
            </div>
          </div>
        </header>

        {/* Preparado para */}
        {client && (
          <section className="border-y border-black/10 bg-[#f6f1e5] px-10 py-10 md:px-20">
            <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-black/40 font-grotesque">Preparado para</p>
            <p className="mt-3 font-display text-3xl font-light tracking-[-.01em]">{client.name}</p>
            {(client.company || client.document) && (
              <p className="mt-1 text-sm text-black/50">{client.company || client.document}</p>
            )}
          </section>
        )}

        {/* Itens */}
        <section className="px-10 py-14 md:px-20">
          <div className="mb-2 flex items-baseline justify-between border-b border-black/15 pb-4 text-[10px] font-semibold uppercase tracking-[.24em] text-black/40 font-grotesque">
            <span>Escopo</span>
            <span>Investimento</span>
          </div>
          {q.items.map((service, index) => (
            <div
              key={service.id}
              className="grid grid-cols-[auto_1fr_auto] items-start gap-6 border-b border-black/10 py-8"
            >
              <span className="font-grotesque text-xs font-semibold text-[#b1502f]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-display text-[1.4rem] font-normal leading-tight tracking-[-.01em]">{service.name}</h3>
                {service.description && (
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-black/55">{service.description}</p>
                )}
                <ItemExtras item={service} money={money} tone="light" />
              </div>
              <strong className="whitespace-nowrap font-grotesque text-lg font-semibold tabular-nums">
                {money(service.price)}
              </strong>
            </div>
          ))}

          {/* Total — o momento */}
          <div className="mt-14 grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
            <div className="max-w-md">
              <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-black/40 font-grotesque">Condições</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-black/55">{q.notes}</p>
              <p className="mt-4 text-xs text-black/45">
                Pagamento · <span className="font-medium text-black/65">{q.paymentTerms || DEFAULT_PAYMENT_TERMS}</span>
              </p>
            </div>
            <div className="md:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-black/40 font-grotesque">Total</p>
              <p className="mt-1 font-display text-[3.6rem] font-light leading-none tracking-[-.03em] tabular-nums md:text-[4.5rem]">
                {money(q.total)}
              </p>
            </div>
          </div>
        </section>

        {/* Rodapé */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 px-10 py-8 text-[10px] uppercase tracking-[.2em] text-black/40 font-grotesque md:px-20">
          <span>Prazo estimado · {q.timeline}</span>
          <span>{company.name}</span>
        </footer>
      </article>
    </div>
  );
};
