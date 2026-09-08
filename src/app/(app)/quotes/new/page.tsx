'use client';

import React, { useEffect, useState } from 'react';
import { usePlatformStore, SavedService } from '@/store/usePlatformStore';
import { formatBRL } from '@/lib/money';
import { PageHeader } from '@/components/layout/PageHeader';
import { NeonButton } from '@/components/ui/NeonButton';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { CommercialEditor } from '@/components/CommercialEditor';
import { newCommercialConfig, validateCommercial } from '@/lib/commercial';
import { Check } from 'lucide-react';

export default function NewQuotePage() {
  const router = useRouter();
  const { clients, savedServices, quoteDraft, updateQuoteDraft, resetQuoteDraft, hydrated } = usePlatformStore();
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  // "Novo Orçamento" (?fresh=1) sempre começa do zero. Também zera se o rascunho
  // ainda carrega uma proposta que estava sendo editada. Voltar da tela de preview
  // (sem ?fresh) preserva o que já foi montado.
  useEffect(() => {
    const fresh = new URLSearchParams(window.location.search).has('fresh');
    if (fresh) {
      resetQuoteDraft();
      if (fresh) window.history.replaceState(null, '', '/quotes/new');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = formatBRL;

  const DEFAULT_TIMELINE = '30 dias úteis';

  const toggleService = (service: SavedService) => {
    const exists = quoteDraft.services.find((s) => s.id === service.id);
    if (exists) {
      updateQuoteDraft({ services: quoteDraft.services.filter((s) => s.id !== service.id) });
      return;
    }
    // A cobrança do item tem que respeitar o modelo comercial escolhido:
    // 'monthly' força mensalidade; 'fixed'/'items' só aceitam valor único;
    // 'hybrid'/'packages' (ou sem modelo) mantêm o que veio do catálogo.
    const m = quoteDraft.commercial?.model;
    const billingType =
      m === 'monthly' ? 'monthly' : m === 'fixed' || m === 'items' ? 'once' : service.billingType ?? 'once';
    const patch: Partial<typeof quoteDraft> = {
      services: [...quoteDraft.services, { ...service, quantity: 1, billingType, optional: false, selected: true, packageId: '' }],
    };
    // Se o serviço tem prazo padrão e o prazo ainda está no default, aproveita.
    if (service.defaultTimeline && quoteDraft.timeline === DEFAULT_TIMELINE) {
      patch.timeline = service.defaultTimeline;
    }
    updateQuoteDraft(patch);
  };

  const setItemQty = (id: string, qty: number) => {
    updateQuoteDraft({
      services: quoteDraft.services.map((s) =>
        s.id === id ? { ...s, quantity: Number.isFinite(qty) && qty > 0 ? qty : 1 } : s,
      ),
    });
  };
  const perUnit = (s: SavedService) => s.kind === 'product' || (s.unitLabel !== 'projeto' && s.unitLabel !== '');

  return (
    <div className="p-4 sm:p-6 lg:p-12 min-h-screen">
      <PageHeader 
        title="Novo Orçamento" 
        description={`Passo ${step} de 2`}
      />

      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-widest mb-8 text-[#FF6A00]">1. Selecione o Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
            {clients.map(client => (
              <div
                key={client.id}
                onClick={() => updateQuoteDraft({ clientId: client.id })}
                className={`p-6 sm:p-8 rounded-3xl cursor-pointer transition-all border ${
                  quoteDraft.clientId === client.id 
                    ? 'border-[#FF6A00] liquid-glass shadow-[0_0_40px_rgba(255,106,0,0.3)]' 
                    : 'border-[var(--border-color)] liquid-glass opacity-70 hover:opacity-100 hover:border-[var(--border-color)]'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="text-lg sm:text-xl font-bold uppercase tracking-wide break-words min-w-0">{client.name}</h3>
                  {quoteDraft.clientId === client.id && <Check className="text-[#FF6A00] shrink-0" size={24} />}
                </div>
                {client.company && <p className="text-[#FF6A00]/60 text-sm uppercase tracking-widest break-words">{client.company}</p>}
              </div>
            ))}
            {hydrated && clients.length === 0 && (
              <p className="text-[var(--text-muted)] uppercase text-sm">Nenhum cliente. Cadastre primeiro.</p>
            )}
            {!hydrated && (
              <p className="text-[var(--text-muted)] uppercase text-sm animate-pulse">Carregando...</p>
            )}
          </div>

          <NeonButton 
            disabled={!quoteDraft.clientId} 
            onClick={() => setStep(2)}
            className={!quoteDraft.clientId ? 'opacity-50 cursor-not-allowed' : ''}
          >
            Avançar
          </NeonButton>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <CommercialEditor />
          {!quoteDraft.commercial && <button className="mb-5 text-sm text-[#FF6A00]" onClick={() => updateQuoteDraft({ commercial: newCommercialConfig() })}>Aplicar modelo comercial a esta proposta</button>}

          <div className="mb-10 rounded-3xl border border-[var(--border-color)] liquid-glass p-6">
            <h3 className="mb-1 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Início do projeto</h3>
            <p className="mb-4 text-sm text-[var(--text-muted)]">Quando a execução e os prazos começam a contar.</p>
            <div className="flex flex-col gap-3">
              {[
                { v: false, label: 'Começa quando o cliente aceitar', hint: 'A proposta aceita já entra em execução.' },
                { v: true, label: 'Só começa depois que eu anexar o contrato assinado', hint: 'A proposta fica "aguardando contrato" até você anexá-lo. Aí os prazos passam a contar.' },
              ].map((opt) => {
                const active = !!quoteDraft.requiresSignedContract === opt.v;
                return (
                  <button
                    key={String(opt.v)}
                    type="button"
                    onClick={() => updateQuoteDraft({ requiresSignedContract: opt.v })}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                      active ? 'border-[#FF6A00] bg-[#FF6A00]/[0.06]' : 'border-[var(--border-color)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        active ? 'border-[#FF6A00]' : 'border-[var(--border-color)]'
                      }`}
                    >
                      {active && <span className="h-2.5 w-2.5 rounded-full bg-[#FF6A00]" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-[var(--foreground)]">{opt.label}</span>
                      <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{opt.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <h2 className="text-xl font-bold mb-6">Adicionar serviços do catálogo</h2>
          <div className="flex flex-col gap-4 mb-12">
            {savedServices.map(service => {
              const chosen = quoteDraft.services.find(s => s.id === service.id);
              const isSelected = !!chosen;
              const qty = chosen?.quantity ?? 1;
              return (
                <div
                  key={service.id}
                  className={`rounded-3xl border p-6 transition-all ${
                    isSelected
                      ? 'border-[#FF6A00] liquid-glass shadow-[0_0_20px_rgba(255,106,0,0.2)]'
                      : 'border-[var(--border-color)] liquid-glass opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex cursor-pointer items-start sm:items-center justify-between gap-3" onClick={() => toggleService(service)}>
                    <div className="flex items-start sm:items-center gap-3 sm:gap-6 min-w-0">
                      <div className={`mt-0.5 sm:mt-0 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        isSelected ? 'border-[#FF6A00] bg-[#FF6A00]' : 'border-[var(--border-color)]'
                      }`}>
                        {isSelected && <Check size={14} className="font-bold text-black" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="mb-1 flex flex-wrap items-center gap-2 text-lg sm:text-xl font-bold uppercase tracking-wide break-words">
                          {service.name}
                          {service.kind === 'product' && (
                            <span className="rounded-full bg-[#FF6A00]/15 px-2 py-0.5 text-[9px] font-bold text-[#FF6A00]">Produto</span>
                          )}
                        </h3>
                        <p className="text-sm text-[var(--text-muted)] break-words">{service.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl sm:text-2xl font-black text-[#FF6A00]">{formatCurrency(service.price)}</div>
                      <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">por {service.unitLabel}</div>
                    </div>
                  </div>

                  {isSelected && perUnit(service) && (
                    <div className="mt-4 flex items-center justify-end gap-3 border-t border-[var(--border-color)] pt-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Quantidade</span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={qty}
                        onChange={(e) => setItemQty(service.id, Number(e.target.value))}
                        className="w-20 border-b-2 border-[var(--border-color)] bg-transparent pb-1 text-center text-lg font-bold text-[var(--foreground)] focus:border-[#FF6A00] focus:outline-none"
                      />
                      <span className="text-sm text-[var(--text-muted)]">{service.unitLabel}</span>
                      <span className="ml-auto text-lg font-black text-[var(--foreground)]">
                        = {formatCurrency(Math.round(qty * service.price))}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            {hydrated && savedServices.length === 0 && (
              <p className="text-[var(--text-muted)] uppercase text-sm">Nenhum serviço. Cadastre primeiro.</p>
            )}
            {!hydrated && (
              <p className="text-[var(--text-muted)] uppercase text-sm animate-pulse">Carregando...</p>
            )}
          </div>

          {error && <p role="alert" className="mb-4 text-sm text-red-500">{error}</p>}
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setStep(1)}
              className="px-8 py-4 border border-[var(--border-color)] rounded-full uppercase tracking-widest text-xs font-bold hover:bg-[var(--panel-bg)]"
            >
              Voltar
            </button>
            <NeonButton 
              disabled={quoteDraft.services.length === 0} 
              onClick={() => { try { if (quoteDraft.commercial) validateCommercial(quoteDraft.services.map(s => ({ ...s, unitPrice: s.price })), quoteDraft.commercial, true); setError(''); router.push('/quotes/preview'); } catch (e) { setError(e instanceof Error ? e.message : 'Revise a proposta.'); } }}
              className={quoteDraft.services.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Gerar e Visualizar Orçamento
            </NeonButton>
          </div>
        </motion.div>
      )}
    </div>
  );
}
