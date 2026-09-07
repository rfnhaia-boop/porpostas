'use client';

import React, { useState } from 'react';
import { formatBRL } from '@/lib/money';
import { ItemExtras } from './ItemExtras';
import { DEFAULT_PAYMENT_TERMS, type QuoteView } from '@/lib/quoteView';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export const TemplateEscopo = ({ q }: { q: QuoteView }) => {
  const { items, client, company } = q;
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="relative min-h-full w-full overflow-hidden bg-[#020202] px-4 py-24 text-white print:bg-white print:py-0 print:text-black">
      
      {/* Background Holográfico Profundo */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,106,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,106,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px] print:hidden" />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse' }}
        className="pointer-events-none fixed top-[-10%] left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-[100%] blur-[120px] print:hidden z-0"
        style={{ background: EMBER }}
      />
      <div className="pointer-events-none fixed bottom-[-30%] left-[-20%] h-[700px] w-[700px] rounded-full bg-cyan-500/5 blur-[150px] print:hidden z-0" />

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto w-full max-w-3xl"
      >
        {/* Cabeçalho centrado */}
        <motion.header variants={fadeUp} className="text-center">
          <p className="font-grotesque text-xs font-black uppercase tracking-[.4em] text-white/40 print:text-black/50">
            {company.name}
          </p>
          {company.cnpj && (
            <p className="mt-2 font-grotesque text-[9px] uppercase tracking-[.25em] text-white/30 print:text-black/45">
              {company.cnpj.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ'} {company.cnpj}
            </p>
          )}
          
          <div className="mt-12 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#FF6A00]/50" />
            <p className="font-grotesque text-[10px] font-black uppercase tracking-[.35em]" style={{ color: EMBER }}>
              Proposta por Escopo
            </p>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#FF6A00]/50" />
          </div>
          
          <h1 className="mt-6 font-display text-5xl sm:text-[4rem] font-light leading-[.98] tracking-[-.03em] md:text-[5.5rem] drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            Entregas
            <br />
            do Projeto
          </h1>
          
          {client && (
            <div className="mt-12 inline-block rounded-full border border-white/10 bg-white/5 px-6 py-2 backdrop-blur-md">
              <p className="font-grotesque text-[9px] font-bold uppercase tracking-[.3em] text-white/60 print:text-black/55">
                Preparado Exclusivamente Para <span className="text-white ml-2">{client.name}</span>
              </p>
            </div>
          )}
        </motion.header>

        {/* Entregas (Accordion) */}
        <div className="mt-24 space-y-4">
          {items.map((service, i) => {
            const open = openId === service.id;
            return (
              <motion.div
                variants={fadeUp}
                key={service.id}
                className="overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-colors print:rounded-none print:border-0 print:border-b print:border-black/10 print:bg-transparent print:shadow-none"
                style={{
                  background: open ? "linear-gradient(135deg, rgba(25,25,25,0.7) 0%, rgba(5,5,5,0.9) 100%)" : "rgba(10,10,10,0.6)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : service.id)}
                  className="group flex w-full items-center justify-between gap-6 px-8 py-8 text-left transition-colors hover:bg-white/[0.02] print:px-0"
                >
                  <div className="flex items-center gap-6">
                    <span className={`font-grotesque text-sm font-black transition-colors ${open ? 'text-[#FF6A00] drop-shadow-[0_0_10px_rgba(255,106,0,0.5)]' : 'text-white/30 group-hover:text-[#FF6A00]/70'}`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-display text-[1.6rem] font-normal leading-tight tracking-wide">{service.name}</h3>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-grotesque text-lg font-medium tabular-nums tracking-wide opacity-80">{money(service.price)}</span>
                    {service.description && (
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 print:hidden ${open ? 'border-[#FF6A00] bg-[#FF6A00]/10 text-[#FF6A00]' : 'border-white/10 bg-white/5 text-white/40 group-hover:border-white/20'}`}>
                        <Plus size={16} className={`transition-transform duration-500 ${open ? 'rotate-45' : ''}`} />
                      </div>
                    )}
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {open && (service.description || service.details?.length) && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="print:hidden"
                    >
                      <div className="border-t border-white/5 px-8 pb-8 pt-6 pl-[5.5rem] text-[14px] leading-relaxed text-white/50">
                        {service.description}
                        <div className="mt-5">
                          <ItemExtras item={service} money={money} tone="dark" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Versão para Impressão */}
                {(service.description || service.details?.length) && (
                  <div className="hidden border-t border-black/10 pb-6 pt-4 pl-[3.75rem] text-sm leading-relaxed text-black/70 print:block print:pl-0">
                    {service.description}
                    <ItemExtras item={service} money={money} tone="light" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Total */}
        <motion.div variants={fadeUp} className="relative mt-24 overflow-hidden rounded-[2.5rem] border border-white/10 p-12 text-center shadow-[0_30px_80px_rgba(0,0,0,0.8)] print:rounded-none print:border-0 print:border-t print:border-black/20 print:bg-transparent print:p-0 print:pt-12 print:shadow-none"
          style={{
            background: "linear-gradient(135deg, rgba(30,30,30,0.6) 0%, rgba(5,5,5,0.8) 100%)",
            backdropFilter: "blur(40px) saturate(200%)"
          }}
        >
          {/* Brilho interno do card */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-1 bg-gradient-to-r from-transparent via-[#FF6A00]/30 to-transparent" />
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[60%] h-32 bg-[#FF6A00]/5 blur-[60px] pointer-events-none" />

          <p className="relative z-10 font-grotesque text-[10px] font-black uppercase tracking-[.3em] text-[#FF6A00] print:text-black/50">
            Investimento Necessário
          </p>
          <p className="relative z-10 mt-4 font-display text-[clamp(2rem,9vw,5.5rem)] font-light leading-none tracking-[-.03em] tabular-nums drop-shadow-[0_0_30px_rgba(255,106,0,0.25)] break-words print:drop-shadow-none">
            {money(q.total)}
          </p>

          <div className="relative z-10 mx-auto mt-14 grid max-w-2xl gap-8 border-t border-white/10 pt-10 text-left font-grotesque text-sm print:border-black/15 sm:grid-cols-3">
            {[
              ['Prazo Estimado', q.timeline],
              ['Validade', q.validityDays],
              ['Pagamento', q.paymentTerms || DEFAULT_PAYMENT_TERMS],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-2 border-l-2 border-[#FF6A00]/30 pl-4">
                <p className="text-[9px] font-black uppercase tracking-[.25em] text-white/40 print:text-black/45">{k}</p>
                <p className="text-white/90 font-medium print:text-black">{v}</p>
              </div>
            ))}
          </div>

          {q.notes && (
            <div className="relative z-10 mx-auto mt-10 max-w-2xl rounded-2xl bg-white/5 p-6 border border-white/5 text-left backdrop-blur-sm print:border-none print:bg-transparent print:p-0">
              <p className="font-grotesque text-[9px] font-black uppercase tracking-[.25em] text-[#FF6A00] mb-3">Condições Gerais</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/60 print:text-black/60">
                {q.notes}
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

