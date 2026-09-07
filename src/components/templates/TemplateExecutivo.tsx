'use client';

import React from 'react';
import { formatBRL } from '@/lib/money';
import { ItemExtras } from './ItemExtras';
import { DEFAULT_PAYMENT_TERMS, type QuoteView } from '@/lib/quoteView';
import { motion } from 'framer-motion';

const money = formatBRL;
const BRASS = '#D4AF37'; // Ajustado para um Ouro mais premium/Executive

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

export const TemplateExecutivo = ({ q }: { q: QuoteView }) => {
  const { client, company, items } = q;
  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="relative flex min-h-full w-full flex-col items-center bg-[#050505] px-4 py-20 text-white print:bg-white print:p-0 overflow-hidden">
      
      {/* Background Corporativo Luxury */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none print:hidden"
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#151515] via-[#050505] to-[#0A0A0A] opacity-90 pointer-events-none print:hidden" />
      
      {/* Brilhos Arquiteturais */}
      <div className="absolute -top-[20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-[#D4AF37]/5 blur-[120px] pointer-events-none print:hidden" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[800px] w-[800px] rounded-full bg-white/5 blur-[150px] pointer-events-none print:hidden" />

      <motion.article 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto flex min-h-[29.7cm] w-full max-w-[21cm] flex-col rounded-[2.5rem] bg-[#0A0A0A]/80 px-5 md:px-10 py-16 shadow-[0_40px_100px_rgba(0,0,0,1)] ring-1 ring-white/10 backdrop-blur-3xl print:min-h-0 print:rounded-none print:bg-white print:px-0 print:py-0 print:shadow-none print:ring-0 md:px-20 md:py-24"
      >
        {/* Fio de Ouro superior */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent opacity-80 print:hidden" />

        {/* Cabeçalho */}
        <motion.header variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 border-b border-white/10 pb-12 print:border-black/15">
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-white/10 to-transparent p-[1px] shadow-[0_0_20px_rgba(212,175,55,0.1)]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#050505]">
                {company.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={company.logoUrl} alt={company.name} className="max-h-full max-w-full rounded-full object-cover" />
                ) : (
                  <span className="font-display text-2xl" style={{ color: BRASS }}>{company.name.charAt(0)}</span>
                )}
              </div>
            </div>
            <div>
              <p className="font-grotesque text-sm font-black uppercase tracking-[.25em] text-white">{company.name}</p>
              {company.cnpj && (
                <p className="mt-1.5 font-grotesque text-[9px] uppercase tracking-[.2em] text-white/40 print:text-black/45">
                  {company.cnpj.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ'} {company.cnpj}
                </p>
              )}
            </div>
          </div>
          <div className="text-left sm:text-right font-grotesque text-[10px] leading-relaxed tracking-wider text-white/40 print:text-black/50">
            <p>{company.email}</p>
            <p>{company.phone}</p>
          </div>
        </motion.header>

        {/* Título */}
        <motion.div variants={fadeUp} className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10 pt-16">
          <div>
            <p
              className="mb-4 font-grotesque text-[9px] font-black uppercase tracking-[.3em]"
              style={{ color: BRASS }}
            >
              Proposta Comercial Exclusiva
            </p>
            <h1 className="font-display text-5xl sm:text-[3.8rem] font-light leading-none tracking-[-.02em] md:text-[4.6rem] text-white">
              Nº {q.proposalNumber}
            </h1>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-4 text-left md:text-right text-xs">
            {[
              ['Emissão', date],
              ['Validade', q.validityDays],
              ['Estimativa', q.timeline],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-grotesque text-[9px] font-black uppercase tracking-[.2em] text-white/30 print:text-black/45">
                  {k}
                </dt>
                <dd className="mt-1.5 font-grotesque text-[13px] font-medium tracking-wide text-white/90 print:text-black">{v}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        {/* Cliente */}
        {client && (
          <motion.section variants={fadeUp} className="mt-16 border-l-[3px] py-2 pl-8" style={{ borderColor: BRASS }}>
            <p className="font-grotesque text-[9px] font-black uppercase tracking-[.3em] text-white/30 print:text-black/45">
              Preparado Exclusivamente Para
            </p>
            <p className="mt-3 font-display text-[2.2rem] font-light tracking-wide text-white">{client.name}</p>
            <p className="mt-2 font-grotesque text-[11px] uppercase tracking-[.15em] text-[#D4AF37] print:text-black/55">
              {[client.company, client.document, client.email].filter(Boolean).join('  —  ')}
            </p>
          </motion.section>
        )}

        {/* Itens */}
        <motion.section variants={fadeUp} className="mt-20 flex-1">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-5 font-grotesque text-[9px] font-black uppercase tracking-[.3em] text-white/30 print:border-black/20 print:text-black/50">
            <span>Especificação do Escopo</span>
            <span>Investimento</span>
          </div>
          {items.map((service, i) => (
            <motion.div
              variants={fadeUp}
              key={service.id}
              className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-start gap-8 border-b border-white/[.05] py-10 transition-colors hover:bg-white/[.01] print:border-black/10 print:hover:bg-transparent"
            >
              <span className="font-grotesque text-sm font-black tracking-widest mt-1 opacity-70" style={{ color: BRASS }}>
                {(i + 1).toString().padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-display text-[1.8rem] font-normal leading-tight text-white">{service.name}</h3>
                {service.description && (
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/50 print:text-black/60">
                    {service.description}
                  </p>
                )}
                <div className="mt-5">
                  <ItemExtras item={service} money={money} tone="dark" />
                </div>
              </div>
              <strong className="whitespace-nowrap font-grotesque text-lg font-medium tabular-nums tracking-wide text-white">
                {money(service.price)}
              </strong>
            </motion.div>
          ))}
        </motion.section>

        {/* Total (Layout em Cascata para evitar quebra) */}
        <motion.section variants={fadeUp} className="mt-20 flex flex-col gap-10 rounded-[2rem] bg-black/40 border border-[#D4AF37]/20 p-10 shadow-inner print:border-t print:border-black/20 print:bg-transparent print:p-0 print:shadow-none">
          <div className="w-full">
            <p className="font-grotesque text-[9px] font-black uppercase tracking-[.3em] text-white/40 print:text-black/45">
              Investimento Consolidado
            </p>
            <p
              className="mt-3 font-display text-[clamp(1.9rem,8vw,4.2rem)] font-light leading-none tracking-[-.03em] tabular-nums drop-shadow-[0_0_20px_rgba(212,175,55,0.2)] break-words print:drop-shadow-none"
              style={{ color: BRASS }}
            >
              {money(q.total)}
            </p>
          </div>
          
          <div className="border-t border-white/10 pt-8 print:border-black/15">
            <p className="font-grotesque text-[9px] font-black uppercase tracking-[.3em] text-[#D4AF37] print:text-black/45">
              Observações e Condições Comerciais
            </p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/50 print:text-black/60">
              {q.notes}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-5 font-grotesque text-[10px] uppercase tracking-widest text-[#D4AF37] print:border-none print:bg-transparent print:p-0 print:text-black/50 w-fit">
              <span className="opacity-60 shrink-0 font-black">Condição de Pagamento</span>
              <strong className="text-white print:text-black leading-relaxed">{q.paymentTerms || DEFAULT_PAYMENT_TERMS}</strong>
            </div>
          </div>
        </motion.section>
      </motion.article>
    </div>
  );
};

