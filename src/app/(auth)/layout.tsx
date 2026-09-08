import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#030303] px-4 py-12 transition-colors overflow-hidden">
      
      {/* Padrão Rafael: Fundo Atmosférico e Glows */}
      <div className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none"
           style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div className="absolute top-[-10%] left-[-10%] h-[700px] w-[700px] rounded-full bg-[#FF6A00]/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/nex-logo.webp"
            alt="NEX"
            className="h-12 w-auto drop-shadow-[0_0_15px_rgba(255,106,0,0.3)]"
          />
          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.4em] text-white/40">
            Acesso Restrito
          </p>
        </div>
        
        {/* Container que envolve as telas de login/signup dando o toque acrílico final */}
        <div className="rounded-[2.5rem] border border-white/5 border-t-white/10 bg-black/40 p-8 md:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl relative overflow-hidden">
          {/* Brilho interno de trava */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-[#FF6A00]/15 blur-[60px] pointer-events-none" />
          
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
