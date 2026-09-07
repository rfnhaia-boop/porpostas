'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type EmailTemplateRow } from '@/lib/api';
import { ChevronDown, Loader2, Mail, RotateCcw } from 'lucide-react';

export function EmailTemplatesSettings() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: api.emailTemplates.list,
  });

  return (
    <div>
      <h3 className="text-xl font-black uppercase tracking-[0.2em] text-white mb-2 flex items-center gap-2">
        <Mail size={18} /> E-mails automáticos
      </h3>
      <p className="text-xs font-semibold text-white/50 leading-relaxed mb-6 max-w-lg">
        Cada evento dispara um e-mail. Aqui você liga/desliga e ajusta o texto. As variáveis entre{' '}
        <code className="text-white/70">{'{{ }}'}</code> são trocadas na hora do envio.
      </p>

      {isLoading ? (
        <p className="text-xs uppercase tracking-widest text-white/40 animate-pulse">Carregando…</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <TemplateCard key={r.key} row={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateCard({ row }: { row: EmailTemplateRow }) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(row.subject);
  const [title, setTitle] = useState(row.title);
  const [body, setBody] = useState(row.body);

  const dirty = subject !== row.subject || title !== row.title || body !== row.body;

  const save = useMutation({
    mutationFn: (data: Partial<Pick<EmailTemplateRow, 'subject' | 'title' | 'body' | 'enabled'>>) =>
      api.emailTemplates.save(row.key, data),
    onSuccess: invalidate,
  });
  const reset = useMutation({
    mutationFn: () => api.emailTemplates.reset(row.key),
    onSuccess: () => {
      setSubject(row.default.subject);
      setTitle(row.default.title);
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
          <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/40">
            {row.audience}
          </span>
        </button>
        <label className="flex shrink-0 cursor-pointer items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
            {row.enabled ? 'On' : 'Off'}
          </span>
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(e) => save.mutate({ enabled: e.target.checked })}
            className="h-4 w-4 accent-[#FF6A00]"
          />
        </label>
      </div>

      {open && (
        <div className="space-y-3 border-t border-white/10 p-4">
          <div>
            <label className="mb-1 block text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
              Assunto
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#FF6A00]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
              Título (dentro do e-mail)
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#FF6A00]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
              Corpo
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-sm leading-relaxed text-white outline-none focus:border-[#FF6A00]"
            />
          </div>
          <p className="text-[10px] text-white/40">
            Variáveis: {row.vars.map((v) => `{{${v}}}`).join('  ')}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => save.mutate({ subject, title, body })}
              disabled={!dirty || save.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-[#FF6A00] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-[#ff7a1a] disabled:opacity-40"
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
