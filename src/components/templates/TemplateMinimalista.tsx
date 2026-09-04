'use client';

import React from 'react';
import { formatBRL } from '@/lib/money';
import { ItemExtras } from './ItemExtras';
import { DEFAULT_PAYMENT_TERMS, type QuoteView } from '@/lib/quoteView';

const money = formatBRL;

export const TemplateMinimalista = ({ q }: { q: QuoteView }) => {
  const { items, client, company } = q;
  const date = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="flex min-h-full w-full flex-col items-center bg-[#e6e3da] px-4 py-16 text-[#161513] print:bg-white print:p-0">
      <article className="flex min-h-[29.7cm] w-full max-w-[21cm] flex-1 flex-col bg-[#faf9f4] px-10 py-14 shadow-[0_50px_120px_-30px_rgba(0,0,0,.28)] ring-1 ring-black/[.04] print:min-h-0 print:px-0 print:py-0 print:shadow-none print:ring-0 md:px-20 md:py-20">
        {/* Cabeçalho — grade arquitetural */}
        <div className="grid grid-cols-2 border-y border-black/15 md:grid-cols-4">
          <div className="border-r border-black/15 py-7 pr-6">
            <h1 className="font-display text-[2.6rem] font-light leading-none tracking-[-.02em]">{company.name}</h1>
          </div>
          {[
            ['Documento', q.proposalNumber],
            ['Data', date],
            ['Validade', q.validityDays],
          ].map(([k, v], i) => (
            <div key={k} className={`py-7 pl-6 ${i < 2 ? 'border-r border-black/15' : ''} md:pl-6`}>
              <p className="font-grotesque text-[10px] font-semibold uppercase tracking-[.22em] text-black/45">{k}</p>
              <p className="mt-1.5 font-grotesque text-sm font-semibold">{v}</p>
            </div>
          ))}
        </div>

        {/* Cliente */}
        {client && (
          <div className="mt-16">
            <p className="font-grotesque text-[10px] font-semibold uppercase tracking-[.22em] text-black/45">Preparado para</p>
            <h2 className="mt-3 font-display text-[3.4rem] font-light leading-[1.02] tracking-[-.02em]">{client.name}</h2>
            {(client.company || client.document) && (
              <p className="mt-2 font-grotesque text-xs uppercase tracking-[.2em] text-black/50">
                {[client.company, client.document].filter(Boolean).join('   ·   ')}
              </p>
            )}
          </div>
        )}

        {/* Itens */}
        <div className="mt-16 flex-1">
          <div className="flex border-b border-black/20 pb-4 font-grotesque text-[10px] font-semibold uppercase tracking-[.22em] text-black/45">
            <div className="w-14">Nº</div>
            <div className="flex-1">Especificação</div>
            <div className="w-40 text-right">Valor</div>
          </div>
          {items.map((service, idx) => (
            <div key={service.id} className="flex items-start border-b border-black/10 py-9">
              <div className="w-14 font-display text-3xl font-light text-black/30">
                {(idx + 1).toString().padStart(2, '0')}
              </div>
              <div className="flex-1 pr-10">
                <h3 className="font-display text-[1.6rem] font-normal leading-tight tracking-[-.01em]">{service.name}</h3>
                {service.description && (
                  <p className="mt-2 max-w-xl text-sm font-light leading-relaxed text-black/60">{service.description}</p>
                )}
                <ItemExtras item={service} money={money} tone="light" />
              </div>
              <div className="w-40 text-right font-grotesque text-lg font-semibold tabular-nums">
                {money(service.price)}
              </div>
            </div>
          ))}
        </div>

        {/* Condições + Total */}
        <div className="mt-16 grid gap-10 border-t-2 border-black pt-12 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-md">
            <p className="font-grotesque text-[10px] font-semibold uppercase tracking-[.22em] text-black/45">Condições comerciais</p>
            <p className="mt-3 whitespace-pre-wrap text-sm font-light leading-relaxed text-black/65">{q.notes}</p>
            <div className="mt-5 flex flex-wrap gap-x-8 gap-y-1 font-grotesque text-xs text-black/55">
              <span>Prazo · <b className="font-semibold text-black/75">{q.timeline}</b></span>
              <span>Pagamento · <b className="font-semibold text-black/75">{q.paymentTerms || DEFAULT_PAYMENT_TERMS}</b></span>
            </div>
          </div>
          <div className="md:text-right">
            <p className="font-grotesque text-[10px] font-semibold uppercase tracking-[.22em] text-black/45">Total consolidado</p>
            <p className="mt-1 font-display text-[3.8rem] font-light leading-none tracking-[-.03em] tabular-nums md:text-[5rem]">
              {money(q.total)}
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <footer className="mt-20 flex flex-wrap items-end justify-between gap-4 border-t border-black/15 pt-8 font-grotesque text-[10px] uppercase tracking-[.18em] text-black/45">
          <div>
            <p className="font-semibold text-black/70">{company.name} — {company.cnpj}</p>
            <p className="mt-0.5">{company.email} · {company.phone}</p>
          </div>
          <div className="text-right">
            <p>De acordo · assinatura</p>
            <div className="ml-auto mt-6 h-px w-48 bg-black/30" />
          </div>
        </footer>
      </article>
    </div>
  );
};
