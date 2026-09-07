'use client';

import React, { useState } from 'react';
import { KeyRound, Lock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export function AccessGate({
  token,
  company,
  clientName,
}: {
  token: string;
  company: { name: string; logoUrl: string };
  clientName: string | null;
}) {
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !phrase.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/p/${token}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const body = await res.json().catch(() => null);
      if (res.status === 403 || body?.locked) {
        setLocked(true);
        return;
      }
      setError(body?.error || 'Não foi possível liberar o acesso.');
    } catch {
      setError('Erro de conexão. Tente de novo.');
    } finally {
      setLoading(false);
    }
  };

  const firstName = clientName?.trim().split(/\s+/)[0];

  if (locked) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-[#050505] px-4 py-12 text-white overflow-hidden">
        {/* Luzes de Fundo (Padrão Rafael) */}
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-[#FF6A00]/5 blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none z-0" />

        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="relative z-10 w-full max-w-lg text-center">
          <motion.div variants={fadeUp} className="mb-10">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logoUrl} alt={company.name} className="mx-auto h-16 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]" />
            ) : (
              <p className="text-3xl font-display font-light uppercase tracking-widest">{company.name}</p>
            )}
          </motion.div>

          <motion.div variants={fadeUp} className="relative overflow-hidden rounded-[2.5rem] border border-white/5 border-t-white/10 bg-black/40 p-12 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl">
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
                Este link já foi aberto pelo número de pessoas permitido. Fale com quem te enviou o link.
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

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#050505] px-4 py-12 text-white overflow-hidden">
      {/* Luzes de Fundo (Padrão Rafael) */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-[#FF6A00]/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-[#FF6A00]/10 blur-[150px] pointer-events-none z-0" />

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="relative z-10 w-full max-w-lg text-center">
        <motion.div variants={fadeUp} className="mb-10">
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logoUrl} alt={company.name} className="mx-auto h-16 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]" />
          ) : (
            <p className="text-3xl font-display font-light uppercase tracking-widest">{company.name}</p>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="relative overflow-hidden rounded-[2.5rem] border border-white/5 border-t-white/10 bg-black/40 p-12 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-[#FF6A00]/15 blur-[60px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white/5 border border-white/10">
              <KeyRound className="text-[#FF6A00] drop-shadow-[0_0_15px_rgba(255,106,0,0.5)]" size={36} strokeWidth={1.5} />
            </div>
            
            <h1 className="mb-4 font-display text-[2.2rem] font-light leading-tight tracking-[-.02em] text-white">
              {firstName ? (
                <>
                  {firstName},<br/>
                  <span className="text-white/60 text-[1.8rem]">Desbloqueie o acesso</span>
                </>
              ) : (
                <>
                  Sua proposta<br/>
                  <span className="text-white/60 text-[1.8rem]">está a um passo</span>
                </>
              )}
            </h1>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#FF6A00]/50 to-transparent mb-6" />
            <p className="mb-10 text-sm font-medium leading-relaxed text-white/50 max-w-sm">
              Cole a palavra de acesso que veio junto com o link. É ela que confirma que é você.
            </p>

            <form onSubmit={submit} className="w-full">
              <div className="relative flex w-full flex-col items-center border-b-2 border-white/20 pb-4 transition-colors focus-within:border-[#FF6A00]">
                <input
                  type="text"
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  placeholder="DIGITE AQUI"
                  className="w-full bg-transparent text-center font-display text-4xl font-light uppercase tracking-widest text-white outline-none placeholder:text-white/20"
                  autoFocus
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading || !phrase.trim()}
                className="group relative mt-10 flex h-14 w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#FF6A00] to-[#FF8C33] px-6 font-grotesque text-[11px] font-black uppercase tracking-[.25em] text-white transition-all disabled:opacity-50 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,106,0,0.4)]"
              >
                {loading ? 'Verificando...' : (
                  <span className="flex items-center gap-3">
                    Acessar Proposta
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        <motion.p variants={fadeUp} className="mt-10 font-grotesque text-[9px] font-black uppercase tracking-[.4em] text-white/30">
          Documento Confidencial
        </motion.p>
      </motion.div>
    </main>
  );
}
