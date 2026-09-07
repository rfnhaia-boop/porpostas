'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, damping: 25, stiffness: 100 } }
};

export function AccessLocked({ company }: { company: { name: string; logoUrl: string } }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#050505] px-4 py-12 text-white overflow-hidden">
      {/* Luzes de Fundo (Padrão Rafael) */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-[#FF6A00]/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none z-0" />

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-lg text-center"
      >
        {/* Logo / Marca */}
        <motion.div variants={fadeUp} className="mb-10">
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logoUrl} alt={company.name} className="mx-auto h-16 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]" />
          ) : (
            <p className="text-3xl font-display font-light uppercase tracking-widest">{company.name}</p>
          )}
        </motion.div>

        {/* Card Principal - Liquid Glass */}
        <motion.div 
          variants={fadeUp}
          className="relative overflow-hidden rounded-[2.5rem] border border-white/5 border-t-white/10 bg-black/40 p-12 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl"
        >
          {/* Brilho interno de trava */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-cyan-500/15 blur-[60px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
              <Lock className="text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" size={36} strokeWidth={1.5} />
            </div>
            
            <h1 className="mb-4 font-display text-[2.2rem] font-light leading-tight tracking-[-.02em] text-white">
              Proposta<br/>Capturada
            </h1>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-6" />
            <p className="text-sm font-medium leading-relaxed text-white/50 max-w-sm">
              Este link já foi aberto pelo número de pessoas permitido. Se você precisa de acesso, fale com quem enviou o link para <span className="text-white/80">{company.name}</span>.
            </p>
          </div>
        </motion.div>

        <motion.p variants={fadeUp} className="mt-10 font-grotesque text-[9px] font-black uppercase tracking-[.4em] text-white/30">
          Documento Confidencial
        </motion.p>
      </motion.div>
    </main>
  );
}
