'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { usePlatformStore } from '@/store/usePlatformStore';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowRight, Check, PartyPopper, X } from 'lucide-react';
import { RaviOnboardingChat } from '@/components/ravi/RaviOnboardingChat';

const HIDE_KEY = 'fecho-onboarding-hidden';

function readHidden(): boolean {
  try {
    return localStorage.getItem(HIDE_KEY) === '1';
  } catch {
    return false;
  }
}
function writeHidden() {
  try {
    localStorage.setItem(HIDE_KEY, '1');
  } catch {
    /* ignora */
  }
}

/**
 * Acompanhamento de primeiros passos, no topo do Dashboard.
 * Some sozinho quando os 5 passos estão feitos e o usuário oculta.
 */
export function OnboardingChecklist() {
  const router = useRouter();
  const { clients, savedServices, hydrated } = usePlatformStore();
  const { data: proposals = [] } = useQuery({
    queryKey: ['proposals'],
    queryFn: api.proposals.list,
  });
  const { data: company } = useQuery({
    queryKey: ['company'],
    queryFn: api.company.get,
  });
  const [hidden, setHidden] = useState<boolean>(() => readHidden());
  const [haviOpen, setHaviOpen] = useState(false);

  if (hidden) return null;

  const hasSent = proposals.some((p) => p.status !== 'draft');
  const hasApproved = proposals.some((p) =>
    ['approved', 'in_progress', 'delivered'].includes(p.status),
  );

  const steps = [
    {
      done: !!company?.haviContext,
      label: 'Conte pro Havi sobre a empresa',
      hint: 'Uma conversa rápida — ele passa a usar esse contexto em tudo.',
      cta: 'Conversar com o Havi',
      to: '',
      action: () => setHaviOpen(true),
    },
    {
      done: savedServices.length > 0,
      label: 'Cadastre um serviço',
      hint: 'Monte seu catálogo pra reusar nas propostas.',
      cta: 'Criar serviço',
      to: '/services',
    },
    {
      done: clients.length > 0,
      label: 'Cadastre um cliente',
      hint: 'Adicione quem vai receber as propostas.',
      cta: 'Adicionar cliente',
      to: '/clients',
    },
    {
      done: proposals.length > 0,
      label: 'Monte um orçamento',
      hint: 'Junte serviços + cliente numa proposta.',
      cta: 'Montar orçamento',
      to: '/quotes/new?fresh=1',
    },
    {
      done: hasSent,
      label: 'Envie a proposta',
      hint: 'Gere o link e mande pro cliente.',
      cta: 'Ver propostas',
      to: '/proposals',
    },
    {
      done: hasApproved,
      label: 'Proposta aprovada',
      hint: 'Cliente aprovou — o ciclo fechou.',
      cta: 'Ver aprovados',
      to: '/approved',
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  // Enquanto os dados do banco não chegaram, não pisca a régua.
  if (!hydrated && doneCount === 0) return null;

  if (allDone) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="liquid-glass mb-8 flex items-center justify-between gap-4 rounded-3xl p-6 sm:p-8"
      >
        <div className="flex items-center gap-3">
          <PartyPopper size={22} className="text-[#FF6A00]" />
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-[var(--foreground)]">
              Ciclo completo
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Serviço → cliente → orçamento → envio → aprovação. Feito.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            writeHidden();
            setHidden(true);
          }}
          className="shrink-0 rounded-full border border-[var(--border-color)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
        >
          Ocultar
        </button>
      </motion.div>
    );
  }

  return (
    <>
    {haviOpen && (
      <RaviOnboardingChat onClose={() => setHaviOpen(false)} />
    )}
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="liquid-glass mb-8 rounded-3xl p-6 sm:p-8"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
          Comece por aqui
        </p>
        <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6A00]">
          {doneCount} de {steps.length}
        </span>
      </div>

      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-[var(--border-color)]">
        <div
          className="h-full rounded-full bg-[#FF6A00] transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ol className="space-y-2">
        {steps.map((step) => {
          const isNext = !step.done && steps.findIndex((s) => !s.done) === steps.indexOf(step);
          return (
            <li
              key={step.label}
              className={`flex flex-wrap items-center gap-3 rounded-2xl border p-3 sm:p-4 transition-colors ${
                step.done
                  ? 'border-transparent opacity-55'
                  : isNext
                    ? 'border-[#FF6A00]/40'
                    : 'border-[var(--border-color)]'
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                  step.done
                    ? 'border-[#FF6A00] bg-[#FF6A00] text-[#0A0A0A]'
                    : 'border-[var(--text-muted)] text-transparent'
                }`}
              >
                <Check size={13} strokeWidth={3} />
              </span>

              <div className="min-w-0 flex-1 basis-40">
                <p
                  className={`text-sm font-bold ${
                    step.done
                      ? 'text-[var(--text-muted)] line-through'
                      : 'text-[var(--foreground)]'
                  }`}
                >
                  {step.label}
                </p>
                {!step.done && (
                  <p className="text-xs text-[var(--text-muted)]">{step.hint}</p>
                )}
              </div>

              {!step.done && (
                <button
                  onClick={() => ('action' in step && step.action ? step.action() : router.push(step.to))}
                  className={`flex w-full shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors sm:w-auto sm:justify-start ${
                    isNext
                      ? 'bg-[#FF6A00] text-[#0A0A0A] hover:opacity-90'
                      : 'border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {step.cta} <ArrowRight size={12} />
                </button>
              )}
            </li>
          );
        })}
      </ol>

      <button
        onClick={() => {
          writeHidden();
          setHidden(true);
        }}
        className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
      >
        <X size={11} /> Ocultar guia
      </button>
    </motion.div>
    </>
  );
}
