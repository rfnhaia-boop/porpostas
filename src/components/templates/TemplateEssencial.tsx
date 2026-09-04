'use client';

import React from 'react';
import { usePlatformStore } from '@/store/usePlatformStore';
import { formatBRL } from '@/lib/money';

const money = formatBRL;

export const TemplateEssencial = () => {
  const { quoteDraft, companyInfo, clients } = usePlatformStore();
  const client = clients.find((item) => item.id === quoteDraft.clientId);
  const total = quoteDraft.services.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-full bg-[#f3efe5] px-5 py-14 text-[#18201d] print:bg-white print:p-0 md:px-12">
      <article className="mx-auto min-h-[29.7cm] w-full max-w-[21cm] overflow-hidden bg-[#fffdf7] shadow-[0_35px_100px_rgba(0,0,0,.28)] print:min-h-0 print:shadow-none">
        <header className="grid gap-10 border-b border-[#18201d]/15 p-10 md:grid-cols-[1fr_auto] md:p-16">
          <div>
            <div className="mb-8 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.28em] text-[#b45732]">
              <span className="h-2 w-2 rounded-full bg-[#b45732]" /> Orçamento essencial
            </div>
            <h1 className="max-w-lg font-serif text-5xl leading-[.95] tracking-[-.04em] md:text-7xl">Claro no serviço.<br />Justo no valor.</h1>
          </div>
          <div className="self-end text-left text-sm md:text-right">
            <p className="font-bold">{companyInfo.name}</p>
            <p className="mt-1 text-[#18201d]/55">{companyInfo.cnpj}</p>
            <p className="text-[#18201d]/55">{companyInfo.email}</p>
          </div>
        </header>

        <section className="grid gap-8 border-b border-[#18201d]/15 p-10 md:grid-cols-3 md:p-16">
          <div className="md:col-span-2">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[.24em] text-[#18201d]/45">Preparado para</p>
            <h2 className="text-3xl font-semibold tracking-tight">{client?.name}</h2>
            <p className="mt-1 text-[#18201d]/55">{client?.company || client?.document}</p>
          </div>
          <div className="grid grid-cols-2 gap-5 text-sm md:grid-cols-1">
            <p><span className="block text-[10px] font-bold uppercase tracking-[.18em] text-[#18201d]/45">Número</span>{quoteDraft.proposalNumber}</p>
            <p><span className="block text-[10px] font-bold uppercase tracking-[.18em] text-[#18201d]/45">Validade</span>{quoteDraft.validityDays}</p>
          </div>
        </section>

        <section className="p-10 md:p-16">
          <div className="mb-3 hidden grid-cols-[40px_1fr_auto] border-b border-[#18201d]/20 pb-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#18201d]/45 md:grid">
            <span>#</span><span>Item</span><span>Valor</span>
          </div>
          {quoteDraft.services.map((service, index) => (
            <div key={service.id} className="grid gap-3 border-b border-[#18201d]/12 py-7 md:grid-cols-[40px_1fr_auto]">
              <span className="text-sm text-[#b45732]">{String(index + 1).padStart(2, '0')}</span>
              <div><h3 className="text-xl font-semibold">{service.name}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-[#18201d]/58">{service.description}</p></div>
              <strong className="text-xl md:text-right">{money(service.price)}</strong>
            </div>
          ))}

          <div className="mt-10 grid items-end gap-10 md:grid-cols-[1fr_auto]">
            <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#18201d]/45">Condições</p><p className="max-w-lg whitespace-pre-wrap text-sm leading-6 text-[#18201d]/60">{quoteDraft.notes}</p></div>
            <div className="rounded-2xl bg-[#18201d] px-8 py-7 text-[#fffdf7] md:text-right"><p className="text-[10px] uppercase tracking-[.22em] text-white/55">Total</p><p className="mt-1 text-4xl font-semibold tracking-tight">{money(total)}</p><p className="mt-3 text-xs text-white/50">{quoteDraft.paymentTerms || '50% na aprovação e 50% na entrega'}</p></div>
          </div>
        </section>

        <footer className="mx-10 mt-5 flex justify-between border-t border-[#18201d]/15 py-8 text-xs text-[#18201d]/45 md:mx-16">
          <span>Prazo estimado: {quoteDraft.timeline}</span><span>{companyInfo.phone}</span>
        </footer>
      </article>
    </div>
  );
};
