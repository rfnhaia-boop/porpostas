'use client';

import React from 'react';
import { formatBRL } from '@/lib/money';
import { ItemExtras } from './ItemExtras';
import { DEFAULT_PAYMENT_TERMS, type QuoteView } from '@/lib/quoteView';
import { motion } from 'framer-motion';

const money = formatBRL;

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

export const TemplateMinimalista = ({ q }: { q: QuoteView }) => {
  const { items, client, company } = q;
  const date = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="relative flex min-h-full w-full flex-col items-center bg-[#E6E4DD] px-4 py-20 text-[#161513] print:bg-white print:p-0 overflow-hidden">
      
      {/* Background Architectural Texture */}
      <div className="absolute inset-0 z-0 opacity-20 mix-blend-multiply pointer-events-none print:hidden"
           style={{ backgroundImage: 'radial-gradient(#161513 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div className="absolute inset-0 z-0 opacity-40 bg-gradient-to-b from-transparent to-[#D1CEBFA8] pointer-events-none print:hidden" />

      <motion.article 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative z-10 flex min-h-[29.7cm] w-full max-w-[21cm] flex-1 flex-col bg-[#FCFBF8] px-5 md:px-10 py-16 shadow-[0_40px_100px_rgba(22,21,19,0.15)] ring-1 ring-black/[.05] print:min-h-0 print:px-0 print:py-0 print:shadow-none print:ring-0 md:px-20 md:py-24"
      >
        {/* Cabeçalho - grade arquitetural */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 border-y-2 border-[#161513] md:grid-cols-4">
          <div className="border-r border-black/10 py-8 pr-6">
            <h1 className="font-display text-[2.6rem] font-medium leading-none tracking-[-.04em]">{company.name}</h1>
          </div>
          {[
            ['Documento Comercial', q.proposalNumber],
            ['Data de Emissão', date],
            ['Validade da Proposta', q.validityDays],
          ].map(([k, v], i) => (
            <div key={k} className={`py-8 pl-6 ${i < 2 ? 'border-r border-black/10' : ''} md:pl-6`}>
              <p className="font-grotesque text-[8.5px] font-black uppercase tracking-[.25em] text-black/40">{k}</p>
              <p className="mt-2 font-grotesque text-sm font-semibold tracking-wide">{v}</p>
            </div>
          ))}
        </motion.div>

        {/* Cliente */}
        {client && (
          <motion.div variants={fadeUp} className="mt-20">
            <p className="font-grotesque text-[9px] font-black uppercase tracking-[.3em] text-[#FF6A00]">Proposto Para</p>
            <h2 className="mt-4 font-display text-5xl sm:text-[3.8rem] font-light leading-[1.02] tracking-[-.03em] md:text-[4.8rem]">{client.name}</h2>
            {(client.company || client.document) && (
              <p className="mt-3 font-grotesque text-xs uppercase tracking-[.2em] text-black/50">
                {[client.company, client.document].filter(Boolean).join('   —   ')}
              </p>
            )}
          </motion.div>
        )}

        {/* Itens */}
        <motion.div variants={fadeUp} className="mt-24 flex-1">
          <div className="flex border-b-2 border-[#161513] pb-4 font-grotesque text-[9px] font-black uppercase tracking-[.25em] text-black/40">
            <div className="w-16">Nº</div>
            <div className="flex-1">Especificação do Projeto</div>
            <div className="w-40 text-right">Investimento</div>
          </div>
          {items.map((service, idx) => (
            <motion.div variants={fadeUp} key={service.id} className="group flex items-start border-b border-black/10 py-10 transition-colors hover:bg-black/[.02] print:hover:bg-transparent">
              <div className="w-16 font-display text-3xl font-light text-[#FF6A00]/40 transition-colors group-hover:text-[#FF6A00]">
                {(idx + 1).toString().padStart(2, '0')}
              </div>
              <div className="flex-1 pr-10">
                <h3 className="font-display text-[1.8rem] font-normal leading-tight tracking-[-.01em]">{service.name}</h3>
                {service.description && (
                  <p className="mt-3 max-w-xl text-sm font-light leading-relaxed text-black/60">{service.description}</p>
                )}
                <div className="mt-5">
                  <ItemExtras item={service} money={money} tone="light" />
                </div>
              </div>
              <div className="w-40 text-right font-grotesque text-lg font-semibold tabular-nums tracking-wide">
                {money(service.price)}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Condições + Total */}
        <motion.div variants={fadeUp} className="mt-20 flex flex-col md:flex-row gap-12 border-t-2 border-[#161513] pt-12">
          <div className="flex-1">
            <p className="font-grotesque text-[9px] font-black uppercase tracking-[.25em] text-black/40">Condições Comerciais</p>
            <p className="mt-4 whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-black/65 max-w-md">{q.notes}</p>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-6 font-grotesque text-xs">
              <div className="flex flex-col gap-1 border-l-2 border-[#FF6A00] pl-4">
                <span className="text-[9px] uppercase tracking-widest text-black/40">Prazo Estimado</span>
                <span className="font-semibold text-black/80">{q.timeline}</span>
              </div>
              {(q.minTerm || q.commercial?.commitmentMonths) ? (
                <div className="flex flex-col gap-1 border-l-2 border-[#FF6A00] pl-4">
                  <span className="text-[9px] uppercase tracking-widest text-black/40">Prazo Mínimo</span>
                  <span className="font-semibold text-black/80">{q.minTerm || `${q.commercial?.commitmentMonths} meses`}</span>
                </div>
              ) : null}
              <div className="flex flex-col gap-1 border-l-2 border-[#FF6A00] pl-4">
                <span className="text-[9px] uppercase tracking-widest text-black/40">Pagamento</span>
                <span className="font-semibold text-black/80">{q.paymentTerms || DEFAULT_PAYMENT_TERMS}</span>
              </div>
            </div>
          </div>
          
          <div className="md:text-right shrink-0">
            <p className="font-grotesque text-[9px] font-black uppercase tracking-[.3em] text-[#FF6A00]">Total Consolidado</p>
            <p className="mt-3 font-display text-[clamp(2rem,8.5vw,5rem)] font-light leading-none tracking-[-.04em] tabular-nums break-words">
              {money(q.total)}
            </p>
          </div>
        </motion.div>

        {/* Rodapé */}
        <motion.footer variants={fadeUp} className="mt-24 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 border-t border-black/10 pt-8 font-grotesque text-[9px] uppercase tracking-[.2em] text-black/40">
          <div>
            <p className="font-black text-black/70 mb-1">{company.name} <span className="font-normal opacity-50 px-2">|</span> {company.cnpj}</p>
            <p>{company.email} <span className="font-normal opacity-50 px-2">|</span> {company.phone}</p>
          </div>
          <div className="text-left md:text-right w-full md:w-auto">
            <p className="font-black">De acordo & Assinatura</p>
            <div className="mt-8 h-[2px] w-full md:w-64 bg-[#161513]" />
          </div>
        </motion.footer>
      </motion.article>
    </div>
  );
};

