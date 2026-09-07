'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lock, Sparkles, LayoutTemplate, ShieldCheck, Check } from 'lucide-react';
import Link from 'next/link';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, damping: 25, stiffness: 100 } }
};

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '49',
    subtitle: 'Para consultores e freelancers.',
    features: ['1 Usuário', 'Disparo limitado por venda', 'Templates básicos', 'Portal seguro do cliente'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '99',
    subtitle: 'Para equipes e agências.',
    features: ['Múltiplos usuários', 'Disparo automático ilimitado', 'Todos os templates Premium', 'Personalização de marca'],
    recommended: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: '149',
    subtitle: 'Para operações em escala.',
    features: ['Usuários ilimitados', 'Múltiplos CNPJs', 'Prioridade no suporte', 'Métricas avançadas e conversão'],
  }
];

export default function LandingPage() {
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  return (
    <div className="relative min-h-screen w-full bg-[#030303] text-white selection:bg-[#FF6A00]/30 selection:text-white overflow-x-hidden">
      
      {/* Background Holográfico Base */}
      <div className="fixed inset-0 z-0 opacity-[0.15] pointer-events-none"
           style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div className="fixed top-[-10%] left-[20%] h-[1000px] w-[1000px] rounded-full bg-[#FF6A00]/5 blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] h-[800px] w-[800px] rounded-full bg-cyan-500/5 blur-[150px] pointer-events-none z-0" />

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 md:px-16 backdrop-blur-md border-b border-white/5 bg-[#030303]/40">
        <div className="font-display text-2xl font-black uppercase tracking-widest text-white">
          NEX<span className="text-[#FF6A00]">.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="font-grotesque text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors hidden md:block">
            Login
          </Link>
          <Link href="/signup" className="group flex h-10 items-center justify-center rounded-full bg-white/10 px-6 font-grotesque text-[10px] font-black uppercase tracking-widest text-white border border-white/10 transition-all hover:bg-white/20 hover:scale-105 active:scale-95">
            Começar
          </Link>
        </div>
      </nav>

      {/* SESSÃO 1: HERO */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-32 text-center md:px-20">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col items-center max-w-5xl mx-auto">
          
          <motion.div variants={fadeUp} className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#FF6A00]/30 bg-[#FF6A00]/10 px-5 py-2 backdrop-blur-md shadow-[0_0_30px_rgba(255,106,0,0.15)]">
            <Sparkles size={14} className="text-[#FF6A00]" />
            <span className="font-grotesque text-[9px] font-black uppercase tracking-[.3em] text-[#FF6A00]">
              O Novo Padrão de Fechamento
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="font-display text-[4rem] font-light leading-[1.05] tracking-[-.03em] md:text-[6.5rem]">
            Não envie um PDF.<br />
            Envie uma <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/40 drop-shadow-[0_0_40px_rgba(255,255,255,0.3)]">experiência</span>.
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-8 max-w-2xl text-lg font-medium leading-relaxed text-white/50 md:text-xl">
            Sua proposta de fechamento não deve ser uma planilha de custos. 
            NEX é a plataforma projetada para fechar contratos de alto valor através de orçamentos imersivos, blindados e irrecusáveis.
          </motion.p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, type: 'spring', damping: 20, stiffness: 80 }}
          className="relative mt-24 w-full max-w-6xl rounded-t-[2.5rem] border-x border-t border-white/10 bg-black/40 p-4 backdrop-blur-3xl shadow-[0_-40px_100px_rgba(255,106,0,0.1)] h-[400px] overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-[#FF6A00]/80 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-[#FF6A00]/10 blur-[100px] pointer-events-none" />
          
          <div className="relative h-full w-full rounded-[2rem] border border-white/5 bg-[#08080A] shadow-2xl flex items-center justify-center overflow-hidden">
             <div className="flex flex-col items-center">
                <p className="font-grotesque text-[10px] font-black uppercase tracking-[.4em] text-white/30 mb-6">Investimento Total</p>
                <h2 className="font-display text-7xl font-light tracking-tight text-[#FF6A00] drop-shadow-[0_0_40px_rgba(255,106,0,0.4)]">R$ 45.000,00</h2>
                <div className="mt-8 rounded-full border border-white/5 bg-white/[0.02] px-8 py-3 font-grotesque text-xs tracking-widest text-white/50">
                  Condição: 50% NO ACEITE — 50% NA ENTREGA
                </div>
             </div>
          </div>
        </motion.div>
      </section>

      {/* SESSÃO 2: A DOR VS A SOLUÇÃO */}
      <section className="relative z-10 py-32 px-4 md:px-20 border-t border-white/5 bg-black/20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 text-center">
            <h2 className="font-display text-4xl font-light tracking-tight md:text-5xl">
              O cemitério das vendas B2B.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/40">
              Você faz um pitch brilhante de 5 dígitos. Seu cliente fica animado. 
              Aí você envia um PDF estático e sem graça. O encanto quebra na mesma hora.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-10 backdrop-blur-xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                <Lock size={24} />
              </div>
              <h3 className="mb-4 font-display text-2xl">Blindagem Confidencial</h3>
              <p className="text-white/40 leading-relaxed text-sm">
                Suas propostas não ficam soltas no WhatsApp. O cliente acessa um portal com token único. A percepção de valor e segurança dispara.
              </p>
            </div>
            
            <div className="rounded-[2rem] border border-[#FF6A00]/20 bg-[#FF6A00]/[0.02] p-10 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6A00]/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6A00]/10 text-[#FF6A00] border border-[#FF6A00]/20 relative z-10">
                <LayoutTemplate size={24} />
              </div>
              <h3 className="mb-4 font-display text-2xl relative z-10">Estética Arquitetural</h3>
              <p className="text-white/40 leading-relaxed text-sm relative z-10">
                5 atmosferas visuais criadas com Liquid Glass e animações fluidas. A sua interface fala pela sua qualidade.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-10 backdrop-blur-xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <ShieldCheck size={24} />
              </div>
              <h3 className="mb-4 font-display text-2xl">Conversão Absoluta</h3>
              <p className="text-white/40 leading-relaxed text-sm">
                Sem informações amontoadas. Usamos a técnica de "Revelação Progressiva", trancando o foco do usuário na decisão de fechamento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SESSÃO 3: PRECIFICAÇÃO (Progressive Disclosure) */}
      <section className="relative z-10 py-32 px-4 md:px-20 border-t border-white/5 bg-[#030303]">
        <div className="mx-auto max-w-3xl">
          <div className="mb-16 text-center">
            <h2 className="font-display text-4xl font-light tracking-tight md:text-5xl">
              O valor da sua autoridade.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-white/40">
              Escolha a estrutura ideal para a sua operação. Não se preocupe, você pode mudar de ideia depois.
            </p>
          </div>

          <div className="space-y-4">
            {PLANS.map((plan) => {
              const isExpanded = expandedPlan === plan.id;
              
              return (
                <motion.div 
                  key={plan.id}
                  layout
                  onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                  className={`group cursor-pointer overflow-hidden rounded-[2rem] border transition-all duration-500 ${isExpanded ? 'border-[#FF6A00]/50 bg-[#FF6A00]/5 shadow-[0_0_40px_rgba(255,106,0,0.1)]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'}`}
                >
                  <div className="flex items-center justify-between p-8 md:p-10">
                    <div className="flex items-center gap-6">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${isExpanded ? 'border-[#FF6A00] bg-[#FF6A00]/10' : 'border-white/10 bg-white/5'}`}>
                        <div className={`h-3 w-3 rounded-full transition-colors ${isExpanded ? 'bg-[#FF6A00]' : 'bg-transparent'}`} />
                      </div>
                      <div>
                        <h3 className="font-display text-3xl font-light tracking-wide">{plan.name}</h3>
                        <p className="text-sm text-white/40">{plan.subtitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-grotesque text-[10px] font-black uppercase tracking-[.25em] text-white/40 mb-1">R$ / Mês</p>
                      <p className="font-display text-4xl font-normal tracking-tighter">{plan.price}</p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                      >
                        <div className="border-t border-white/5 px-8 pb-10 pt-8 md:px-10">
                          <div className="grid md:grid-cols-2 gap-8">
                            <ul className="space-y-4">
                              {plan.features.map((feat, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-sm text-white/60">
                                  <Check size={16} className="text-[#FF6A00]" />
                                  {feat}
                                </li>
                              ))}
                            </ul>
                            <div className="flex items-center justify-end">
                              <Link 
                                href="/signup" 
                                onClick={(e) => e.stopPropagation()} 
                                className="group/btn relative flex h-16 w-full md:w-auto items-center justify-center overflow-hidden rounded-full bg-white px-10 font-grotesque text-[11px] font-black uppercase tracking-[.25em] text-black transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,106,0,0.5)]"
                              >
                                <span className="flex items-center gap-3">
                                  Assinar {plan.name}
                                  <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-2" />
                                </span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SESSÃO 4: CTA FINAL */}
      <section className="relative z-10 py-40 text-center border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#FF6A00]/10 pointer-events-none" />
        
        <h2 className="font-display text-5xl font-light tracking-tight md:text-7xl">
          O sistema é nosso.<br/>
          <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#FF6A00] to-[#FF8C33]">A autoridade é sua.</span>
        </h2>
        
        <div className="mt-14 flex justify-center">
          <Link href="/signup" className="group flex h-20 items-center justify-center overflow-hidden rounded-full bg-transparent border-2 border-[#FF6A00] px-14 font-grotesque text-[13px] font-black uppercase tracking-[.3em] text-[#FF6A00] transition-all hover:bg-[#FF6A00] hover:text-white hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,106,0,0.2)]">
            <span className="flex items-center gap-4">
              Criar Conta Agora
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-2" />
            </span>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/10 bg-black py-12 text-center text-white/30 font-grotesque text-[10px] uppercase tracking-[.25em]">
        <p>© {new Date().getFullYear()} NEX Quotes. All rights reserved.</p>
      </footer>
    </div>
  );
}
