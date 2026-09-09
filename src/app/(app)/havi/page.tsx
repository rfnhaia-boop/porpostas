'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { RaviServiceChat } from '@/components/ravi/RaviServiceChat';
import { RaviOnboardingChat } from '@/components/ravi/RaviOnboardingChat';
import { Building2, Check } from 'lucide-react';

export default function HaviPage() {
  const router = useRouter();
  const { data: company } = useQuery({ queryKey: ['company'], queryFn: api.company.get });
  const [onbOpen, setOnbOpen] = useState(false);
  const hasContext = !!company?.haviContext;

  return (
    <div className="mx-auto flex h-[calc(100dvh-0px)] w-full max-w-3xl flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <div className="w-full">
        <button
          onClick={() => setOnbOpen(true)}
          className={`flex w-full items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-left text-xs transition-colors ${
            hasContext
              ? 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
              : 'border-[#FF6A00]/40 bg-[#FF6A00]/[0.06] text-[var(--foreground)]'
          }`}
        >
          {hasContext ? (
            <Check size={14} className="shrink-0 text-[#FF6A00]" />
          ) : (
            <Building2 size={14} className="shrink-0 text-[#FF6A00]" />
          )}
          <span className="font-bold uppercase tracking-widest">
            {hasContext ? 'Contexto da empresa ativo' : 'O Havi ainda não conhece sua empresa'}
          </span>
          <span className="ml-auto font-black uppercase tracking-widest text-[#FF6A00]">
            {hasContext ? 'Revisar' : 'Configurar'}
          </span>
        </button>
      </div>

      <div className="min-h-0 w-full flex-1">
        <RaviServiceChat variant="page" onClose={() => router.push('/')} />
      </div>

      {onbOpen && <RaviOnboardingChat onClose={() => setOnbOpen(false)} />}
    </div>
  );
}
