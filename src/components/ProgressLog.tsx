'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type ProgressUpdate, type DeliveryInput } from '@/lib/api';
import { CalendarPlus, Check, Link2, Loader2, Plus, Trash2 } from 'lucide-react';

function monthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
function thisMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function ProgressLog({
  proposalId,
  updates,
}: {
  proposalId: string;
  updates: ProgressUpdate[];
}) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['proposal', proposalId] });
    queryClient.invalidateQueries({ queryKey: ['proposals'] });
  };
  const [newMonth, setNewMonth] = useState(thisMonth());

  const addMonth = useMutation({
    mutationFn: (month: string) => api.progress.addMonth(proposalId, month),
    onSuccess: invalidate,
  });

  return (
    <div className="liquid-glass rounded-3xl p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
          Diário de Andamento
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={newMonth}
            onChange={(e) => setNewMonth(e.target.value)}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[#FF6A00]"
          />
          <button
            onClick={() => newMonth && addMonth.mutate(newMonth)}
            disabled={addMonth.isPending}
            className="flex items-center gap-1.5 rounded-xl bg-[#FF6A00] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white hover:bg-[#ff7a1a] transition disabled:opacity-50"
          >
            {addMonth.isPending ? <Loader2 size={13} className="animate-spin" /> : <CalendarPlus size={13} />}
            Adicionar mês
          </button>
        </div>
      </div>

      {updates.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          Nenhum mês registrado ainda. Adicione um mês pra contar o que foi feito e anexar as entregas.
        </p>
      ) : (
        <div className="space-y-4">
          {updates.map((u) => (
            <MonthCard key={u.id} proposalId={proposalId} update={u} onChanged={invalidate} />
          ))}
        </div>
      )}
    </div>
  );
}

function MonthCard({
  proposalId,
  update,
  onChanged,
}: {
  proposalId: string;
  update: ProgressUpdate;
  onChanged: () => void;
}) {
  const [summary, setSummary] = useState(update.summary);
  const [deliveries, setDeliveries] = useState<DeliveryInput[]>(
    update.deliveries.map((d) => ({ title: d.title, url: d.url })),
  );
  const [savedTick, setSavedTick] = useState(false);

  const save = useMutation({
    mutationFn: (data: { summary?: string; deliveries?: DeliveryInput[] }) =>
      api.progress.update(proposalId, update.id, data),
    onSuccess: () => {
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 1500);
      onChanged();
    },
  });
  const removeMonth = useMutation({
    mutationFn: () => api.progress.removeMonth(proposalId, update.id),
    onSuccess: onChanged,
  });

  const saveSummary = () => {
    if (summary !== update.summary) save.mutate({ summary });
  };
  const saveDeliveries = (next: DeliveryInput[]) => {
    setDeliveries(next);
  };
  const commitDeliveries = () => {
    const clean = deliveries.filter((d) => d.title.trim() || d.url.trim());
    save.mutate({ deliveries: clean });
  };

  const setRow = (i: number, patch: Partial<DeliveryInput>) =>
    saveDeliveries(deliveries.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  return (
    <div className="rounded-2xl border border-[var(--border-color)] p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-black capitalize text-[var(--foreground)]">{monthLabel(update.month)}</p>
        <div className="flex items-center gap-3">
          {save.isPending ? (
            <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />
          ) : savedTick ? (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-green-500">
              <Check size={12} /> Salvo
            </span>
          ) : null}
          <button
            onClick={() => {
              if (confirm(`Remover o mês de ${monthLabel(update.month)} do diário?`)) removeMonth.mutate();
            }}
            className="text-[var(--text-muted)] transition-colors hover:text-red-500"
            title="Remover mês"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        onBlur={saveSummary}
        rows={3}
        placeholder="O que foi feito este mês? Ex.: fechamos a identidade visual, subimos a landing, rodamos a 1ª campanha…"
        className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3 text-sm leading-relaxed outline-none focus:border-[#FF6A00]"
      />

      <div className="mt-3 space-y-2">
        {deliveries.map((d, i) => (
          <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={d.title}
              onChange={(e) => setRow(i, { title: e.target.value })}
              onBlur={commitDeliveries}
              placeholder={`Entrega ${i + 1}`}
              className="flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[#FF6A00]"
            />
            <div className="flex items-center gap-2 sm:w-1/2">
              <Link2 size={14} className="shrink-0 text-[var(--text-muted)]" />
              <input
                value={d.url}
                onChange={(e) => setRow(i, { url: e.target.value })}
                onBlur={commitDeliveries}
                placeholder="https://…"
                className="flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[#FF6A00]"
              />
              <button
                onClick={() => {
                  const next = deliveries.filter((_, idx) => idx !== i);
                  setDeliveries(next);
                  save.mutate({ deliveries: next.filter((x) => x.title.trim() || x.url.trim()) });
                }}
                className="shrink-0 text-[var(--text-muted)] transition-colors hover:text-red-500"
                title="Remover entrega"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => setDeliveries([...deliveries, { title: '', url: '' }])}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--border-color)] px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] transition-colors hover:border-[#FF6A00] hover:text-[#FF6A00]"
        >
          <Plus size={13} /> Entrega
        </button>
      </div>
    </div>
  );
}
