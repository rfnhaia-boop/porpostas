'use client';

import React, { useState } from 'react';
import { usePlatformStore, type SavedService } from '@/store/usePlatformStore';
import { toCents, toReais, formatBRL } from '@/lib/money';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { RaviServiceChat } from '@/components/ravi/RaviServiceChat';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Package, Wrench, X, Check, Sparkles } from 'lucide-react';

type Kind = 'service' | 'product';

const UNITS = ['projeto', 'hora', 'diária', 'pacote', 'unidade', 'kg', 'litro', 'mês'];

type Form = {
  billingType: 'once' | 'monthly';
  name: string;
  description: string;
  kind: Kind;
  unitLabel: string;
  priceReais: string;
  details: string; // uma linha por bullet
  defaultStages: string; // uma linha por etapa/bloco
  defaultTimeline: string;
  minCommitment: string;
};

const emptyForm = (kind: Kind): Form => ({
  billingType: 'once',
  name: '',
  description: '',
  kind,
  unitLabel: kind === 'service' ? 'projeto' : 'unidade',
  priceReais: '',
  details: '',
  defaultStages: '',
  defaultTimeline: '',
  minCommitment: '',
});

// Padrão Rafael Inputs
const labelStyle = "text-[9px] font-black uppercase tracking-[.3em] text-white/40 mb-2 block";
const sleekInput = "w-full bg-transparent border-0 border-b-2 border-white/10 px-0 py-2 text-2xl md:text-3xl font-light text-white placeholder:text-white/20 focus:border-[#FF6A00] focus:ring-0 transition-colors";
const hugeInput = "w-full bg-transparent border-0 border-b-2 border-[#FF6A00]/50 px-0 py-2 text-5xl md:text-6xl font-light text-[#FF6A00] placeholder:text-[#FF6A00]/30 focus:border-[#FF6A00] focus:ring-0 transition-colors";
const sleekTextarea = "w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-sm font-light text-white placeholder:text-white/20 focus:border-[#FF6A00] focus:ring-0 transition-colors backdrop-blur-sm resize-y min-h-[120px]";

