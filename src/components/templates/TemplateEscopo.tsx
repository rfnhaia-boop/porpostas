'use client';

import React, { useState } from 'react';
import { formatBRL } from '@/lib/money';
import { DEFAULT_PAYMENT_TERMS, type QuoteView } from '@/lib/quoteView';
import { Plus } from 'lucide-react';

const money = formatBRL;
const EMBER = '#ff7a1a';

export const TemplateEscopo = ({ q }: { q: QuoteView }) => {
  const { items, client, company } = q;
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="min-h-full w-full bg-[#08080a] px-4 py-24 text-white print:bg-white print:py-0 print:text-black">
      <div className="mx-auto w-full max-w-3xl">
        {/* Cabeçalho centrado */}
        <header className="text-center">
          <p className="font-grotesque text-xs font-semibold uppercase tracking-[.28em] text-white/50 print:text-black/50">
            {company.name}
          </p>
          {company.cnpj && (
            <p className="mt-1 font-grotesque text-[11px] tracking-[.16em] text-white/35 print:text-black/45">
              CNPJ {company.cnpj}
            </p>
          )}
          <p className="mt-10 font-grotesque text-[11px] font-semibold uppercase tracking-[.3em]" style={{ color: EMBER }}>
            Proposta por escopo
          </p>
          <h1 className="mt-4 font-display text-[3.4rem] font-light leading-[.98] tracking-[-.03em] md:text-[5rem]">
            Entregas
            <br />
            do projeto
          </h1>
          {client && (
            <p className="mt-8 font-grotesque text-xs uppercase tracking-[.24em] text-white/50 print:text-black/55">
              Preparado para {client.name}
            </p>
          )}
        </header>

        {/* Entregas */}
        <div className="mt-20 space-y-3">
          {items.map((service, i) => {
            const open = openId === service.id;
            return (
              <div
                key={service.id}
                className="rounded-2xl border border-white/10 bg-white/[.03] print:rounded-none print:border-0 print:border-b print:border-black/10 print:bg-transparent"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : service.id)}
                  className="flex w-full items-center justify-between gap-6 px-7 py-7 text-left print:px-0"
                >
                  <div className="flex items-center gap-5">
                    <span className="font-grotesque text-xs font-semibold" style={{ color: EMBER }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-display text-[1.5rem] font-normal leading-tight">{service.name}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-grotesque text-base font-medium tabular-nums">{money(service.price)}</span>
                    {service.description && (
                      <Plus
                        size={18}
                        className={`shrink-0 text-white/40 transition-transform print:hidden ${open ? 'rotate-45' : ''}`}
                      />
                    )}
                  </div>
                </button>
                {service.description && open && (
                  <div className="border-t border-white/10 px-7 pb-7 pt-5 pl-[3.75rem] text-[15px] leading-relaxed text-white/55 print:hidden">
                    {service.description}
                  </div>
                )}
                {service.description && (
                  <div className="hidden border-t border-black/10 pb-6 pt-4 pl-[3.75rem] text-sm leading-relaxed text-black/70 print:block print:pl-0">
                    {service.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="mt-20 rounded-3xl border border-white/10 bg-white/[.03] p-12 text-center print:rounded-none print:border-0 print:border-t print:border-black/20 print:bg-transparent print:p-0 print:pt-12">
          <p className="font-grotesque text-[11px] font-semibold uppercase tracking-[.26em] text-white/50 print:text-black/50">
            Investimento necessário
          </p>
          <p className="mt-3 font-display text-[3.8rem] font-light leading-none tracking-[-.03em] tabular-nums md:text-[5.5rem]">
            {money(q.total)}
          </p>

          <div className="mx-auto mt-12 grid max-w-lg gap-4 border-t border-white/10 pt-8 text-left font-grotesque text-sm print:border-black/15 sm:grid-cols-3">
            {[
              ['Prazo', q.timeline],
              ['Validade', q.validityDays],
              ['Pagamento', q.paymentTerms || DEFAULT_PAYMENT_TERMS],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[10px] uppercase tracking-[.2em] text-white/35 print:text-black/45">{k}</p>
                <p className="mt-1 text-white/85 print:text-black">{v}</p>
              </div>
            ))}
          </div>

          {q.notes && (
            <p className="mx-auto mt-8 max-w-lg whitespace-pre-wrap text-left text-sm leading-relaxed text-white/50 print:text-black/60">
              {q.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
