'use client';

import React from 'react';
import { formatBRL } from '@/lib/money';
import { ItemExtras } from './ItemExtras';
import { DEFAULT_PAYMENT_TERMS, type QuoteView } from '@/lib/quoteView';
import { motion } from 'framer-motion';

const money = formatBRL;
const PINE = '#0D5B43';
const PINE_LIGHT = '#188665';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 120 } }
};

export const TemplateDetalhado = ({ q }: { q: QuoteView }) => {
  const { items, client, company } = q;

  return (
    <div className="relative flex min-h-full w-full flex-col items-center bg-[#E5EAE7] px-4 py-20 text-[#0F221C] print:bg-white print:p-0 overflow-hidden">
      
      {/* Background Analítico/Técnico */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none print:hidden"
           style={{ backgroundImage: 'linear-gradient(#0D5B43 1px, transparent 1px), linear-gradient(90deg, #0D5B43 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-[-20%] left-[-10%] h-[700px] w-[700px] rounded-full bg-[#0D5B43]/5 blur-[120px] pointer-events-none print:hidden z-0" />

      <motion.article 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto flex min-h-[29.7cm] w-full max-w-[21cm] flex-col bg-[#F9FBFA] px-8 py-14 shadow-[0_40px_100px_rgba(13,91,67,0.15)] ring-1 ring-black/[.05] print:min-h-0 print:px-0 print:py-0 print:shadow-none print:ring-0 md:px-6 md:px-16 md:py-20"
      >
        {/* Cabeçalho */}
        <motion.header variants={fadeUp} className="flex flex-col justify-between gap-10 border-b-2 border-[#0D5B43]/20 pb-12 md:flex-row md:items-end">
          <div>
            <p className="font-grotesque text-[10px] font-black uppercase tracking-[.4em]" style={{ color: PINE }}>
              Mapa Detalhado de Custos
            </p>
            <h1 className="mt-4 font-display text-[clamp(2.25rem,8vw,5rem)] font-light leading-[.95] tracking-[-.02em] break-words text-[#0F221C]">
              Orçamento
              <br />
              Detalhado
            </h1>
          </div>
          <div className="font-grotesque text-xs md:text-right flex flex-col gap-1">
            <p className="text-[14px] font-black uppercase tracking-[.1em] text-[#0F221C]">{company.name}</p>
            {company.cnpj && <p className="text-[#0D5B43]/60 font-semibold uppercase tracking-widest mt-1">{company.cnpj.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ'} {company.cnpj}</p>}
            <p className="text-[#0F221C]/50 mt-1 font-medium">{company.email}</p>
            <p className="text-[#0F221C]/50 font-medium">{company.phone}</p>
          </div>
        </motion.header>

        {/* Meta Dados */}
        <motion.section variants={fadeUp} className="mt-12 grid gap-6 border border-[#0D5B43]/10 bg-[#0D5B43]/[0.03] px-8 py-8 font-grotesque text-sm md:grid-cols-4 rounded-xl">
          <div className="md:col-span-2 flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-[.3em] text-[#0D5B43]/60">Cliente</span>
            <strong className="mt-1 text-lg font-bold text-[#0F221C]">{client?.name ?? '-'}</strong>
            <p className="text-[#0F221C]/50 font-medium text-xs mt-1 uppercase tracking-wider">{[client?.company, client?.document].filter(Boolean).join('  —  ')}</p>
          </div>
          <div className="flex flex-col gap-1 border-l border-[#0D5B43]/10 pl-6">
            <span className="text-[9px] font-black uppercase tracking-[.3em] text-[#0D5B43]/60">Referência</span>
            <strong className="mt-1 text-lg font-bold text-[#0F221C]">{q.proposalNumber}</strong>
          </div>
          <div className="flex flex-col gap-1 border-l border-[#0D5B43]/10 pl-6">
            <span className="text-[9px] font-black uppercase tracking-[.3em] text-[#0D5B43]/60">Validade</span>
            <strong className="mt-1 text-lg font-bold text-[#0F221C]">{q.validityDays}</strong>
          </div>
        </motion.section>

        {/* Tabela de Custos */}
        <motion.section variants={fadeUp} className="mt-16 flex-1">
          <div
            className="grid grid-cols-1 sm:grid-cols-[44px_1fr_130px] px-6 py-4 font-grotesque text-[9px] font-black uppercase tracking-[.25em] text-white md:grid-cols-[52px_1fr_80px_140px] rounded-t-xl"
            style={{ backgroundColor: PINE }}
          >
            <span>Item</span>
            <span>Descrição Técnica</span>
            <span className="hidden text-center md:block">Qtd.</span>
            <span className="text-right">Subtotal</span>
          </div>
          <div className="border-x border-b border-[#0D5B43]/20 rounded-b-xl overflow-hidden bg-white">
            {items.map((service, index) => (
              <motion.div
                variants={fadeUp}
                key={service.id}
                className="group grid grid-cols-1 sm:grid-cols-[44px_1fr_130px] border-b border-[#0D5B43]/10 px-6 py-8 md:grid-cols-[52px_1fr_80px_140px] transition-colors hover:bg-[#0D5B43]/[0.02] print:border-black/10 last:border-0"
              >
                <span className="font-grotesque text-sm font-black opacity-60 transition-opacity group-hover:opacity-100" style={{ color: PINE }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="pr-6">
                  <h3 className="font-display text-[1.6rem] font-normal leading-tight text-[#0F221C]">{service.name}</h3>
                  {service.description && (
                    <p className="mt-2 text-xs font-medium leading-relaxed text-[#0F221C]/50">{service.description}</p>
                  )}
                  <div className="mt-3">
                    <ItemExtras item={service} money={money} tone="light" />
                  </div>
                </div>
                <span className="hidden text-center font-grotesque text-sm font-medium text-[#0F221C]/40 md:block mt-1">
                  {Number.isInteger(service.quantity) ? service.quantity : service.quantity.toFixed(2)} {service.unitLabel}
                </span>
                <strong className="text-right font-grotesque tabular-nums text-lg text-[#0F221C] mt-1">{money(service.price)}</strong>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Escopo + Total */}
        <motion.section variants={fadeUp} className="mt-16 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-10">
          <div className="pr-4">
            <p className="font-grotesque text-[9px] font-black uppercase tracking-[.3em] mb-4" style={{ color: PINE }}>
              Escopo, Condições e Premissas
            </p>
            <p className="whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-[#0F221C]/60">{q.notes}</p>
          </div>
          
          <div className="w-full md:w-[320px] rounded-2xl border-t-4 bg-[#0D5B43]/[0.04] p-8 shadow-inner print:border-t-4 print:border-black/20" style={{ borderColor: PINE }}>
            <div className="flex justify-between font-grotesque text-[11px] font-bold uppercase tracking-widest text-[#0D5B43]/60 border-b border-[#0D5B43]/10 pb-4">
              <span>Total de Itens</span>
              <span>{items.length}</span>
            </div>
            <div className="mt-6">
              <p className="font-grotesque text-[9px] font-black uppercase tracking-[.25em] text-[#0D5B43]/60 mb-2">Total Consolidado</p>
              <strong className="block font-display text-[clamp(1.8rem,7vw,3.2rem)] font-light leading-none tracking-[-.03em] tabular-nums break-words" style={{ color: PINE }}>
                {money(q.total)}
              </strong>
            </div>
          </div>
        </motion.section>

        {/* Fechamento */}
        <motion.section variants={fadeUp} className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 border-t-2 border-[#0D5B43]/20 pt-10 font-grotesque md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <span className="block text-[9px] font-black uppercase tracking-[.3em] text-[#0D5B43]/50">Prazo de Execução</span>
            <strong className="text-[13px] font-bold text-[#0F221C]">{q.timeline}</strong>
          </div>
          {(q.minTerm || q.commercial?.commitmentMonths) ? (
            <div className="flex flex-col gap-2 border-l border-[#0D5B43]/10 pl-6">
              <span className="block text-[9px] font-black uppercase tracking-[.3em] text-[#0D5B43]/50">Prazo Mínimo</span>
              <strong className="text-[13px] font-bold text-[#0F221C]">{q.minTerm || `${q.commercial?.commitmentMonths} meses`}</strong>
            </div>
          ) : null}
          <div className="flex flex-col gap-2 border-l border-[#0D5B43]/10 pl-6">
            <span className="block text-[9px] font-black uppercase tracking-[.3em] text-[#0D5B43]/50">Condição de Pagamento</span>
            <strong className="text-[13px] font-bold text-[#0F221C] leading-relaxed">{q.paymentTerms || DEFAULT_PAYMENT_TERMS}</strong>
          </div>
          <div className="flex flex-col gap-2 border-l border-[#0D5B43]/10 pl-6">
            <span className="block text-[9px] font-black uppercase tracking-[.3em] text-[#0D5B43]/50">Aceite do Cliente</span>
            <div className="mt-6 border-b border-[#0F221C]/30 w-full" />
          </div>
        </motion.section>
      </motion.article>
    </div>
  );
};