export default function ServicesPage() {
  const { savedServices, addSavedService, updateSavedService, removeSavedService, hydrated } = usePlatformStore();
  const [editingId, setEditingId] = useState<string | null | 'new'>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm('service'));
  const [raviOpen, setRaviOpen] = useState(false);

  const openNew = (kind: Kind) => {
    setForm(emptyForm(kind));
    setEditingId('new');
  };

  const openEdit = (s: SavedService) => {
    setForm({
      billingType: s.billingType ?? 'once',
      name: s.name,
      description: s.description,
      kind: s.kind,
      unitLabel: s.unitLabel,
      priceReais: String(toReais(s.price)),
      details: (s.details ?? []).join('\n'),
      defaultStages: (s.defaultStages ?? []).join('\n'),
      defaultTimeline: s.defaultTimeline ?? '',
      minCommitment: s.minCommitment ?? '',
    });
    setEditingId(s.id);
  };

  const close = () => {
    setEditingId(null);
    setForm(emptyForm('service'));
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.priceReais === '' || saving) return;
    setSaving(true);
    const payload = {
      billingType: form.billingType,
      name: form.name.trim(),
      description: form.description,
      kind: form.kind,
      unitLabel: form.unitLabel,
      price: toCents(form.priceReais),
      details: form.details.split('\n').map((d) => d.trim()).filter(Boolean),
      defaultStages: form.defaultStages.split('\n').map((d) => d.trim()).filter(Boolean),
      defaultTimeline: form.defaultTimeline.trim(),
      minCommitment: form.minCommitment.trim(),
    };
    try {
      if (editingId === 'new') {
        await addSavedService({ ...payload, quantity: 1 });
      } else if (editingId) {
        await updateSavedService(editingId, payload);
      }
      close();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const isProduct = form.kind === 'product';

  return (
    <div className="p-4 sm:p-6 lg:p-12 min-h-screen text-white">
      <PageHeader
        title="Catálogo"
        description="Módulos, serviços e produtos que você reusa nas propostas"
        action={
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setRaviOpen(true)}
              className="flex items-center gap-2 rounded-full border border-[#FF6A00]/30 bg-[#FF6A00]/10 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#FF6A00] transition-colors hover:bg-[#FF6A00]/20"
            >
              <Sparkles size={14} /> Criar com o Ravi
            </button>
            <button
              onClick={() => openNew('service')}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/10"
            >
              <Wrench size={14} /> Novo Serviço
            </button>
            <button
              onClick={() => openNew('product')}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/10"
            >
              <Package size={14} /> Novo Produto
            </button>
          </div>
        }
      />

      {raviOpen && <RaviServiceChat onClose={() => setRaviOpen(false)} />}

      <AnimatePresence>
        {editingId && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            className="relative mb-12 overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 p-8 sm:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl"
          >
            {/* Brilhos Internos */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[#FF6A00]/50 to-transparent" />
            <div className="absolute top-[-20%] left-[-10%] h-96 w-96 rounded-full bg-[#FF6A00]/10 blur-[100px] pointer-events-none" />
            
            {/* Fechar */}
            <button onClick={close} className="absolute top-8 right-8 text-white/30 hover:text-white transition-colors">
              <X size={24} />
            </button>

            {/* Toggle Serviço / Produto */}
            <div className="relative z-10 mb-12 flex gap-2 rounded-full border border-white/5 bg-black/50 p-1 w-fit shadow-inner">
              {(['service', 'product'] as Kind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setForm((f) => ({ ...f, kind: k, unitLabel: k === 'service' ? 'projeto' : 'unidade' }))}
                  className={`rounded-full px-8 py-2.5 text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-300 ${
                    form.kind === k
                      ? 'bg-gradient-to-r from-[#FF6A00] to-[#FF8C33] text-black shadow-[0_0_20px_rgba(255,106,0,0.3)] scale-105'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  {k === 'service' ? 'Serviço' : 'Produto'}
                </button>
              ))}
            </div>

            <div className="relative z-10 grid gap-12">
              
              {/* Toggles de Configuração Comercial */}
              <div className="grid gap-12 sm:grid-cols-2">
                <div>
                  <label className={labelStyle}>Forma de Cobrança</label>
                  <div className="flex flex-wrap gap-3 mt-4">
                    {[
                      { id: 'once', label: 'Valor Único' },
                      { id: 'monthly', label: 'Mensalidade' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setForm({ ...form, billingType: opt.id as 'once' | 'monthly' })}
                        className={`rounded-full px-6 py-2 text-xs font-bold tracking-widest uppercase transition-all ${
                          form.billingType === opt.id
                            ? 'border border-[#FF6A00] bg-[#FF6A00]/10 text-[#FF6A00] shadow-[0_0_15px_rgba(255,106,0,0.15)]'
                            : 'border border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {!isProduct && (
                  <div>
                    <label className={labelStyle}>Unidade de Venda</label>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {UNITS.map(u => (
                        <button
                          key={u}
                          onClick={() => setForm({ ...form, unitLabel: u })}
                          className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                            form.unitLabel === u
                              ? 'border border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                              : 'border border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Textos Principais */}
              <div className="grid gap-10">
                <div>
                  <label className={labelStyle}>{isProduct ? 'Nome do Produto' : 'Nome do Serviço / Módulo'}</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className={sleekInput}
                    placeholder={isProduct ? "Ex: Licença Enterprise" : "Ex: Implantação de E-commerce"}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Descrição Curta (Pitch)</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className={sleekInput}
                    placeholder="Resuma em uma frase o valor entregue"
                  />
                </div>
              </div>

              {/* Valores e Prazos */}
              <div className="grid gap-12 md:grid-cols-2 items-end">
                <div>
                  <label className={labelStyle}>{isProduct ? 'Valor por Unidade (R$)' : 'Valor Base (R$)'}</label>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-light text-[#FF6A00]/50">R$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={form.priceReais}
                      onChange={e => setForm({ ...form, priceReais: e.target.value })}
                      className={hugeInput}
                      placeholder="0,00"
                    />
                  </div>
                </div>
                
                <div className="grid gap-8 sm:grid-cols-2">
                  <div>
                    <label className={labelStyle}>{isProduct ? 'Unidade' : 'Prazo Padrão'}</label>
                    <input
                      type="text"
                      value={isProduct ? form.unitLabel : form.defaultTimeline}
                      onChange={e => !isProduct && setForm({ ...form, defaultTimeline: e.target.value })}
                      readOnly={isProduct}
                      className={sleekInput}
                      placeholder={isProduct ? "" : "Ex: 3 semanas"}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Permanência Mínima</label>
                    <input
                      type="text"
                      value={form.minCommitment}
                      onChange={e => setForm({ ...form, minCommitment: e.target.value })}
                      className={sleekInput}
                      placeholder="Ex: 3 meses"
                    />
                  </div>
                </div>
              </div>

              {/* Textareas */}
              <div className="grid gap-8 md:grid-cols-2 border-t border-white/5 pt-10 mt-4">
                <div>
                  <label className={labelStyle}>Detalhes e Inclusões (1 por linha)</label>
                  <p className="text-xs text-white/30 mb-3">Liste módulos, características ou entregas exatas.</p>
                  <textarea
                    value={form.details}
                    onChange={e => setForm({ ...form, details: e.target.value })}
                    className={sleekTextarea}
                    placeholder="Ex: Módulo 1 - Diagnóstico completo&#10;Módulo 2 - Implementação do sistema&#10;Treinamento da equipe"
                  />
                </div>
                <div>
                  <label className={labelStyle}>Fases / Etapas do Projeto (1 por linha)</label>
                  <p className="text-xs text-white/30 mb-3">A jornada passo-a-passo (opcional).</p>
                  <textarea
                    value={form.defaultStages}
                    onChange={e => setForm({ ...form, defaultStages: e.target.value })}
                    className={sleekTextarea}
                    placeholder="Ex: Fase 1: Onboarding&#10;Fase 2: Execução&#10;Fase 3: Entrega"
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="mt-8 flex items-center justify-end gap-4 border-t border-white/5 pt-8">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-full px-8 py-4 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saving || !form.name.trim() || form.priceReais === ''}
                  onClick={handleSave}
                  className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-[#FF6A00] to-[#FF8C33] px-10 py-4 text-xs font-black uppercase tracking-widest text-black shadow-[0_0_30px_rgba(255,106,0,0.3)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editingId === 'new' ? 'Adicionar ao Catálogo' : 'Salvar Alterações'}
                  <Check size={16} />
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {savedServices.map((s) => (
          <div
            key={s.id}
            className="group flex cursor-pointer flex-col justify-between rounded-3xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-[#FF6A00]/50 hover:bg-[#FF6A00]/5 hover:shadow-[0_10px_40px_rgba(255,106,0,0.1)]"
            onClick={() => openEdit(s)}
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-[#FF6A00] transition-colors">
                  {s.kind === 'product' ? 'Produto' : 'Serviço'}
                </span>
                <button
                  type="button"
                  aria-label="Remover"
                  onClick={(e) => { e.stopPropagation(); removeSavedService(s.id); }}
                  className="opacity-0 transition-opacity group-hover:opacity-100 p-2 text-white/20 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <strong className="mt-4 block font-display text-xl font-light text-white">{s.name}</strong>
              <p className="mt-2 line-clamp-2 text-sm text-white/40">{s.description}</p>
            </div>
            <div className="mt-6 border-t border-white/5 pt-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">A partir de</span>
              <strong className="block font-display text-2xl font-light text-white">
                {formatBRL(s.price)}
              </strong>
            </div>
          </div>
        ))}

        {hydrated && savedServices.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={Package}
              title="Catálogo vazio"
              subtitle="Cadastre os módulos e serviços que você mais vende para montar orçamentos mais rápido."
              actionLabel="Criar Primeiro Serviço" onAction={() => openNew('service')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
