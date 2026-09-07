'use client';

import React, { useState } from 'react';
import { usePlatformStore, SavedService } from '@/store/usePlatformStore';
import { formatBRL, toCents, toReais } from '@/lib/money';
import { PageHeader } from '@/components/layout/PageHeader';
import { InputExpansivo } from '@/components/ui/InputExpansivo';
import { NeonButton } from '@/components/ui/NeonButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { motion } from 'framer-motion';
import { Plus, Trash2, Package, Wrench } from 'lucide-react';

type Kind = 'service' | 'product';

const UNITS = ['unidade', 'kg', 'hora', 'litro', 'm²', 'diária', 'pacote'];

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
    <div className="p-4 sm:p-6 lg:p-12 min-h-screen">
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
          initial={{ opacity: 0, y: -16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          className="relative mb-8 sm:mb-12 overflow-hidden rounded-[2.5rem] border border-white/10 p-8 sm:p-12 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
          style={{
            background: "linear-gradient(135deg, rgba(30, 30, 30, 0.4) 0%, rgba(5, 5, 5, 0.6) 100%)",
            backdropFilter: "blur(60px) saturate(200%)",
            WebkitBackdropFilter: "blur(60px) saturate(200%)",
          }}
        >
          {/* Reflexo superior do vidro */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
          
          {/* Glow Radial Interno */}
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-40 bg-[#FF6A00]/10 blur-[100px] rounded-[100%] pointer-events-none" />

          <div className="relative z-10 mb-10 flex gap-2 rounded-full border border-white/10 bg-black/40 p-1 w-fit shadow-inner">
            {(['service', 'product'] as Kind[]).map((k) => (
              <button
                key={k}
                onClick={() => setForm((f) => ({ ...f, kind: k, unitLabel: k === 'service' ? 'projeto' : 'unidade' }))}
                className={`rounded-full px-8 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                  form.kind === k
                    ? 'bg-gradient-to-r from-[#FF6A00] to-[#FF8A3D] text-[#0A0A0A] shadow-[0_0_15px_rgba(255,106,0,0.4)]'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {k === 'service' ? 'Serviço' : 'Produto'}
              </button>
            ))}
          </div>

          <div className="relative z-10 grid grid-cols-1 gap-10">
            <label className="text-sm text-white">Forma de cobrança<select aria-label="Forma de cobrança" value={form.billingType} onChange={e => setForm({ ...form, billingType: e.target.value as 'once' | 'monthly' })} className="mt-2 w-full rounded-xl border border-white/20 bg-[#171717] p-3"><option value="once">Valor único</option><option value="monthly">Mensalidade</option></select></label>
            {!isProduct && <label className="text-sm text-white">Unidade de venda<select aria-label="Unidade de venda" value={form.unitLabel} onChange={e => setForm({ ...form, unitLabel: e.target.value })} className="mt-2 w-full rounded-xl border border-white/20 bg-[#171717] p-3">{['projeto', 'hora', 'diária', 'pacote', 'unidade'].map(u => <option key={u} value={u}>{u}</option>)}</select></label>}
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

            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <InputExpansivo
                  label={isProduct ? 'Valor por unidade (R$)' : 'Valor (R$)'}
                  type="number"
                  value={form.priceReais}
                  onChange={(e) => setForm({ ...form, priceReais: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
                  {isProduct ? 'Unidade' : 'Prazo padrão'}
                </label>
                {isProduct ? (
                  <select
                    value={form.unitLabel}
                    onChange={(e) => setForm({ ...form, unitLabel: e.target.value })}
                    className="w-full border-b-2 border-[var(--border-color)] bg-transparent pb-2 text-3xl font-black text-[var(--foreground)] focus:border-[#FF6A00] focus:outline-none md:text-4xl transition-colors cursor-pointer"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u} className="bg-[#0A0A0A] text-base font-medium">
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
                <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
                  Fidelidade — permanência mínima
                </label>
                <InputExpansivo
                  placeholder="ex: 3 meses"
                  value={form.minCommitment}
                  onChange={(e) => setForm({ ...form, minCommitment: e.target.value })}
                />
                <p className="mt-2 text-[9px] uppercase tracking-wider text-white/30">
                  Tempo mínimo antes do cliente poder cancelar. Depois disso ele sai quando quiser.
                </p>
              </div>
            )}

            {!isProduct && (
              <div>
                <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
                  Detalhes / o que inclui — 1 por linha
                </label>
                <textarea
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                  placeholder={'Diagnóstico e benchmark\nSistema visual completo\nManual de aplicação'}
                  className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-black/40 p-5 text-white text-sm focus:border-[#FF6A00] focus:outline-none transition-colors resize-none placeholder:text-white/20"
                />
              </div>
            )}

            {!isProduct && (
              <div>
                <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
                  Etapas / blocos do projeto — 1 por linha
                </label>
                <textarea
                  value={form.defaultStages}
                  onChange={(e) => setForm({ ...form, defaultStages: e.target.value })}
                  placeholder={'Construção da marca\nAplicação e subida\nConteúdo + tráfego pago'}
                  className="min-h-[110px] w-full rounded-2xl border border-white/10 bg-black/40 p-5 text-white text-sm focus:border-[#FF6A00] focus:outline-none transition-colors resize-none placeholder:text-white/20"
                />
                <p className="mt-2 text-[9px] uppercase tracking-wider text-white/30">
                  Depois de aprovado, você puxa essas etapas na página do projeto e vai marcando o que já foi feito.
                </p>
              </div>
            )}
          </div>

          <div className="relative z-10 mt-12 flex flex-wrap gap-4 items-center">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-gradient-to-r from-[#FF6A00] to-[#FF8A3D] px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#0A0A0A] shadow-[0_0_20px_rgba(255,106,0,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,106,0,0.6)] disabled:opacity-50"
            >
              {saving ? 'Salvando...' : editingId === 'new' ? 'Adicionar ao catálogo' : 'Salvar alterações'}
            </button>
            <button
              onClick={close}
              className="rounded-full border border-white/10 px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 transition-all hover:border-white/30 hover:text-white hover:bg-white/5"
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
            <EmptyState
              icon={Wrench}
              title="Catálogo vazio"
              subtitle="Cadastre os serviços e produtos que você reusa nas propostas."
              actionLabel="Criar primeiro serviço"
              onAction={() => openNew('service')}
            />
          )}
          {savedServices.map((s) => (
            <motion.div
              key={s.id}
              layout
              onClick={() => openEdit(s)}
              className="liquid-glass group relative cursor-pointer rounded-3xl p-6 pr-12 sm:p-8 sm:pr-16 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,106,0,0.15)]"
            >
              <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3 sm:gap-6">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
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
                    {s.kind === 'service' && s.minCommitment && (
                      <span className="text-[10px] uppercase tracking-widest text-[#FF6A00]">
                        fidelidade {s.minCommitment}
                      </span>
                    )}
                  </div>
                  <h3 className="truncate text-lg sm:text-xl font-bold uppercase tracking-wide text-[var(--foreground)]">{s.name}</h3>
                  {s.description && <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)] break-words">{s.description}</p>}
                  {s.details.length > 0 && (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      {s.details.length} {s.details.length === 1 ? 'item incluído' : 'itens incluídos'}
                    </p>
                  )}
                </div>
                <div className="whitespace-nowrap text-left sm:text-right shrink-0">
                  <div className="text-xl sm:text-2xl font-black text-[#FF6A00]">{formatBRL(s.price)}</div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                    {s.billingType === 'monthly' ? 'mensal · por ' : 'por '}{s.unitLabel}
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeSavedService(s.id);
                }}
                className="absolute right-4 top-6 sm:right-6 sm:top-1/2 sm:-translate-y-1/2 text-red-500/50 opacity-100 transition-all hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
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
