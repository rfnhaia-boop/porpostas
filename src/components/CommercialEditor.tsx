'use client';
import { usePlatformStore } from '@/store/usePlatformStore';
import { COMMERCIAL_MODELS, newCommercialConfig, commercialTotals, type CommercialConfig } from '@/lib/commercial';
import { formatBRL, toCents, toReais } from '@/lib/money';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Trash2, Copy, Plus } from 'lucide-react';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 120 } }
};

// Padrão Rafael: Inputs abertos e ousados
const sleekInput = "mt-2 w-full bg-transparent border-0 border-b-2 border-[var(--border-color)] px-0 py-2 text-xl font-light text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[#FF6A00] focus:ring-0 transition-colors";
const sleekTextarea = "mt-2 w-full rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-4 text-sm font-light text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[#FF6A00] focus:ring-0 transition-colors backdrop-blur-sm";
const sleekSelect = "mt-2 w-full bg-transparent border-0 border-b-2 border-[var(--border-color)] px-0 py-2 text-lg font-light text-[var(--foreground)] focus:border-[#FF6A00] focus:ring-0 transition-colors cursor-pointer appearance-none";
const labelStyle = "text-[9px] font-black uppercase tracking-[.25em] text-[var(--text-muted)]";

export function CommercialEditor() {
  const { quoteDraft: draft, updateQuoteDraft: update } = usePlatformStore();
  const c = draft.commercial ?? newCommercialConfig();
  
  const patch = (data: Partial<CommercialConfig>) => update({ commercial: { ...c, ...data } });
  const items = draft.services.map(s => ({ ...s, unitPrice: s.price }));
  const totals = commercialTotals(items, c);

  return (
    <motion.section 
      variants={staggerContainer} 
      initial="hidden" 
      animate="show" 
      className="mb-24 space-y-12 text-[var(--foreground)]"
    >
      {/* HEADER */}
      <motion.div variants={fadeUp} className="border-b border-[var(--border-color)] pb-8">
        <p className="mb-3 text-[10px] font-black uppercase tracking-[.3em] text-[#FF6A00]">
          Modelo Comercial
        </p>
        <h2 className="font-display text-4xl font-light tracking-tight md:text-5xl">
          Como você vai apresentar esta oferta?
        </h2>
        <p className="mt-4 text-sm font-medium text-[var(--text-muted)] max-w-2xl leading-relaxed">
          A aparência é escolhida na próxima tela. Aqui você define o escopo, os valores e a forma de cobrança.
        </p>
      </motion.div>

      {/* SELETOR DE MODELO */}
      <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {COMMERCIAL_MODELS.map(m => {
          const isSelected = c.model === m.id;
          return (
            <button 
              key={m.id} 
              type="button" 
              aria-pressed={isSelected} 
              onClick={() => update({ 
                commercial: { ...c, model: m.id }, 
                template: m.template, 
                services: draft.services.map(s => ({ 
                  ...s, 
                  billingType: m.id === 'monthly' ? 'monthly' : ['fixed', 'items'].includes(m.id) ? 'once' : s.billingType ?? 'once', 
                  packageId: m.id === 'packages' ? s.packageId ?? '' : '' 
                })) 
              })} 
              className={`group relative overflow-hidden rounded-[2rem] border p-6 text-left transition-all duration-300 ${isSelected ? 'border-[#FF6A00]/50 bg-[#FF6A00]/10 shadow-[0_0_30px_rgba(255,106,0,0.15)] scale-[1.02]' : 'border-[var(--border-color)] bg-[var(--panel-bg)] hover:bg-[var(--panel-bg)] hover:border-[var(--border-color)] backdrop-blur-sm'}`}
            >
              {isSelected && (
                <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#FF6A00]/20 blur-[40px] pointer-events-none" />
              )}
              <strong className={`block font-display text-xl tracking-tight transition-colors ${isSelected ? 'text-[var(--foreground)]' : 'text-[var(--foreground)] group-hover:text-[var(--foreground)]'}`}>
                {m.name}
              </strong>
              <span className="mt-3 block text-[11px] font-medium uppercase tracking-wider leading-relaxed text-[var(--text-muted)]">
                {m.description}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* CONFIGURAÇÕES GERAIS */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-[2.5rem] border border-[var(--border-color)] bg-[var(--panel-bg)] p-8 shadow-2xl backdrop-blur-3xl sm:p-12">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col">
            <span className={labelStyle}>Vencimento</span>
            <select
              className={sleekSelect}
              value={c.dueDateMode ?? 'fixed'}
              onChange={e => patch({ dueDateMode: e.target.value as CommercialConfig['dueDateMode'], firstDueDate: e.target.value === 'fixed' ? c.firstDueDate : '' })}
            >
              <option value="fixed" className="bg-[var(--background)] text-[var(--foreground)]">Data fixa</option>
              <option value="month_end" className="bg-[var(--background)] text-[var(--foreground)]">Fim do mês</option>
            </select>
          </label>
          {(c.dueDateMode ?? 'fixed') === 'fixed' && (
            <label className="flex flex-col">
              <span className={labelStyle}>Primeiro Vencimento</span>
              <input type="date" className={sleekInput} value={c.firstDueDate} onChange={e => patch({ firstDueDate: e.target.value })} />
            </label>
          )}
          <label className="flex flex-col">
            <span className={labelStyle}>Parcelas do Valor Único</span>
            <input type="number" min="1" max="48" className={sleekInput} value={c.installments} onChange={e => patch({ installments: Number(e.target.value) })} />
          </label>
          
          {['monthly', 'hybrid', 'packages'].includes(c.model) && (
            <>
              <label className="flex flex-col">
                <span className={labelStyle}>Vigência (meses)</span>
                <input type="number" min="1" max="60" className={sleekInput} value={c.months} onChange={e => patch({ months: Number(e.target.value) })} />
              </label>
              <label className="flex flex-col">
                <span className={labelStyle}>Permanência Mínima (meses)</span>
                <input type="number" min="0" max={c.months} className={sleekInput} value={c.commitmentMonths} onChange={e => patch({ commitmentMonths: Number(e.target.value) })} />
              </label>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-5 py-3 text-xs font-medium text-[var(--text-muted)] w-fit">
          <Calendar size={14} className="text-[#FF6A00]" />
          O aceite gera as cobranças no portal. Parcelamento divide o valor único.
        </div>

        {c.model === 'packages' && (
          <div className="mt-10 grid gap-8 sm:grid-cols-3 border-t border-[var(--border-color)] pt-10">
            {c.packages.map(p => (
              <label key={p.id} className="flex flex-col">
                <span className={labelStyle}>Nome do Pacote</span>
                <input className={sleekInput} value={p.name} onChange={e => patch({ packages: c.packages.map(v => v.id === p.id ? { ...v, name: e.target.value } : v) })} />
              </label>
            ))}
          </div>
        )}

        <div className="mt-12 grid gap-8 sm:grid-cols-2 border-t border-[var(--border-color)] pt-10">
          <label className="flex flex-col">
            <span className={labelStyle}>O que não está incluído</span>
            <textarea className={sleekTextarea} rows={3} value={c.exclusions} placeholder="Ex.: hospedagem, mídia paga e produção de fotos." onChange={e => patch({ exclusions: e.target.value })} />
          </label>
          <label className="flex flex-col">
            <span className={labelStyle}>Revisões e alterações de escopo</span>
            <textarea className={sleekTextarea} rows={3} value={c.revisions} placeholder="Ex.: duas rodadas de revisão. Novas entregas serão orçadas à parte." onChange={e => patch({ revisions: e.target.value })} />
          </label>
        </div>
      </motion.div>

      {/* COMPOSIÇÃO DOS ITENS */}
      {draft.services.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-6 pt-8">
          <div className="flex items-center gap-4 border-b border-[var(--border-color)] pb-4">
            <h3 className="font-display text-3xl font-light text-[var(--foreground)]">Composição da Oferta</h3>
            <span className="rounded-full bg-[#FF6A00]/20 px-3 py-1 text-[10px] font-black tracking-widest text-[#FF6A00]">
              {draft.services.length} ITENS
            </span>
          </div>
          
          <AnimatePresence>
            {draft.services.map((s, idx) => {
              const edit = (data: Partial<typeof s>) => update({ services: draft.services.map(v => v.id === s.id ? { ...v, ...data } : v) });
              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, height: 0 }}
                  transition={{ duration: 0.2 }}
                  key={s.id} 
                  className="group relative rounded-[2rem] border border-[var(--border-color)] bg-[var(--panel-bg)] p-8 backdrop-blur-xl transition-all hover:bg-[var(--panel-bg)] hover:border-[var(--border-color)]"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-[var(--border-color)] pb-6">
                    <div className="flex items-center gap-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--panel-bg)] font-display text-lg font-light text-[var(--text-muted)]">
                        {idx + 1}
                      </span>
                      <strong className="font-display text-2xl font-normal tracking-wide text-[var(--foreground)]">{s.name}</strong>
                    </div>
                    <div className="flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <button type="button" aria-label={`Duplicar ${s.name}`} onClick={() => update({ services: [...draft.services, { ...s, id: crypto.randomUUID(), name: s.name + ' - cópia' }] })} className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--panel-bg)] text-[var(--text-muted)] hover:bg-[var(--panel-bg)] hover:text-[var(--foreground)] transition-colors">
                        <Copy size={16} />
                      </button>
                      <button type="button" aria-label={`Remover ${s.name}`} onClick={() => update({ services: draft.services.filter(v => v.id !== s.id) })} className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="flex flex-col">
                      <span className={labelStyle}>Quantidade</span>
                      <input type="number" min="0.01" step="any" className={sleekInput} value={s.quantity} onChange={e => edit({ quantity: Number(e.target.value) })} />
                    </label>
                    <label className="flex flex-col">
                      <span className={labelStyle}>Valor Unitário</span>
                      <input type="number" min="0" step="0.01" className={sleekInput} value={toReais(s.price)} onChange={e => edit({ price: toCents(e.target.value) })} />
                    </label>
                    <label className="flex flex-col">
                      <span className={labelStyle}>Cobrança</span>
                      <select className={sleekSelect} value={s.billingType ?? 'once'} onChange={e => edit({ billingType: e.target.value as 'once' | 'monthly' })}>
                        {c.model !== 'monthly' && <option value="once" className="bg-[var(--background)] text-[var(--foreground)]">Valor único</option>}
                        {!['fixed', 'items'].includes(c.model) && <option value="monthly" className="bg-[var(--background)] text-[var(--foreground)]">Mensalidade</option>}
                      </select>
                    </label>
                    {c.model === 'packages' && (
                      <label className="flex flex-col">
                        <span className={labelStyle}>Pacote</span>
                        <select className={sleekSelect} value={s.packageId ?? ''} onChange={e => edit({ packageId: e.target.value })}>
                          <option value="" className="bg-[var(--background)] text-[var(--foreground)]">Todos</option>
                          {c.packages.map(p => <option key={p.id} value={p.id} className="bg-[var(--background)] text-[var(--foreground)]">{p.name}</option>)}
                        </select>
                      </label>
                    )}
                  </div>
                  
                  <div className="mt-8 grid gap-8 sm:grid-cols-2 border-t border-[var(--border-color)] pt-8">
                    <label className="flex flex-col">
                      <span className={labelStyle}>Descrição</span>
                      <textarea className={sleekTextarea} rows={2} value={s.description} onChange={e => edit({ description: e.target.value })} />
                    </label>
                    <label className="flex flex-col">
                      <span className={labelStyle}>Entregáveis (um por linha)</span>
                      <textarea className={sleekTextarea} rows={3} value={s.details.join('\n')} onChange={e => edit({ details: e.target.value.split('\n') })} />
                    </label>
                  </div>
                  
                  <label className="mt-8 flex w-fit cursor-pointer items-center gap-4 rounded-full border border-[var(--border-color)] bg-[var(--panel-bg)] px-6 py-3 transition-colors hover:bg-[var(--panel-bg)]">
                    <div className="relative flex h-5 w-5 items-center justify-center rounded-md border-2 border-[var(--border-color)] bg-transparent transition-colors">
                      <input type="checkbox" checked={s.optional ?? false} onChange={e => edit({ optional: e.target.checked, selected: false })} className="absolute h-full w-full cursor-pointer opacity-0" />
                      {s.optional && <div className="h-2.5 w-2.5 rounded-sm bg-[#FF6A00]" />}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Adicional Opcional</span>
                  </label>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* TOTALS BAR */}
          <motion.div variants={fadeUp} className="relative overflow-hidden flex flex-wrap items-center justify-between gap-8 rounded-[2rem] bg-gradient-to-r from-[#FF6A00]/20 to-transparent border-l-4 border-[#FF6A00] p-8 shadow-2xl">
            <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-[#FF6A00]/20 blur-[60px] pointer-events-none" />
            <div className="relative z-10 flex flex-wrap gap-6 sm:gap-12">
              <div className="flex flex-col gap-1">
                <span className={labelStyle}>Total Valor Único</span>
                <strong className="font-display text-3xl font-light text-[var(--foreground)]">{formatBRL(totals.once)}</strong>
              </div>
              <div className="flex flex-col gap-1 border-l border-[var(--border-color)] pl-12">
                <span className={labelStyle}>Total Mensalidade</span>
                <strong className="font-display text-3xl font-light text-[var(--foreground)]">{formatBRL(totals.monthly)}</strong>
              </div>
            </div>
            <div className="relative z-10 flex flex-col items-end gap-1">
              <span className="text-[10px] font-black uppercase tracking-[.4em] text-[#FF6A00]">Total no período</span>
              <strong className="font-display text-5xl font-normal tracking-tight text-[var(--foreground)] drop-shadow-[0_0_20px_rgba(255,106,0,0.4)]">
                {formatBRL(totals.total)}
              </strong>
            </div>
          </motion.div>

        </motion.div>
      )}
    </motion.section>
  );
}
