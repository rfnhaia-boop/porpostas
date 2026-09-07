'use client';

import React from 'react';
import { formatBRL } from '@/lib/money';
import { ItemExtras } from './ItemExtras';
import { DEFAULT_PAYMENT_TERMS, type QuoteView } from '@/lib/quoteView';
import { motion } from 'framer-motion';

const money = formatBRL;
const EMBER = '#ff7a1a';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 20, stiffness: 100 } }
};

export const TemplateCyber = ({ q }: { q: QuoteView }) => {
  const { client, company, items } = q;

  return (
    <div className="relative min-h-full w-full overflow-hidden px-4 py-20 text-white print:bg-white print:p-0 print:text-black">
      
      {/* Imagem de Fundo Premium e Overlay Escuro */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-80 print:hidden" 
        style={{ backgroundImage: "var(--portal-bg-image)", backgroundAttachment: 'fixed' }} 
      />
      <div className="fixed inset-0 z-0 bg-[#050505]/70 backdrop-blur-[10px] print:hidden" />

      {/* Brilhos Radiais Dinâmicos */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
        className="pointer-events-none fixed -top-40 right-[-10%] h-[800px] w-[800px] rounded-full blur-[160px] print:hidden z-0"
        style={{ background: EMBER }}
      />
      <div className="pointer-events-none fixed bottom-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-white/5 blur-[120px] print:hidden z-0" />

      {/* Grid de Fundo Tecnológico */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] print:hidden" />

      <motion.article 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto flex min-h-[29.7cm] w-full max-w-[21cm] flex-col rounded-[2.5rem] border border-white/10 p-10 md:p-16 shadow-[0_40px_100px_rgba(0,0,0,0.8)] print:min-h-0 print:rounded-none print:border-none print:bg-white print:px-0 print:py-0 print:shadow-none"
        style={{
          background: "linear-gradient(135deg, rgba(20,20,20,0.6) 0%, rgba(5,5,5,0.8) 100%)",
          backdropFilter: "blur(60px) saturate(200%)",
          WebkitBackdropFilter: "blur(60px) saturate(200%)",
        }}
      >
        {/* Linha de Reflexo do Vidro */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60 print:hidden" />

        {/* Cabeçalho */}
        <motion.header variants={fadeUp} className="flex flex-col md:flex-row items-start justify-between gap-8 border-b border-white/10 pb-12 print:border-black/15">
          <div>
            <p className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.32em] text-[#FF6A00] print:text-black/45">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6A00] animate-pulse" />
              Proposta {q.proposalNumber}
            </p>
            <h1 className="mt-4 font-display text-[3.4rem] font-light leading-[.95] tracking-[-.03em] md:text-[4.6rem]">
              {company.name}
            </h1>
            {company.cnpj && (
              <p className="mt-2 font-mono text-[11px] tracking-[.18em] text-white/40 print:text-black/45">
                {company.cnpj.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ'} {company.cnpj}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-3">
            <div
              className="shrink-0 rounded-full px-4 py-1.5 font-mono text-[9px] uppercase tracking-[.24em] shadow-[0_0_15px_rgba(255,106,0,0.2)]"
              style={{ color: EMBER, border: `1px solid ${EMBER}55`, backgroundColor: `${EMBER}11` }}
            >
              Documento Comercial
            </div>
            <div className="h-1 w-12 bg-white/20 rounded-full print:hidden" />
          </div>
        </motion.header>

        {/* Cliente */}
        {client && (
          <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-6 pt-12 pb-8 border-b border-white/5 print:border-transparent">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[.3em] text-white/30 print:text-black/45">Preparado para</p>
              <p className="mt-2 font-display text-3xl font-light text-white">{client.name}</p>
              {client.company && (
                <p className="mt-1 font-mono text-xs uppercase tracking-[.16em] text-[#FF6A00] print:text-black/50">
                  {client.company}
                </p>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-12 gap-y-2 text-right font-mono text-[11px]">
              <div>
                <dt className="text-[9px] uppercase tracking-[.2em] text-white/35 print:text-black/45">Validade</dt>
                <dd className="mt-1 text-white/80 font-bold print:text-black">{q.validityDays}</dd>
              </div>
              <div>
                <dt className="text-[9px] uppercase tracking-[.2em] text-white/35 print:text-black/45">Prazo Estimado</dt>
                <dd className="mt-1 text-white/80 font-bold print:text-black">{q.timeline}</dd>
              </div>
            </dl>
          </motion.div>
        )}

        {/* Itens */}
        <section className="mt-12 flex-1">
          <motion.div variants={fadeUp} className="flex items-baseline justify-between border-b border-white/10 pb-4 font-mono text-[10px] uppercase tracking-[.3em] text-white/30 print:border-black/20 print:text-black/50">
            <span>Escopo do Projeto</span>
            <span>Investimento</span>
          </motion.div>
          {items.map((service, index) => (
            <motion.div
              variants={fadeUp}
              key={service.id}
              className="group grid grid-cols-[auto_1fr_auto] items-start gap-6 border-b border-white/5 py-10 transition-all hover:bg-white/[0.02] print:border-black/10 print:hover:bg-transparent"
            >
              <span className="font-mono text-xs font-black tracking-widest mt-1 opacity-60 transition-opacity group-hover:opacity-100" style={{ color: EMBER }}>
                {(index + 1).toString().padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-display text-[1.6rem] font-normal leading-tight text-white">{service.name}</h3>
                {service.description && (
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/50 print:text-black/60">
                    {service.description}
                  </p>
                )}
                <div className="mt-4">
                  <ItemExtras item={service} money={money} tone="dark" />
                </div>
              </div>
              <strong className="whitespace-nowrap font-mono text-lg font-normal tracking-wide tabular-nums text-white group-hover:text-[#FF6A00] transition-colors">
                {money(service.price)}
              </strong>
            </motion.div>
          ))}
        </section>

        {/* Total */}
        <motion.section variants={fadeUp} className="mt-16 flex flex-col gap-10 rounded-3xl bg-black/40 border border-white/5 p-8 shadow-inner print:border-t print:border-black/20 print:bg-transparent print:p-0 print:shadow-none">
          <div className="w-full">
            <p className="font-mono text-[9px] uppercase tracking-[.3em] text-white/40 print:text-black/45">Investimento Total</p>
            <p className="mt-2 font-display text-[3.8rem] font-light leading-none tracking-[-.03em] tabular-nums text-[#FF6A00] drop-shadow-[0_0_25px_rgba(255,106,0,0.3)] md:text-[5rem] print:drop-shadow-none print:text-black break-words">
              {money(q.total)}
            </p>
          </div>
          
          <div className="border-t border-white/10 pt-8 print:border-black/15">
            <p className="font-mono text-[10px] uppercase tracking-[.24em] text-[#FF6A00] print:text-black/45">Condições Gerais</p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/60 print:text-black/60">{q.notes}</p>
            
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 font-mono text-[10px] uppercase tracking-wider text-white/70 print:border-none print:bg-transparent print:p-0 print:text-black/50 w-fit">
              <span className="opacity-50 shrink-0">Forma de Pagamento</span>
              <strong className="text-white print:text-black leading-relaxed">{q.paymentTerms || DEFAULT_PAYMENT_TERMS}</strong>
            </div>
          </div>
        </motion.section>

        {/* Rodapé */}
        <motion.footer variants={fadeUp} className="mt-16 flex flex-wrap items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[.2em] text-white/30 print:text-black/50">
          <span className="flex items-center gap-2">
            <div className="h-px w-8 bg-white/20 print:bg-black/20" />
            {company.email} — {company.phone}
          </span>
          <span>Emitido pelo NEX SYSTEM — {new Date().toLocaleDateString('pt-BR')}</span>
        </motion.footer>
      </motion.article>
    </div>
  );
};
