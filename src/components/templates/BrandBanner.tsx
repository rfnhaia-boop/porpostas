'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Zap, Globe } from 'lucide-react';

const BANNERS = [
  {
    icon: Zap,
    title: "Propostas Inteligentes",
    description: "Apresentações imersivas e em tempo real que vendem por você.",
    color: "text-[#FF6A00]",
    glow: "drop-shadow-[0_0_20px_rgba(255,106,0,0.8)]"
  },
  {
    icon: Globe,
    title: "Assinatura Integrada",
    description: "Fechamento sem atrito com total validade jurídica em um clique.",
    color: "text-cyan-400",
    glow: "drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]"
  },
  {
    icon: ShieldCheck,
    title: "Infraestrutura Bancária",
    description: "Segurança de ponta protegendo os dados dos seus clientes.",
    color: "text-white",
    glow: "drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]"
  }
];

export function BrandBanner() {
  const [index, setIndex] = useState(0);

  // Auto-play do banner (passando naturalmente a cada 6 segundos)
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-auto mt-16 flex h-[340px] w-full flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#030303] shadow-[0_20px_60px_rgba(0,0,0,0.6)] group print:hidden">
      
      {/* Imagem de Fundo Premium (Cyber) */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50 transition-transform duration-[20s] group-hover:scale-110"
        style={{ backgroundImage: "url('/images/nex_cyber_bg.jpg')" }}
      />

      {/* Overlays e Gradientes para legibilidade */}
      <div className="absolute inset-0 z-0 bg-[#050505]/50 backdrop-blur-[2px]" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/60" />
      
      {/* Brilhos Radiais Suaves */}
      <div className="absolute -right-20 -top-20 z-0 h-80 w-80 rounded-full bg-[#FF6A00]/20 blur-[120px]" />
      <div className="absolute -bottom-20 -left-20 z-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-[120px]" />

      {/* Conteúdo Central (Os Banners passando) */}
      <div className="relative z-10 flex h-full w-full items-center justify-center px-6 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -30, filter: "blur(12px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex max-w-2xl flex-col items-center"
          >
            {(() => {
              const b = BANNERS[index];
              const Icon = b.icon;
              return (
                <>
                  <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl ${b.color}`}>
                    <Icon size={32} className={b.glow} />
                  </div>
                  <h2 className="mb-4 font-display text-4xl sm:text-5xl font-light tracking-tight text-white drop-shadow-2xl">
                    {b.title}
                  </h2>
                  <p className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 drop-shadow-md">
                    {b.description}
                  </p>
                </>
              );
            })()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicadores do Carrossel (Barrinhas na parte inferior) */}
      <div className="absolute bottom-8 z-20 flex gap-3">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-700 ${
              i === index ? "w-10 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "w-3 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
