'use client';

import React from 'react';
import { usePlatformStore } from '@/store/usePlatformStore';
import { formatBRL } from '@/lib/money';

const money = formatBRL;

export const TemplateDetalhado = () => {
  const { quoteDraft, companyInfo, clients } = usePlatformStore();
  const client = clients.find((item) => item.id === quoteDraft.clientId);
  const total = quoteDraft.services.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-full bg-[#dbe3e0] px-5 py-14 text-[#10231d] print:bg-white print:p-0 md:px-12">
      <article className="mx-auto min-h-[29.7cm] w-full max-w-[21cm] bg-white p-8 shadow-[0_35px_100px_rgba(14,45,35,.22)] print:min-h-0 print:shadow-none md:p-14">
        <header className="mb-12 flex flex-col justify-between gap-8 border-b-4 border-[#0d5b43] pb-10 md:flex-row md:items-end">
          <div><p className="mb-4 text-xs font-bold uppercase tracking-[.3em] text-[#0d5b43]">Mapa detalhado de custos</p><h1 className="text-5xl font-black uppercase leading-none tracking-[-.055em]">Orçamento<br />detalhado</h1></div>
          <div className="text-sm md:text-right"><p className="text-xl font-black uppercase">{companyInfo.name}</p><p className="mt-2 text-[#10231d]/55">CNPJ {companyInfo.cnpj}</p><p className="text-[#10231d]/55">{companyInfo.email} · {companyInfo.phone}</p></div>
        </header>

        <section className="mb-10 grid gap-3 border border-[#10231d]/15 bg-[#f5f7f5] p-6 text-sm md:grid-cols-4">
          <div className="md:col-span-2"><span className="block text-[9px] font-bold uppercase tracking-[.2em] text-[#10231d]/45">Cliente</span><strong>{client?.name}</strong><p className="text-[#10231d]/55">{client?.company} {client?.document && `· ${client.document}`}</p></div>
          <div><span className="block text-[9px] font-bold uppercase tracking-[.2em] text-[#10231d]/45">Referência</span><strong>{quoteDraft.proposalNumber}</strong></div>
          <div><span className="block text-[9px] font-bold uppercase tracking-[.2em] text-[#10231d]/45">Validade</span><strong>{quoteDraft.validityDays}</strong></div>
        </section>

        <section>
          <div className="grid grid-cols-[42px_1fr_110px] bg-[#10231d] px-4 py-3 text-[9px] font-bold uppercase tracking-[.18em] text-white md:grid-cols-[48px_1fr_90px_130px]">
            <span>Item</span><span>Descrição técnica</span><span className="hidden text-center md:block">Qtd.</span><span className="text-right">Subtotal</span>
          </div>
          {quoteDraft.services.map((service, index) => (
            <div key={service.id} className="grid grid-cols-[42px_1fr_110px] border-x border-b border-[#10231d]/12 px-4 py-6 md:grid-cols-[48px_1fr_90px_130px]">
              <span className="font-mono text-sm text-[#0d5b43]">{String(index + 1).padStart(2, '0')}</span>
              <div className="pr-4"><h3 className="font-bold">{service.name}</h3><p className="mt-2 text-xs leading-5 text-[#10231d]/58">{service.description}</p></div>
              <span className="hidden text-center text-sm text-[#10231d]/55 md:block">1 un.</span>
              <strong className="text-right">{money(service.price)}</strong>
            </div>
          ))}
        </section>

        <section className="mt-10 grid gap-8 md:grid-cols-[1fr_280px]">
          <div><p className="mb-3 text-[9px] font-bold uppercase tracking-[.2em] text-[#0d5b43]">Escopo, condições e premissas</p><p className="whitespace-pre-wrap text-sm leading-6 text-[#10231d]/65">{quoteDraft.notes}</p></div>
          <div className="border-t-4 border-[#0d5b43] bg-[#edf3f0] p-6"><div className="flex justify-between text-xs text-[#10231d]/55"><span>Itens</span><span>{quoteDraft.services.length}</span></div><div className="mt-5 flex items-end justify-between"><span className="text-xs font-bold uppercase tracking-[.16em]">Total geral</span><strong className="text-3xl tracking-tight text-[#0d5b43]">{money(total)}</strong></div></div>
        </section>

        <section className="mt-12 grid gap-6 border-t border-[#10231d]/15 pt-8 md:grid-cols-3">
          <div><span className="block text-[9px] font-bold uppercase tracking-[.2em] text-[#10231d]/45">Prazo de execução</span><strong>{quoteDraft.timeline}</strong></div>
          <div><span className="block text-[9px] font-bold uppercase tracking-[.2em] text-[#10231d]/45">Aceite do cliente</span><div className="mt-7 border-b border-[#10231d]/30" /></div>
          <div><span className="block text-[9px] font-bold uppercase tracking-[.2em] text-[#10231d]/45">Pagamento</span><strong>{quoteDraft.paymentTerms || '50% na aprovação e 50% na entrega'}</strong></div>
        </section>
      </article>
    </div>
  );
};
