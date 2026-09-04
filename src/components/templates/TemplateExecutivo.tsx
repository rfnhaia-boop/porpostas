'use client';

import React from 'react';
import { usePlatformStore } from '@/store/usePlatformStore';
import { formatBRL } from '@/lib/money';

export const TemplateExecutivo = () => {
  const { quoteDraft, companyInfo, clients } = usePlatformStore();
  const services = quoteDraft.services;
  const client = clients.find(c => c.id === quoteDraft.clientId);
  
  const getTotal = () => services.reduce((acc, s) => acc + s.price, 0);

  const formatCurrency = formatBRL;

  const currentDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-full w-full bg-[#0a0a0a] print:bg-white text-white print:text-black flex flex-col items-center py-12 px-4 print:p-0">
      <div className="max-w-[21cm] w-full overflow-hidden bg-[#0f0f0f] print:bg-white border border-white/10 shadow-2xl flex flex-col p-12 md:p-16 print:border-none print:shadow-none relative">
        <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-[#d2ab65] via-[#725329] to-transparent print:bg-[#a27a3b]" />
        
        {/* Header - Sender Data */}
        <div className="flex justify-between items-start mb-16 border-b border-white/10 print:border-black/10 pb-12">
          <div className="flex items-center gap-6">
            {/* Logo Placeholder or Text */}
            <div className="w-16 h-16 bg-white/5 print:bg-black/5 rounded-xl flex items-center justify-center border border-white/10 print:border-black/20">
              {companyInfo.logoUrl ? (
                <img src={companyInfo.logoUrl} alt="Logo" className="max-w-full max-h-full rounded-xl" />
              ) : (
                <span className="text-2xl font-black">{companyInfo.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-widest">{companyInfo.name}</h1>
              {companyInfo.cnpj && <p className="text-white/50 print:text-black/50 text-xs tracking-widest uppercase mt-1">CNPJ: {companyInfo.cnpj}</p>}
            </div>
          </div>
          <div className="text-right text-xs text-white/50 print:text-black/60 space-y-1">
            <p className="font-bold text-white print:text-black uppercase tracking-widest text-sm mb-2">Contato</p>
            <p>{companyInfo.email}</p>
            <p>{companyInfo.phone}</p>
          </div>
        </div>

        {/* Document Info */}
        <div className="flex justify-between items-end mb-16">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Proposta Comercial</h2>
            <p className="text-brand-cyan print:text-blue-600 font-bold tracking-widest text-sm uppercase">Nº {quoteDraft.proposalNumber}</p>
          </div>
          <div className="text-right text-sm text-white/50 print:text-black/60 flex gap-12">
            <div>
              <p className="uppercase tracking-widest text-[10px] mb-1">Data de Emissão</p>
              <p className="font-bold text-white print:text-black">{currentDate}</p>
            </div>
            <div>
              <p className="uppercase tracking-widest text-[10px] mb-1">Validade</p>
              <p className="font-bold text-white print:text-black">{quoteDraft.validityDays}</p>
            </div>
            <div>
              <p className="uppercase tracking-widest text-[10px] mb-1">Prazo de Entrega</p>
              <p className="font-bold text-white print:text-black">{quoteDraft.timeline}</p>
            </div>
          </div>
        </div>

        {/* Client Info Grid */}
        {client && (
          <div className="bg-white/5 print:bg-black/5 border border-white/10 print:border-black/10 p-8 rounded-xl mb-16 relative overflow-hidden">
            <div className="absolute left-0 top-0 w-1 h-full bg-brand-cyan print:bg-blue-600" />
            <p className="text-[10px] text-white/40 print:text-black/40 uppercase tracking-widest mb-4">Preparado exclusivamente para</p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="font-bold text-xl mb-1">{client.name}</p>
                {client.company && <p className="text-sm text-white/60 print:text-black/60 uppercase tracking-widest">{client.company}</p>}
              </div>
              <div className="text-right">
                <p className="font-bold text-sm mb-1">{client.document || 'Doc. Não Informado'}</p>
                <p className="text-sm text-white/60 print:text-black/60">{client.email || 'Email Não Informado'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-12 grid grid-cols-3 border-y border-white/10 print:border-black/10 py-5 text-center">
          <div className="border-r border-white/10 print:border-black/10"><p className="text-[9px] uppercase tracking-widest text-white/40 print:text-black/40">Itens contratados</p><strong className="mt-1 block text-lg">{services.length}</strong></div>
          <div className="border-r border-white/10 print:border-black/10"><p className="text-[9px] uppercase tracking-widest text-white/40 print:text-black/40">Prazo previsto</p><strong className="mt-1 block text-lg">{quoteDraft.timeline}</strong></div>
          <div><p className="text-[9px] uppercase tracking-widest text-white/40 print:text-black/40">Validade comercial</p><strong className="mt-1 block text-lg">{quoteDraft.validityDays}</strong></div>
        </div>

        {/* Services Table */}
        <div className="mb-16 flex-1">
          <div className="border-b border-white/20 print:border-black/20 pb-4 mb-6 flex uppercase tracking-widest text-xs font-bold text-white/50 print:text-black/50">
            <div className="w-12">Item</div>
            <div className="flex-1">Descrição do Serviço</div>
            <div className="w-40 text-right">Valor</div>
          </div>
          
          <div className="space-y-6">
            {services.map((service, idx) => (
              <div key={service.id} className="flex group border-b border-white/5 print:border-black/5 pb-6">
                <div className="w-12 text-white/60 print:text-black/55 font-black mt-1">{(idx + 1).toString().padStart(2, '0')}</div>
                <div className="flex-1 pr-8">
                  <h3 className="font-bold text-lg mb-2">{service.name}</h3>
                  <p className="text-sm text-white/60 print:text-black/70 leading-relaxed">{service.description}</p>
                </div>
                <div className="w-40 text-right font-medium text-lg">
                  {formatCurrency(service.price)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total and Notes */}
        <div className="flex justify-between items-start pt-8 border-t border-white/20 print:border-black/20">
          <div className="w-1/2">
            <p className="text-xs uppercase tracking-widest text-white/65 print:text-black/60 mb-2">Observações e Condições</p>
            <p className="text-sm text-white/60 print:text-black/70 leading-relaxed pr-8 whitespace-pre-wrap">{quoteDraft.notes}</p>
          </div>
          
          <div className="w-1/2 text-right">
            <p className="text-xs uppercase tracking-widest text-white/65 print:text-black/60 mb-2">Investimento Total</p>
            <p className="text-6xl font-black text-[#d8b879] print:text-[#8a642c] tracking-tighter">{formatCurrency(getTotal())}</p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 rounded-2xl border border-[#d8b879]/20 bg-[#d8b879]/[.06] p-6 md:grid-cols-3">
          <div><p className="text-[9px] uppercase tracking-widest text-white/35 print:text-black/40">Validade</p><strong className="mt-1 block text-sm">{quoteDraft.validityDays}</strong></div>
          <div><p className="text-[9px] uppercase tracking-widest text-white/35 print:text-black/40">Cronograma</p><strong className="mt-1 block text-sm">{quoteDraft.timeline}</strong></div>
          <div><p className="text-[9px] uppercase tracking-widest text-white/35 print:text-black/40">Condição de pagamento</p><strong className="mt-1 block text-sm">{quoteDraft.paymentTerms || '50% na aprovação e 50% na entrega'}</strong></div>
        </div>

        {/* Professional Footer */}
        <div className="mt-32 border-t border-white/20 print:border-black/20 pt-12 flex flex-col gap-12">
          {/* Signatures */}
          <div className="flex justify-between px-12">
            <div className="w-64 border-t border-white/40 print:border-black/40 pt-4 text-center">
              <p className="font-bold text-sm uppercase">{companyInfo.name}</p>
              <p className="text-xs text-white/50 print:text-black/50 mt-1">{companyInfo.cnpj}</p>
            </div>
            <div className="w-64 border-t border-white/40 print:border-black/40 pt-4 text-center">
              <p className="font-bold text-sm uppercase">{client?.name || 'Cliente'}</p>
              <p className="text-xs text-white/50 print:text-black/50 mt-1">De Acordo / Assinatura</p>
            </div>
          </div>
          
          {/* Footer Info Block */}
          <div className="bg-white/5 print:bg-black/5 rounded-xl p-8 flex justify-between items-center text-xs text-white/40 print:text-black/50">
            <div>
              <p className="font-bold text-white print:text-black mb-1">{companyInfo.name}</p>
              <p>Este documento é estritamente confidencial.</p>
            </div>
            <div className="text-right">
              <p>{companyInfo.email} • {companyInfo.phone}</p>
              <p>Emitido pelo sistema NEX CRM</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
