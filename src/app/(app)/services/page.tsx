'use client';

import React, { useState } from 'react';
import { usePlatformStore, SavedService } from '@/store/usePlatformStore';
import { formatBRL, toCents, toReais } from '@/lib/money';
import { PageHeader } from '@/components/layout/PageHeader';
import { InputExpansivo } from '@/components/ui/InputExpansivo';
import { NeonButton } from '@/components/ui/NeonButton';
import { motion } from 'framer-motion';
import { Plus, Trash2, Package, Wrench } from 'lucide-react';

type Kind = 'service' | 'product';

const UNITS = ['unidade', 'kg', 'hora', 'litro', 'm²', 'diária', 'pacote'];

type Form = {
  name: string;
  description: string;
  kind: Kind;
  unitLabel: string;
  priceReais: string;
  details: string; // uma linha por bullet
  defaultTimeline: string;
};

const emptyForm = (kind: Kind): Form => ({
  name: '',
  description: '',
  kind,
  unitLabel: kind === 'service' ? 'projeto' : 'unidade',
  priceReais: '',
  details: '',
  defaultTimeline: '',
});

export default function ServicesPage() {
  const { savedServices, addSavedService, updateSavedService, removeSavedService, hydrated } = usePlatformStore();
  const [editingId, setEditingId] = useState<string | null | 'new'>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm('service'));

  const openNew = (kind: Kind) => {
    setForm(emptyForm(kind));
    setEditingId('new');
  };

  const openEdit = (s: SavedService) => {
    setForm({
      name: s.name,
      description: s.description,
      kind: s.kind,
      unitLabel: s.unitLabel,
      priceReais: String(toReais(s.price)),
      details: (s.details ?? []).join('\n'),
      defaultTimeline: s.defaultTimeline ?? '',
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
      name: form.name.trim(),
      description: form.description,
      kind: form.kind,
      unitLabel: form.unitLabel,
      price: toCents(form.priceReais),
      details: form.details.split('\n').map((d) => d.trim()).filter(Boolean),
      defaultTimeline: form.defaultTimeline.trim(),
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
    <div className="p-12 min-h-screen">
      <PageHeader
        title="Catálogo"
        description="Serviços e produtos que você reusa nas propostas"
        action={
          <div className="flex gap-4">
            <button
              onClick={() => openNew('service')}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#FF6A00] hover:text-[var(--foreground)]"
            >
              <Wrench size={14} /> Serviço
            </button>
            <button
              onClick={() => openNew('product')}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#FF6A00] hover:text-[var(--foreground)]"
            >
              <Package size={14} /> Produto
            </button>
          </div>
        }
      />

      {editingId && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass mb-12 rounded-[2rem] border-[#FF6A00]/20 p-10"
        >
          <div className="mb-8 flex gap-2">
            {(['service', 'product'] as Kind[]).map((k) => (
              <button
                key={k}
                onClick={() => setForm((f) => ({ ...f, kind: k, unitLabel: k === 'service' ? 'projeto' : 'unidade' }))}
                className={`rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  form.kind === k
                    ? 'bg-[#FF6A00] text-[#0A0A0A]'
                    : 'border border-[var(--border-color)] text-[var(--text-muted)]'
                }`}
              >
                {k === 'service' ? 'Serviço' : 'Produto'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8">
            <InputExpansivo
              label={isProduct ? 'Nome do produto' : 'Nome do serviço'}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <InputExpansivo
              label="Descrição curta"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <InputExpansivo
                  label={isProduct ? 'Valor por unidade (R$)' : 'Valor (R$)'}
                  type="number"
                  value={form.priceReais}
                  onChange={(e) => setForm({ ...form, priceReais: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  {isProduct ? 'Unidade' : 'Prazo padrão'}
                </label>
                {isProduct ? (
                  <select
                    value={form.unitLabel}
                    onChange={(e) => setForm({ ...form, unitLabel: e.target.value })}
                    className="w-full border-b-2 border-[var(--border-color)] bg-transparent pb-2 text-3xl font-black text-[var(--foreground)] focus:border-[#FF6A00] focus:outline-none md:text-4xl"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u} className="bg-[var(--background)] text-base">
                        {u}
                      </option>
                    ))}
                  </select>
                ) : (
                  <InputExpansivo
                    placeholder="ex: 3 semanas"
                    value={form.defaultTimeline}
                    onChange={(e) => setForm({ ...form, defaultTimeline: e.target.value })}
                  />
                )}
              </div>
            </div>

            {!isProduct && (
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  Detalhes / o que inclui — 1 por linha
                </label>
                <textarea
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                  placeholder={'Diagnóstico e benchmark\nSistema visual completo\nManual de aplicação'}
                  className="min-h-[120px] w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] p-4 text-[var(--foreground)] focus:border-[#FF6A00] focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <NeonButton onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando…' : editingId === 'new' ? 'Adicionar ao catálogo' : 'Salvar alterações'}
            </NeonButton>
            <button
              onClick={close}
              className="rounded-full border border-[var(--border-color)] px-6 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--foreground)]"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      {!hydrated ? (
        <p className="animate-pulse text-sm uppercase tracking-widest text-[var(--text-muted)]">Carregando...</p>
      ) : (
        <div className="flex flex-col gap-4">
          {savedServices.length === 0 && !editingId && (
            <p className="text-sm uppercase tracking-widest text-[var(--text-muted)]">Catálogo vazio.</p>
          )}
          {savedServices.map((s) => (
            <motion.div
              key={s.id}
              layout
              onClick={() => openEdit(s)}
              className="liquid-glass group relative cursor-pointer rounded-3xl p-8 pr-16 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,106,0,0.15)]"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                        s.kind === 'product'
                          ? 'bg-[#FF6A00]/15 text-[#FF6A00]'
                          : 'bg-[var(--border-color)] text-[var(--text-muted)]'
                      }`}
                    >
                      {s.kind === 'product' ? <Package size={10} /> : <Wrench size={10} />}
                      {s.kind === 'product' ? 'Produto' : 'Serviço'}
                    </span>
                    {s.kind === 'service' && s.defaultTimeline && (
                      <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                        {s.defaultTimeline}
                      </span>
                    )}
                  </div>
                  <h3 className="truncate text-xl font-bold uppercase tracking-wide text-[var(--foreground)]">{s.name}</h3>
                  {s.description && <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">{s.description}</p>}
                  {s.details.length > 0 && (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      {s.details.length} {s.details.length === 1 ? 'item incluído' : 'itens incluídos'}
                    </p>
                  )}
                </div>
                <div className="whitespace-nowrap text-right">
                  <div className="text-2xl font-black text-[#FF6A00]">{formatBRL(s.price)}</div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                    por {s.unitLabel}
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeSavedService(s.id);
                }}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-red-500/50 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
              >
                <Trash2 size={22} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
