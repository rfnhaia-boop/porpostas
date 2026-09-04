'use client';

import React, { useEffect, useState } from 'react';
import { usePlatformStore, SavedService } from '@/store/usePlatformStore';
import { formatBRL } from '@/lib/money';
import { PageHeader } from '@/components/layout/PageHeader';
import { NeonButton } from '@/components/ui/NeonButton';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';

export default function NewQuotePage() {
  const router = useRouter();
  const { clients, savedServices, quoteDraft, updateQuoteDraft, resetQuoteDraft, hydrated } = usePlatformStore();
  const [step, setStep] = useState<1 | 2>(1);

  // Se o rascunho ainda carrega uma proposta editada, começar do zero.
  useEffect(() => {
    if (quoteDraft.proposalId) resetQuoteDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = formatBRL;

  const toggleService = (service: SavedService) => {
    const exists = quoteDraft.services.find(s => s.id === service.id);
    if (exists) {
      updateQuoteDraft({ services: quoteDraft.services.filter(s => s.id !== service.id) });
    } else {
      updateQuoteDraft({ services: [...quoteDraft.services, service] });
    }
  };

  return (
    <div className="p-12 min-h-screen">
      <PageHeader 
        title="Novo Orçamento" 
        description={`Passo ${step} de 2`}
      />

      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-2xl font-black uppercase tracking-widest mb-8 text-brand-cyan">1. Selecione o Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {clients.map(client => (
              <div 
                key={client.id}
                onClick={() => updateQuoteDraft({ clientId: client.id })}
                className={`p-8 rounded-3xl cursor-pointer transition-all border ${
                  quoteDraft.clientId === client.id 
                    ? 'border-brand-cyan liquid-glass shadow-[0_0_40px_rgba(34,211,238,0.3)]' 
                    : 'border-white/5 liquid-glass opacity-70 hover:opacity-100 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold uppercase tracking-wide">{client.name}</h3>
                  {quoteDraft.clientId === client.id && <Check className="text-brand-cyan" size={24} />}
                </div>
                {client.company && <p className="text-brand-cyan/60 text-sm uppercase tracking-widest">{client.company}</p>}
              </div>
            ))}
            {hydrated && clients.length === 0 && (
              <p className="text-white/40 uppercase text-sm">Nenhum cliente. Cadastre primeiro.</p>
            )}
            {!hydrated && (
              <p className="text-white/40 uppercase text-sm animate-pulse">Carregando...</p>
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
          <h2 className="text-2xl font-black uppercase tracking-widest mb-8 text-brand-cyan">2. Selecione os Serviços</h2>
          <div className="flex flex-col gap-4 mb-12">
            {savedServices.map(service => {
              const isSelected = !!quoteDraft.services.find(s => s.id === service.id);
              return (
                <div 
                  key={service.id}
                  onClick={() => toggleService(service)}
                  className={`p-6 rounded-3xl flex justify-between items-center cursor-pointer transition-all border ${
                    isSelected 
                      ? 'border-brand-cyan liquid-glass shadow-[0_0_20px_rgba(34,211,238,0.2)]' 
                      : 'border-white/5 liquid-glass opacity-70 hover:opacity-100 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-brand-cyan bg-brand-cyan' : 'border-white/20'
                    }`}>
                      {isSelected && <Check size={14} className="text-black font-bold" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold uppercase tracking-wide mb-1">{service.name}</h3>
                      <p className="text-white/50 text-sm">{service.description}</p>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-brand-cyan">
                    {formatCurrency(service.price)}
                  </div>
                </div>
              );
            })}
            {hydrated && savedServices.length === 0 && (
              <p className="text-white/40 uppercase text-sm">Nenhum serviço. Cadastre primeiro.</p>
            )}
            {!hydrated && (
              <p className="text-white/40 uppercase text-sm animate-pulse">Carregando...</p>
            )}
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setStep(1)}
              className="px-8 py-4 border border-white/10 rounded-full uppercase tracking-widest text-xs font-bold hover:bg-white/5"
            >
              Voltar
            </button>
            <NeonButton 
              disabled={quoteDraft.services.length === 0} 
              onClick={() => router.push('/quotes/preview')}
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
