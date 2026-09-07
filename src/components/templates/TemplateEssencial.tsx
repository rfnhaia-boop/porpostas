'use client';

import React from 'react';
import { formatBRL } from '@/lib/money';
import { ItemExtras } from './ItemExtras';
import { DEFAULT_PAYMENT_TERMS, type QuoteView } from '@/lib/quoteView';
import { motion } from 'framer-motion';

const money = formatBRL;
const ORANGE = '#FF6A00';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 100 } }
};

export const TemplateEssencial = ({ q }: { q: QuoteView }) => {
  const client = q.client;
  const company = q.company;

  return (
    <div className="relative flex min-h-full w-full flex-col items-center bg-[#F2EFE8] px-4 py-20 text-[#1C1A14] print:bg-white print:p-0 overflow-hidden">
      
      {/* Background Orgânico */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none print:hidden"
           style={{ backgroundImage: 'radial-gradient(#1C1A14 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-[-20%] left-[-10%] h-[800px] w-[800px] rounded-full bg-[#FF6A00]/5 blur-[120px] pointer-events-none print:hidden z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[800px] w-[800px] rounded-full bg-white/60 blur-[150px] pointer-events-none print:hidden z-0" />

      <motion.article 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto flex min-h-[29.7cm] w-full max-w-[21cm] flex-col rounded-[2.5rem] bg-[#FDFBF7]/90 px-5 md:px-10 py-16 shadow-[0_40px_100px_rgba(28,26,20,0.1)] ring-1 ring-black/[.03] backdrop-blur-3xl print:min-h-0 print:rounded-none print:bg-white print:px-0 print:py-0 print:shadow-none print:ring-0 md:px-20 md:py-24"
      >
        {/* Cabeçalho */}
        <motion.header variants={fadeUp} className="pb-16">
          <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[.4em] font-grotesque" style={{ color: ORANGE }}>
            <span className="h-px w-10" style={{ backgroundColor: ORANGE }} />
            Proposta Comercial
          </div>
          <h1 className="mt-8 max-w-2xl font-display text-5xl sm:text-[3.8rem] font-light leading-[1.05] tracking-[-.03em] md:text-[5.5rem] text-[#1C1A14]">
            Claro no escopo.
            <br />
            <span className="italic" style={{ color: ORANGE }}>Justo</span> no valor.
          </h1>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr] gap-10 border-t-2 border-[#1C1A14] pt-10 text-sm">
            <div className="flex flex-col gap-2">
              <p className="text-[9px] font-black uppercase tracking-[.3em] text-black/30 font-grotesque">Proposto Por</p>
              <p className="mt-2 font-grotesque text-lg font-bold text-[#1C1A14]">{company.name}</p>
              {company.cnpj && <p className="text-[11px] font-semibold tracking-wider text-black/50">{company.cnpj}</p>}
              {company.email && <p className="text-[11px] font-semibold tracking-wider text-black/50">{company.email}</p>}
            </div>
            <div className="flex flex-col gap-2 border-l-2 border-black/5 pl-8 md:pl-10">
              <p className="text-[9px] font-black uppercase tracking-[.3em] text-black/30 font-grotesque">Proposta Nº</p>
              <p className="mt-2 font-grotesque text-lg font-bold text-[#1C1A14]">{q.proposalNumber}</p>
            </div>
            <div className="flex flex-col gap-2 border-l-2 border-black/5 pl-8 md:pl-10">
              <p className="text-[9px] font-black uppercase tracking-[.3em] text-black/30 font-grotesque">Validade</p>
              <p className="mt-2 font-grotesque text-lg font-bold text-[#1C1A14]">{q.validityDays}</p>
            </div>
          </div>
        </motion.header>

        {/* Cliente */}
        {client && (
          <motion.section variants={fadeUp} className="border-y border-black/5 bg-[#F6F4EB]/50 px-5 md:px-10 py-12 md:-mx-20 md:px-20">
            <p className="text-[9px] font-black uppercase tracking-[.3em] text-black/30 font-grotesque">Preparado Para</p>
            <p className="mt-4 font-display text-[2.8rem] font-light tracking-[-.02em] text-[#1C1A14]">{client.name}</p>
            {(client.company || client.document) && (
              <p className="mt-2 font-grotesque text-[11px] uppercase tracking-[.15em] font-semibold text-black/50">
                {[client.company, client.document].filter(Boolean).join('  —  ')}
              </p>
            )}
          </motion.section>
        )}

        {/* Itens */}
        <motion.section variants={fadeUp} className="pt-16 flex-1">
          <div className="mb-4 flex items-baseline justify-between border-b-2 border-[#1C1A14] pb-5 text-[9px] font-black uppercase tracking-[.3em] text-black/40 font-grotesque">
            <span>Escopo Resumido</span>
            <span>Investimento</span>
          </div>
          {q.items.map((service, index) => (
            <motion.div
              variants={fadeUp}
              key={service.id}
              className="group grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-start gap-8 border-b border-black/5 py-10 transition-colors hover:bg-black/[0.01] print:hover:bg-transparent"
            >
              <span className="font-grotesque text-sm font-black mt-1 transition-colors group-hover:opacity-100 opacity-60" style={{ color: ORANGE }}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-display text-[1.8rem] font-normal leading-tight tracking-[-.01em] text-[#1C1A14]">{service.name}</h3>
                {service.description && (
                  <p className="mt-3 max-w-xl text-sm leading-relaxed font-medium text-black/50">{service.description}</p>
                )}
                <div className="mt-5">
                  <ItemExtras item={service} money={money} tone="light" />
                </div>
              </div>
              <strong className="whitespace-nowrap font-grotesque text-lg font-bold tabular-nums tracking-wide text-[#1C1A14]">
                {money(service.price)}
              </strong>
            </motion.div>
          ))}
        </motion.section>

        {/* Total - o momento */}
        <motion.section variants={fadeUp} className="mt-20 flex flex-col gap-10 rounded-[2rem] bg-black/5 border border-black/5 p-10 print:rounded-none print:border-0 print:border-t print:border-black/20 print:bg-transparent print:p-0">
          <div className="w-full">
            <p className="text-[9px] font-black uppercase tracking-[.3em] text-black/40 font-grotesque">Investimento Total</p>
            <p className="mt-4 font-display text-[clamp(2rem,8.5vw,5rem)] font-light leading-none tracking-[-.03em] tabular-nums break-words text-[#1C1A14]">
              {money(q.total)}
            </p>
          </div>
          
          <div className="border-t border-black/10 pt-8 print:border-black/15">
            <p className="text-[9px] font-black uppercase tracking-[.3em] text-black/40 font-grotesque mb-4">Condições e Observações</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed font-medium text-black/60">{q.notes}</p>
            
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl bg-black/5 p-5 font-grotesque text-[10px] uppercase tracking-widest text-[#1C1A14] font-bold w-fit print:bg-transparent print:p-0">
              <span className="opacity-50 shrink-0 font-black" style={{ color: ORANGE }}>Condição de Pagamento</span>
              <strong className="leading-relaxed">{q.paymentTerms || DEFAULT_PAYMENT_TERMS}</strong>
            </div>
          </div>
        </motion.section>
      </motion.article>
    </div>
  );
};

