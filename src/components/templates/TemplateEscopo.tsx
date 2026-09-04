'use client';

import React, { useState } from 'react';
import { usePlatformStore } from '@/store/usePlatformStore';
import { formatBRL } from '@/lib/money';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CalendarDays, ShieldCheck } from 'lucide-react';

export const TemplateEscopo = () => {
  const { quoteDraft, companyInfo, clients } = usePlatformStore();
  const services = quoteDraft.services;
  const client = clients.find(c => c.id === quoteDraft.clientId);
  const getTotal = () => services.reduce((acc, s) => acc + s.price, 0);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatCurrency = formatBRL;

  return (
    <div className="min-h-full w-full bg-[#020202] print:bg-white print:text-black flex flex-col items-center py-32 print:py-0 px-4 relative overflow-hidden">

      <div className="max-w-4xl w-full z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-24"
        >
          <div className="mb-8">
            <h3 className="text-xl font-black uppercase tracking-widest text-white/80">{companyInfo.name}</h3>
            {companyInfo.cnpj && <p className="text-white/65 text-xs tracking-widest mt-1">CNPJ: {companyInfo.cnpj}</p>}
          </div>
          <h2 className="text-sm tracking-widest text-brand-cyan uppercase mb-4">Proposta por escopo</h2>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">Entregas do <br />Projeto</h1>
          {client && <p className="mt-6 text-sm uppercase tracking-[.2em] text-white/65 print:text-black/60">Preparado para {client.name}</p>}
        </motion.div>

        <div className="space-y-4 mb-24">
          {services.map((service) => (
            <motion.div 
              key={service.id}
              layout
              onClick={() => setExpandedId(expandedId === service.id ? null : service.id)}
              className={`liquid-glass p-8 md:p-10 rounded-[2rem] cursor-pointer transition-all border ${
                expandedId === service.id ? 'border-brand-cyan/50' : 'border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <motion.div 
                    animate={{ rotate: expandedId === service.id ? 180 : 0 }}
                    className="text-brand-cyan"
                  >
                    <ChevronDown size={24} />
                  </motion.div>
                  <h3 className="text-2xl font-bold uppercase tracking-wide">{service.name}</h3>
                </div>
                <div className="text-xl font-medium print:text-black">{formatCurrency(service.price)}</div>
              </div>

              <AnimatePresence>
                {/* Print Force Expand via CSS + normal react logic for screen */}
                {(expandedId === service.id || true) && service.description && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: expandedId === service.id ? 1 : 0, height: expandedId === service.id ? 'auto' : 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden print-expand"
                  >
                    <div className="pt-6 mt-6 border-t border-white/10 print:border-black/10 text-white/60 print:text-black/80 text-lg leading-relaxed pl-10">
                      {service.description}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div layout className="liquid-glass rounded-3xl p-12 text-center border border-white/5 print:border-black/10 relative overflow-hidden">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-brand-cyan via-blue-400 to-transparent" />
          <p className="text-white/65 print:text-black/60 uppercase tracking-widest mb-4">Investimento Necessário</p>
          <div className="text-6xl md:text-8xl font-black mb-12 text-shadow-neon print:text-black">
            {formatCurrency(getTotal())}
          </div>
          
          <div className="grid gap-3 border-t border-white/10 print:border-black/10 pt-8 text-left md:grid-cols-3">
            <div className="flex gap-3"><CalendarDays className="text-brand-cyan" size={20} /><div><p className="text-[10px] uppercase tracking-widest text-white/40 print:text-black/40">Prazo estimado</p><strong>{quoteDraft.timeline}</strong></div></div>
            <div className="flex gap-3"><ShieldCheck className="text-brand-cyan" size={20} /><div><p className="text-[10px] uppercase tracking-widest text-white/40 print:text-black/40">Validade da proposta</p><strong>{quoteDraft.validityDays}</strong></div></div>
            <div className="flex gap-3"><ShieldCheck className="text-brand-cyan" size={20} /><div><p className="text-[10px] uppercase tracking-widest text-white/40 print:text-black/40">Pagamento</p><strong>{quoteDraft.paymentTerms || '50% na aprovação e 50% na entrega'}</strong></div></div>
          </div>
          <p className="mt-8 whitespace-pre-wrap text-left text-sm leading-6 text-white/72 print:text-black/70">{quoteDraft.notes}</p>
        </motion.div>

      </div>
    </div>
  );
};
