'use client';

import React, { useState } from 'react';
import { usePlatformStore, SavedService } from '@/store/usePlatformStore';
import { formatBRL, toCents } from '@/lib/money';
import { PageHeader } from '@/components/layout/PageHeader';
import { InputExpansivo } from '@/components/ui/InputExpansivo';
import { NeonButton } from '@/components/ui/NeonButton';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';

export default function ServicesPage() {
  const { savedServices, addSavedService, removeSavedService, hydrated } = usePlatformStore();
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  // `priceReais` guarda o valor em reais que o usuário digita; converte pra centavos ao salvar.
  const [newService, setNewService] = useState<{ name?: string; description?: string; priceReais?: number }>({});

  const formatCurrency = formatBRL;

  const handleSave = async () => {
    if (!newService.name || newService.priceReais === undefined || saving) return;
    setSaving(true);
    try {
      await addSavedService({
        name: newService.name,
        description: newService.description || '',
        price: toCents(newService.priceReais),
      });
      setNewService({});
      setIsAdding(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar serviço.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-12 min-h-screen">
      <PageHeader
        title="Catálogo de Serviços"
        description="Gerencie seus serviços e preços padrões"
        action={
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="text-brand-cyan uppercase tracking-widest text-xs font-bold hover:text-white flex items-center gap-2"
          >
            <Plus size={16} /> Adicionar Serviço
          </button>
        }
      />

      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass p-10 rounded-[2rem] mb-12 border-brand-cyan/20"
        >
          <div className="grid grid-cols-1 gap-8 mb-8">
            <InputExpansivo label="Nome do Serviço" value={newService.name || ''} onChange={e => setNewService({...newService, name: e.target.value})} />
            <InputExpansivo label="Descrição Completa" value={newService.description || ''} onChange={e => setNewService({...newService, description: e.target.value})} />
            <div className="max-w-xs">
              <InputExpansivo label="Valor Base (R$)" type="number" value={newService.priceReais ?? ''} onChange={e => setNewService({...newService, priceReais: Number(e.target.value)})} />
            </div>
          </div>
          <NeonButton onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Serviço'}</NeonButton>
        </motion.div>
      )}

      {!hydrated ? (
        <p className="text-white/40 uppercase tracking-widest text-sm animate-pulse">Carregando...</p>
      ) : (
        <div className="flex flex-col gap-4">
          {savedServices.length === 0 && !isAdding && (
            <p className="text-white/40 uppercase tracking-widest text-sm">Nenhum serviço cadastrado.</p>
          )}
          {savedServices.map(service => (
            <motion.div
              key={service.id}
              layout
              className="liquid-glass p-8 rounded-3xl flex justify-between items-center group relative pr-16 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] transition-all duration-500"
            >
              <div>
                <h3 className="text-xl font-bold uppercase tracking-wide text-white mb-2">{service.name}</h3>
                <p className="text-white/50 text-sm max-w-2xl">{service.description}</p>
              </div>
              <div className="text-3xl font-black text-brand-cyan">
                {formatCurrency(service.price)}
              </div>

              <button
                onClick={() => removeSavedService(service.id)}
                className="absolute top-1/2 -translate-y-1/2 right-6 text-red-500/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={24} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
