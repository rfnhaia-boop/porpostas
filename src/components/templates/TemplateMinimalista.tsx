'use client';

import React from 'react';
import { usePlatformStore } from '@/store/usePlatformStore';
import { formatBRL } from '@/lib/money';

export const TemplateMinimalista = () => {
  const { quoteDraft, companyInfo, clients } = usePlatformStore();
  const services = quoteDraft.services;
  const client = clients.find(c => c.id === quoteDraft.clientId);
  
  const getTotal = () => services.reduce((acc, s) => acc + s.price, 0);

  const formatCurrency = formatBRL;

  const currentDate = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="min-h-full w-full bg-[#d9d6cf] print:bg-white text-[#151515] flex flex-col p-6 md:p-16 print:p-0 items-center">
      <div className="max-w-[21cm] w-full flex-1 flex flex-col relative bg-[#faf9f5] px-8 py-12 shadow-[0_35px_90px_rgba(0,0,0,.2)] print:p-0 print:shadow-none md:px-16">
        
        {/* Architectural Header Grid */}
        <div className="grid grid-cols-4 border-t-4 border-b border-black/20 mb-16">
          <div className="col-span-2 md:col-span-1 border-r border-black/20 p-6 flex flex-col justify-center">
            <h1 className="font-serif text-4xl font-black tracking-tighter leading-none">{companyInfo.name}</h1>
          </div>
          <div className="col-span-2 md:col-span-1 border-r border-black/20 p-6">
            <p className="text-[10px] uppercase tracking-widest text-black/60 mb-1">Documento REF</p>
            <p className="font-bold text-lg">{quoteDraft.proposalNumber}</p>
          </div>
          <div className="col-span-2 md:col-span-1 border-r border-black/20 p-6">
            <p className="text-[10px] uppercase tracking-widest text-black/60 mb-1">Data / Validade</p>
            <p className="font-bold text-sm">{currentDate}</p>
            <p className="text-xs text-black/65">{quoteDraft.validityDays}</p>
          </div>
          <div className="col-span-2 md:col-span-1 p-6">
            <p className="text-[10px] uppercase tracking-widest text-black/60 mb-1">Prazo Estimado</p>
            <p className="font-bold text-sm">{quoteDraft.timeline}</p>
          </div>
        </div>

        {/* Client Target Section */}
        {client && (
          <div className="mb-16">
            <p className="text-[10px] uppercase tracking-widest text-black/60 mb-4">Preparado para / Cliente</p>
            <h2 className="font-serif text-5xl font-black tracking-tighter mb-2">{client.name}</h2>
            <div className="flex gap-8 text-sm text-black/65 uppercase tracking-widest">
              {client.company && <span>{client.company}</span>}
              {client.document && <span>{client.document}</span>}
            </div>
          </div>
        )}

        {/* Services List - Architect Style */}
        <div className="flex-1 mb-16">
          <div className="border-b border-black/20 pb-4 mb-8 flex uppercase tracking-widest text-[10px] font-bold text-black/60">
            <div className="w-16">ID</div>
            <div className="flex-1">Especificação</div>
            <div className="w-48 text-right">Valor Estimado</div>
          </div>
          
          <div className="space-y-0">
            {services.map((service, idx) => (
              <div key={service.id} className="flex items-start border-b border-black/10 py-8 group">
                <div className="w-16 text-3xl font-light text-black/35 mt-[-4px]">
                  {(idx + 1).toString().padStart(2, '0')}
                </div>
                <div className="flex-1 pr-12">
                  <h3 className="text-2xl font-bold uppercase tracking-tight mb-3">{service.name}</h3>
                  <p className="text-sm text-black/65 leading-relaxed font-light">{service.description}</p>
                </div>
                <div className="w-48 text-right text-2xl font-medium tracking-tight">
                  {formatCurrency(service.price)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-16 max-w-2xl">
          <p className="text-[10px] uppercase tracking-widest text-black/60 mb-4">Condições comerciais</p>
          <p className="text-sm font-light leading-relaxed text-black/70 whitespace-pre-wrap">{quoteDraft.notes}</p>
        </div>

        {/* Massive Total Line */}
        <div className="border-t-2 border-black pt-12 flex justify-between items-end mb-24">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-black/60 mb-2">Total Consolidado</p>
            <p className="text-sm font-light text-black/60 max-w-xs">Valor referente aos serviços e entregas descritos neste documento.</p>
          </div>
            <div className="font-serif text-7xl md:text-8xl font-black tracking-tighter">
              {formatCurrency(getTotal())}
            </div>
          </div>

        <div className="mb-16 grid gap-px overflow-hidden border border-black/15 bg-black/15 md:grid-cols-3">
          <div className="bg-[#faf9f5] p-5"><p className="text-[9px] uppercase tracking-[.2em] text-black/40">Validade</p><strong className="mt-2 block text-sm">{quoteDraft.validityDays}</strong></div>
          <div className="bg-[#faf9f5] p-5"><p className="text-[9px] uppercase tracking-[.2em] text-black/40">Prazo de execução</p><strong className="mt-2 block text-sm">{quoteDraft.timeline}</strong></div>
          <div className="bg-[#faf9f5] p-5"><p className="text-[9px] uppercase tracking-[.2em] text-black/40">Pagamento</p><strong className="mt-2 block text-sm">{quoteDraft.paymentTerms || '50% na aprovação e 50% na entrega'}</strong></div>
        </div>

        {/* Swiss Footer */}
        <div className="grid grid-cols-2 text-[10px] uppercase tracking-widest text-black/60 border-t border-black/20 pt-8">
          <div>
            <p className="font-bold text-black mb-1">{companyInfo.name} — {companyInfo.cnpj}</p>
            <p>{companyInfo.email} // {companyInfo.phone}</p>
          </div>
          <div className="text-right">
            <p>Assinatura Eletrônica / De Acordo</p>
            <div className="w-48 h-[1px] bg-black/30 ml-auto mt-6"></div>
          </div>
        </div>

      </div>
    </div>
  );
};
