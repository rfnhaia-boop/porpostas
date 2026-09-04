'use client';

import React from 'react';
import { formatBRL } from '@/lib/money';
import { DEFAULT_PAYMENT_TERMS, type QuoteView } from '@/lib/quoteView';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

export const TemplateCyber = ({ q }: { q: QuoteView }) => {
  const services = q.items;
  const client = q.client;
  const company = q.company;

  const formatCurrency = formatBRL;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', damping: 20 } }
  };

  return (
    <div className="min-h-full w-full relative flex flex-col items-center justify-center p-12 overflow-hidden bg-[#050505]">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-cyan/10 blur-[150px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none -translate-x-1/3 translate-y-1/3" />

      <div className="max-w-5xl w-full z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12 grid items-end gap-8 border-b border-white/10 pb-8 md:grid-cols-[1fr_auto]"
        >
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="px-3 py-1 bg-brand-cyan/20 border border-brand-cyan/50 text-brand-cyan text-[10px] uppercase tracking-widest font-bold">
                PROPOSTA Nº {q.proposalNumber}
              </div>
              <div className="px-3 py-1 bg-white/10 border border-white/20 text-white/75 text-[10px] uppercase tracking-widest">
                DOCUMENTO COMERCIAL
              </div>
            </div>
            <h1 className="text-6xl font-black tracking-tighter uppercase text-white mb-2">
              {company.name} <span className="text-brand-cyan text-shadow-neon">PROPOSTA</span>
            </h1>
            {company.cnpj && (
              <p className="text-brand-cyan/60 tracking-widest text-xs uppercase font-mono">CNPJ {company.cnpj}</p>
            )}
          </div>

          {client && (
            <div className="text-right border-r-2 border-brand-cyan pr-4">
              <p className="text-white/65 uppercase tracking-widest text-[10px] mb-1">PREPARADO PARA</p>
              <p className="text-xl font-bold uppercase tracking-widest text-white">{client.name}</p>
              {client.company && <p className="text-brand-cyan text-xs uppercase font-mono mt-1">{client.company}</p>}
            </div>
          )}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              variants={itemVariants}
              className="liquid-glass p-10 rounded-[2rem] flex justify-between items-center group hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] transition-shadow duration-500"
            >
              <div>
                <span className="text-brand-cyan/80 text-sm font-black mr-4 uppercase tracking-widest">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <span className="text-3xl font-bold uppercase tracking-wide">{service.name}</span>
                {service.description && (
                  <p className="text-white/72 mt-2 ml-10 max-w-2xl text-lg">{service.description}</p>
                )}
              </div>
              <div className="text-4xl font-black text-brand-cyan drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                {formatCurrency(service.price)}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8, type: 'spring' }}
          className="mt-24 liquid-glass p-12 border-t-2 border-brand-cyan relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-cyan to-transparent" />

          <div className="flex justify-between items-start mb-12">
            <div className="max-w-xl">
              <p className="text-brand-cyan uppercase tracking-widest text-[10px] mb-2 font-mono">CONDIÇÕES COMERCIAIS</p>
              <p className="text-sm font-light text-white/60 leading-relaxed whitespace-pre-wrap">{q.notes}</p>
            </div>
            <div className="text-right">
              <p className="text-white/65 uppercase tracking-widest text-[10px] font-mono mb-1">INVESTIMENTO TOTAL</p>
              <div className="text-7xl font-black text-white tracking-tighter text-shadow-neon">
                {formatCurrency(q.total)}
              </div>
              <div className="flex flex-wrap gap-4 justify-end mt-4 text-[10px] font-mono uppercase text-brand-cyan/70">
                <p>VALIDADE: {q.validityDays}</p>
                <p>PRAZO: {q.timeline}</p>
              </div>
            </div>
          </div>

          {/* Cyber Footer */}
          <div className="mb-8 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-left">
            <div className="bg-[#080b0b] p-4"><p className="text-[9px] uppercase tracking-widest text-white/35">Validade</p><strong className="mt-1 block text-sm text-white">{q.validityDays}</strong></div>
            <div className="bg-[#080b0b] p-4"><p className="text-[9px] uppercase tracking-widest text-white/35">Execução</p><strong className="mt-1 block text-sm text-white">{q.timeline}</strong></div>
            <div className="bg-[#080b0b] p-4"><p className="text-[9px] uppercase tracking-widest text-white/35">Pagamento</p><strong className="mt-1 block text-sm text-white">{q.paymentTerms || DEFAULT_PAYMENT_TERMS}</strong></div>
          </div>
          <div className="border-t border-white/20 pt-8 flex justify-between items-end font-mono text-[10px] text-white/58 uppercase">
            <div className="flex flex-col gap-1">
              <p>EMITENTE: {company.name} [{company.cnpj}]</p>
              <p>CONTATO: {company.email} // {company.phone}</p>
            </div>
            <div className="text-right">
              <p>DOCUMENTO GERADO PELO NEX CRM</p>
              <p>EMISSÃO: {new Date().toLocaleDateString('pt-BR')} // STATUS: AGUARDANDO RESPOSTA</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
