'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, MessageSquareText, Printer, XCircle, MousePointer2 } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { motion, AnimatePresence, useInView } from 'framer-motion';

type Status = 'draft' | 'sent' | 'approved' | 'declined' | 'changes_requested';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4 py-2 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--border-color)] transition-all"
    >
      <Printer size={15} /> Imprimir / PDF
    </button>
  );
}

export function ClientResponse({
  token,
  initialStatus,
  initialNote,
  selection,
  locked = false,
}: {
  selection?: { selectedPackage: string; optionalIds: string[]; revision: string };
  locked?: boolean;
  token: string;
  initialStatus: Status;
  initialNote: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [note, setNote] = useState(initialNote ?? '');
  const [saving, setSaving] = useState<null | 'approved' | 'declined' | 'changes_requested'>(null);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  // Gamification states
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-150px 0px" });
  const [guideStep, setGuideStep] = useState<'idle' | 'blur' | 'hand' | 'done'>('idle');

  const decided = status === 'approved' || status === 'declined' || status === 'changes_requested';

  useEffect(() => {
    if (isInView && !decided) {
      setGuideStep('blur');
    }
  }, [isInView, decided]);

  useEffect(() => {
    if (guideStep === 'blur') {
      const timer = setTimeout(() => {
        setGuideStep('hand');
      }, 4000); // 4 seconds of focus mode
      return () => clearTimeout(timer);
    }
  }, [guideStep]);

  useEffect(() => {
    if (guideStep === 'hand') {
      // "O 'Assinale' tem que ficar aparecendo umas três, quatro vezes e depois acabou"
      // 1.5s duration * 4 pulses = 6000ms
      const timer = setTimeout(() => {
        if (!agreed) {
          setGuideStep('done');
        }
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [guideStep, agreed]);

  useEffect(() => {
    if (agreed || decided) {
      setGuideStep('done');
    }
  }, [agreed, decided]);

  const respond = async (decision: 'approved' | 'declined' | 'changes_requested') => {
    if (saving) return;
    if (decision === 'changes_requested' && !note.trim()) {
      setError('Escreva o que precisa ser alterado antes de enviar.');
      return;
    }
    setSaving(decision);
    setError(null);
    try {
      const res = await fetch(`/api/p/${token}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, note, selection, agreed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Não foi possível registrar sua resposta.');
      }
      setStatus(decision);
      if (decision === 'approved') {
        router.push(`/p/${token}/success`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar.');
    } finally {
      setSaving(null);
    }
  };

  if (locked) return <section className="p-8 text-center text-white"><h2 className="text-2xl font-bold">Proposta aprovada</h2><p className="mt-3">Os valores e itens contratados estão registrados.</p><a href="/portal" className="mt-5 inline-block rounded-full bg-[#FF6A00] px-6 py-3 font-bold text-black">Acessar meu portal</a></section>;

  const badge =
    status === 'approved'
      ? { bg: 'bg-green-500/20', fg: 'text-green-500', icon: <CheckCircle2 size={28} />, title: 'Orçamento Aprovado' }
      : status === 'declined'
        ? { bg: 'bg-red-500/20', fg: 'text-red-500', icon: <XCircle size={28} />, title: 'Orçamento Recusado' }
        : { bg: 'bg-[#FF6A00]/20', fg: 'text-[#FF6A00]', icon: <MessageSquareText size={28} />, title: 'Alteração Solicitada' };

  return (
    <section className="relative min-h-screen no-print overflow-hidden px-6 py-16 text-center md:px-12 md:py-24">
      
      {/* Estilos injetados para animação do Fidelix */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes cardShine {
          0% { left: -40%; }
          35% { left: 110%; }
          100% { left: 110%; }
        }
      `}} />

      {/* Fundo Personalizado com Imagem Gerada da NEX */}
      <div className="absolute inset-0 z-0 bg-[var(--background)]">
        {/* Imagens Customizadas (Claro e Escuro automático pelas vars do CSS) */}
        <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-300" style={{ backgroundImage: 'var(--bg-image)' }} />
        
        {/* Overlay leve para garantir legibilidade dos textos e do vidro */}
        <div className="absolute inset-0 z-0 bg-white/20 dark:bg-black/40 backdrop-blur-[2px]" />
        
        {/* Dynamic Orbs (Screen blend para fundir com a imagem) */}
        <div className="absolute inset-0 z-0 pointer-events-none mix-blend-screen">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-[20%] left-[20%] w-[500px] h-[500px] rounded-full bg-[#FF6A00] blur-[150px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute bottom-[20%] right-[20%] w-[600px] h-[600px] rounded-full bg-[#FF6A00] blur-[150px]"
          />
        </div>
      </div>

      <div className="absolute top-6 right-6 flex flex-col items-center gap-2 z-20">
        <span className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">Tema</span>
        <ThemeToggle />
      </div>

      <div 
        ref={sectionRef} 
        className="mx-auto max-w-xl p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden z-10 shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-white/20 dark:border-white/10"
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
        }}
      >
        
        {/* Glass reflections (Fidelix pattern) */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* Brilho varrendo o cartão de tempos em tempos */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2.5rem]">
          <div
            className="absolute top-0 bottom-0 w-1/3 animate-[cardShine_5.5s_ease-in-out_infinite]"
            style={{
              background:
                "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.12) 55%, transparent 100%)",
              transform: "skewX(-15deg)",
            }}
          />
        </div>

        {/* Blur Spotlight Gamification Overlay - SEM FUNDO / PURO BLUR */}
        <AnimatePresence>
          {guideStep === 'blur' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              className="absolute inset-0 z-40 bg-transparent backdrop-blur-md flex flex-col items-center justify-center p-8 pointer-events-none rounded-[2.5rem]"
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 25 }}
                className="mb-32"
              >
                <span className="font-black uppercase tracking-[0.2em] text-[11px] text-[#FF6A00] drop-shadow-[0_0_15px_rgba(255,106,0,0.8)]">
                  Se estiver de acordo, assinale abaixo
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 text-[var(--foreground)]">
          {decided ? (
            <div className="mb-10">
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${badge.bg} ${badge.fg}`}>
                {badge.icon}
              </div>
              <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Resposta registrada</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-tighter text-[var(--foreground)]">{badge.title}</h2>
              <p className="mx-auto mt-4 max-w-md text-xs font-semibold leading-relaxed text-[var(--text-muted)]">
                O responsável foi notificado. Você pode alterar sua resposta abaixo caso seja necessário.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#FF6A00]">Sua Resposta</p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-tighter text-[var(--foreground)]">Como deseja seguir?</h2>
              <p className="mx-auto mt-4 max-w-md text-xs font-semibold leading-relaxed text-[var(--text-muted)]">
                Revise a proposta estrutural acima e registre sua decisão. O responsável é notificado de forma síncrona.
              </p>
            </>
          )}

          <div className="mt-10 text-left">
            <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
              Observações / Mudanças de Escopo
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex.: ajustar o prazo para 20 dias, remover módulo 2, etc."
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-5 text-sm font-semibold text-[var(--foreground)] placeholder:text-[var(--text-muted)] placeholder:opacity-50 focus:border-[#FF6A00] focus:outline-none transition-all relative z-10"
              rows={4}
            />
          </div>

          {error && <p className="mt-4 text-sm font-bold text-red-500">{error}</p>}

          <button
            onClick={() => respond('changes_requested')}
            disabled={!!saving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--foreground)] hover:border-[#FF6A00] hover:text-[#FF6A00] transition-colors disabled:opacity-50 relative z-10"
          >
            <MessageSquareText size={16} />
            {saving === 'changes_requested' ? 'Processando...' : 'Solicitar Alteração'}
          </button>
        </div>

        {/* Highlighted Area during Spotlight */}
        <div className={`relative mt-12 p-8 -mx-8 rounded-3xl transition-all duration-700 ${guideStep === 'blur' ? 'z-50 bg-[var(--background)] shadow-[0_-20px_60px_rgba(0,0,0,0.8)]' : 'z-10'}`}>
          <label className="flex items-center justify-center gap-3 text-xs font-bold text-[var(--text-muted)] cursor-pointer hover:text-[var(--foreground)] transition-colors relative w-fit mx-auto">
            
            <div className="relative flex items-center justify-center">
              {/* Gamification Premium Indicator */}
              <AnimatePresence>
                {guideStep === 'hand' && !agreed && (
                  <motion.div
                    initial={{ y: -15, opacity: 0 }}
                    animate={{ y: [0, 8, 0], opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                  >
                    <span className="whitespace-nowrap text-[9px] font-black uppercase tracking-widest text-[#FF6A00] opacity-90 mb-1">
                      Assinale
                    </span>
                    <div className="h-6 w-[2px] bg-gradient-to-b from-transparent to-[#FF6A00]" />
                    <div className="w-2 h-2 rounded-full bg-[#FF6A00] shadow-[0_0_15px_#FF6A00] animate-pulse -mt-[1px]" />
                  </motion.div>
                )}
              </AnimatePresence>

              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="h-5 w-5 accent-[#FF6A00] rounded-md border-[var(--border-color)] cursor-pointer transition-all"
              />
            </div>
            
            <span className="uppercase tracking-widest text-[10px]">Li e concordo com a estrutura e os valores acima.</span>
          </label>

          <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
            <button
              onClick={() => respond('declined')}
              disabled={!!saving}
              className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-color)] bg-transparent px-8 py-4 text-xs font-black uppercase tracking-widest text-[var(--foreground)] hover:bg-[var(--border-color)] transition-all disabled:opacity-50"
            >
              <XCircle size={16} /> {saving === 'declined' ? 'Processando...' : 'Recusar'}
            </button>
            <button
              onClick={() => respond('approved')}
              disabled={!!saving || !agreed}
              title={!agreed ? 'É necessário aceitar os termos acima' : undefined}
              className={`flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:hover:opacity-40 disabled:shadow-none ${
                agreed 
                  ? 'bg-[#FF6A00] text-[#0A0A0A] hover:opacity-90 shadow-[0_0_30px_rgba(255,106,0,0.4)]' 
                  : 'bg-[var(--panel-bg)] text-[var(--text-muted)] border border-[var(--border-color)]'
              }`}
            >
              <CheckCircle2 size={18} /> {saving === 'approved' ? 'Processando...' : 'Aprovar Orçamento'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
