'use client';

import React, { useState } from 'react';
import { usePlatformStore, Client } from '@/store/usePlatformStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { InputExpansivo } from '@/components/ui/InputExpansivo';
import { NeonButton } from '@/components/ui/NeonButton';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';

export default function ClientsPage() {
  const { clients, addClient, removeClient, hydrated } = usePlatformStore();
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({});

  const handleSave = async () => {
    if (!newClient.name || saving) return;
    setSaving(true);
    try {
      await addClient({
        name: newClient.name || '',
        company: newClient.company || '',
        document: newClient.document || '',
        email: newClient.email || '',
      });
      setNewClient({});
      setIsAdding(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar cliente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-12 min-h-screen">
      <PageHeader
        title="Clientes"
        description="Gestão da base de clientes"
        action={
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="text-[#FF6A00] uppercase tracking-widest text-xs font-bold hover:text-[var(--foreground)] flex items-center gap-2"
          >
            <Plus size={16} /> Adicionar Cliente
          </button>
        }
      />

      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass p-10 rounded-[2rem] mb-12 border-[#FF6A00]/20"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <InputExpansivo label="Nome Completo" value={newClient.name || ''} onChange={e => setNewClient({...newClient, name: e.target.value})} />
            <InputExpansivo label="Empresa" value={newClient.company || ''} onChange={e => setNewClient({...newClient, company: e.target.value})} />
            <InputExpansivo label="CNPJ / CPF" value={newClient.document || ''} onChange={e => setNewClient({...newClient, document: e.target.value})} />
            <InputExpansivo label="E-mail" value={newClient.email || ''} onChange={e => setNewClient({...newClient, email: e.target.value})} />
          </div>
          <NeonButton onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Cliente'}</NeonButton>
        </motion.div>
      )}

      {!hydrated ? (
        <p className="text-[var(--text-muted)] uppercase tracking-widest text-sm animate-pulse">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.length === 0 && !isAdding && (
            <p className="text-[var(--text-muted)] uppercase tracking-widest text-sm">Nenhum cliente cadastrado.</p>
          )}
          {clients.map(client => (
            <motion.div
              key={client.id}
              layout
              className="liquid-glass p-8 rounded-3xl group relative hover:shadow-[0_0_30px_rgba(255,106,0,0.15)] transition-all duration-500"
            >
              <h3 className="text-xl font-bold uppercase tracking-wide text-[var(--foreground)] mb-2">{client.name}</h3>
              {client.company && <p className="text-[#FF6A00] text-sm uppercase tracking-widest mb-4">{client.company}</p>}
              <div className="space-y-2 text-[var(--text-muted)] text-sm">
                <p>Doc: {client.document || 'N/A'}</p>
                <p>Email: {client.email || 'N/A'}</p>
              </div>

              <button
                onClick={() => removeClient(client.id)}
                className="absolute top-6 right-6 text-red-500/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={20} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
