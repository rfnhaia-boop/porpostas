'use client';
import type { QuoteView } from '@/lib/quoteView';
import { commercialTotals, type CommercialConfig } from '@/lib/commercial';
import { formatBRL } from '@/lib/money';

export function CommercialChoices({ q, onChange, disabled = false }: { q: QuoteView; onChange: (c: CommercialConfig, optionalIds: string[]) => void; disabled?: boolean }) {
  const c = q.commercial;
  if (!c) return null;
  const optionalIds = q.items.filter(i => i.optional && i.selected).map(i => i.id);
  const optional = q.items.filter(i => i.optional && (!i.packageId || i.packageId === c.selectedPackage));
  if (c.model !== 'packages' && !optional.length) return null;
  return <section className="mx-auto max-w-5xl rounded-3xl border border-[var(--border-color)] bg-[var(--background)] p-6 text-[var(--foreground)] sm:p-8 print:hidden">
    <h2 className="text-xl font-bold">{disabled ? 'Oferta contratada' : 'Personalize sua proposta'}</h2>
    {c.model === 'packages' && <div className="mt-5 grid gap-4 md:grid-cols-3">{c.packages.map(p => {
      const total = commercialTotals(q.items, { ...c, selectedPackage: p.id });
      return <label key={p.id} className={`rounded-2xl border p-5 ${c.selectedPackage === p.id ? 'border-[#FF6A00] bg-[#FF6A00]/10' : 'border-[var(--border-color)]'}`}><span className="flex gap-3 font-bold"><input disabled={disabled} type="radio" name="commercial-package" value={p.id} checked={c.selectedPackage === p.id} onChange={() => onChange({ ...c, selectedPackage: p.id }, optionalIds)} className="accent-[#FF6A00]"/>{p.name}</span><p className="mt-4 text-xl font-bold">{formatBRL(total.total)}</p><p className="mt-1 text-xs text-[var(--text-muted)]">Total no período{total.monthly ? ` · ${formatBRL(total.monthly)}/mês` : ''}</p><ul className="mt-4 space-y-2 text-sm">{q.items.filter(i => !i.optional && (!i.packageId || i.packageId === p.id)).map(i => <li key={i.id}>{i.name}</li>)}</ul></label>;
    })}</div>}
    {optional.length > 0 && <fieldset className="mt-6 space-y-3"><legend className="mb-3 text-sm font-bold">Adicionais opcionais</legend>{optional.map(i => <label key={i.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] p-4 text-sm"><span className="flex items-center gap-3"><input disabled={disabled} type="checkbox" checked={i.selected ?? false} onChange={e => onChange(c, e.target.checked ? [...optionalIds, i.id] : optionalIds.filter(id => id !== i.id))} className="accent-[#FF6A00]"/>{i.name}</span><strong>{formatBRL(Math.round(i.unitPrice * i.quantity))}{i.billingType === 'monthly' ? '/mês' : ''}</strong></label>)}</fieldset>}
  </section>;
}
