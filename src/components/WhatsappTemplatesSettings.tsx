'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type WhatsappTemplateRow } from '@/lib/api';
import { ChevronDown, Loader2, MessageCircle, RotateCcw } from 'lucide-react';

export function WhatsappTemplatesSettings() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['whatsappTemplates'],
    queryFn: api.whatsappTemplates.list,
  });

  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-xl font-black uppercase tracking-[0.2em] text-white">
        <MessageCircle size={18} /> Mensagens de WhatsApp
      </h3>
      <p className="mb-6 max-w-lg text-xs font-semibold leading-relaxed text-white/50">
        Textos prontos que abrem no WhatsApp quando você clica em &ldquo;Enviar por WhatsApp&rdquo; nas
        propostas e cobranças. As variáveis entre <code className="text-white/70">{'{{ }}'}</code> são
        trocadas na hora.
      </p>

      {isLoading ? (
        <p className="animate-pulse text-xs uppercase tracking-widest text-white/40">Carregando…</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <WaCard key={r.key} row={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function WaCard({ row }: { row: WhatsappTemplateRow }) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['whatsappTemplates'] });
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(row.body);
  const dirty = body !== row.body;

  const save = useMutation({
    mutationFn: (data: Partial<Pick<WhatsappTemplateRow, 'body' | 'enabled'>>) =>
      api.whatsappTemplates.save(row.key, data),
    onSuccess: invalidate,
  });
  const reset = useMutation({
    mutationFn: () => api.whatsappTemplates.reset(row.key),
    onSuccess: () => {
      setBody(row.default.body);
      invalidate();
    },
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30">
      <div className="flex items-center justify-between gap-3 p-4">
        <button onClick={() => setOpen((v) => !v)} className="flex min-w-0 items-center gap-2 text-left">
          <ChevronDown
            size={15}
            className={`shrink-0 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
          />
          <span className="truncate text-sm font-bold text-white">{row.label}</span>
        </button>
        <label className="flex shrink-0 cursor-pointer items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
            {row.enabled ? 'On' : 'Off'}
          </span>
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(e) => save.mutate({ enabled: e.target.checked })}
            className="h-4 w-4 accent-[#25D366]"
          />
        </label>
      </div>

      {open && (
        <div className="space-y-3 border-t border-white/10 p-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-sm leading-relaxed text-white outline-none focus:border-[#25D366]"
          />
          <p className="text-[10px] text-white/40">
            Variáveis: {row.vars.map((v) => `{{${v}}}`).join('  ')}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => save.mutate({ body })}
              disabled={!dirty || save.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-[#25D366] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[#07170c] transition hover:opacity-90 disabled:opacity-40"
            >
              {save.isPending ? <Loader2 size={12} className="animate-spin" /> : null}
              Salvar
            </button>
            {row.custom && (
              <button
                onClick={() => reset.mutate()}
                disabled={reset.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white/50 transition hover:text-white disabled:opacity-40"
              >
                <RotateCcw size={11} /> Restaurar padrão
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
