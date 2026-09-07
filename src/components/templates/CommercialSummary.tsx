import type { QuoteView } from '@/lib/quoteView';
import { commercialTotals, commercialSchedule, commercialPaymentTerms, COMMERCIAL_MODELS } from '@/lib/commercial';
import { formatBRL } from '@/lib/money';

export function CommercialSummary({ q }: { q: QuoteView }) {
  const c = q.commercial;
  if (!c) return null;
  const totals = commercialTotals(q.items, c);
  let schedule: ReturnType<typeof commercialSchedule> = [];
  try { schedule = commercialSchedule(q.items, c); } catch { /* Incomplete draft: the editor supplies validation. */ }
  return <section className="mx-auto w-full max-w-[21cm] bg-white px-6 py-10 text-[#17231f] sm:px-12 print:break-before-page print:px-0">
    <p className="text-xs font-bold uppercase tracking-widest text-[#a84400]">Condições comerciais</p><h2 className="mt-2 font-display text-3xl">{COMMERCIAL_MODELS.find(m => m.id === c.model)?.name}</h2>
    <div className="my-6 grid gap-4 sm:grid-cols-3"><div className="rounded-xl bg-[#f4f5f3] p-4"><p className="text-xs">{totals.monthly ? 'Implantação / valor único' : 'Valor único'}</p><strong className="text-xl">{formatBRL(totals.once)}</strong></div>{totals.monthly > 0 && <div className="rounded-xl bg-[#f4f5f3] p-4"><p className="text-xs">Mensalidade · {c.months} meses</p><strong className="text-xl">{formatBRL(totals.monthly)}</strong></div>}<div className="rounded-xl bg-[#fff0e5] p-4"><p className="text-xs">Total contratado no período</p><strong className="text-xl">{formatBRL(totals.total)}</strong></div></div>
    <p className="text-sm leading-relaxed">{commercialPaymentTerms(q.items, c, formatBRL)}</p>
    {c.exclusions && <div className="mt-6"><h3 className="font-bold">Não incluído</h3><p className="mt-2 whitespace-pre-wrap text-sm">{c.exclusions}</p></div>}
    {c.revisions && <div className="mt-6"><h3 className="font-bold">Revisões e alterações</h3><p className="mt-2 whitespace-pre-wrap text-sm">{c.revisions}</p></div>}
    {schedule.length > 0 && <div className="mt-8"><h3 className="mb-3 font-bold">Calendário de pagamentos</h3><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-3">Cobrança</th><th>Vencimento</th><th className="text-right">Valor</th></tr></thead><tbody>{schedule.map((p, i) => <tr key={i} className="border-b border-black/10"><td className="py-3">{p.label}</td><td>{p.dueDate.toISOString().slice(0, 10).split('-').reverse().join('/')}</td><td className="text-right tabular-nums">{formatBRL(p.amount)}</td></tr>)}</tbody></table></div></div>}
  </section>;
}
