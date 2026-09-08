'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type EmailTemplateRow } from '@/lib/api';
import { ChevronDown, Loader2, Mail, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function EmailTemplatesSettings() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: api.emailTemplates.list,
  });

  return (
    <div>
      <div className="mb-10 text-center sm:text-left">
        <h3 className="mb-2 flex items-center justify-center sm:justify-start gap-3 font-display text-2xl md:text-3xl font-light text-white drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          <Mail className="text-cyan-400" size={28} />
          Automação de E-mails
        </h3>
        <p className="mx-auto sm:mx-0 max-w-lg text-sm text-white/50 leading-relaxed font-light">
          O Fechô dispara comunicações transacionais em momentos-chave da negociação. 
          Você pode personalizar a linguagem de cada evento e usar variáveis de contexto como{' '}
          <code className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-cyan-400 font-mono text-[10px]">{'{{ variável }}'}</code>.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center sm:justify-start">
          <div className="h-6 w-6 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((r) => (
            <TemplateCard key={r.key} row={r} />
          ))}
        </div>
      )}
    </div>
  );
}

const labelStyle = "text-[9px] font-black uppercase tracking-[.3em] text-white/40 block mb-2";
const sleekInput = "w-full bg-transparent border-0 border-b-2 border-white/10 px-0 py-2 text-xl font-light text-white placeholder:text-white/20 focus:border-cyan-400 focus:ring-0 transition-colors";
const sleekTextarea = "w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-sm font-light text-white placeholder:text-white/20 focus:border-cyan-400 focus:ring-0 transition-colors backdrop-blur-sm resize-y min-h-[120px]";

function TemplateCard({ row }: { row: EmailTemplateRow }) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(row.subject);
  const [title, setTitle] = useState(row.title);
  const [body, setBody] = useState(row.body);

  const dirty = subject !== row.subject || title !== row.title || body !== row.body;

  // Variáveis {{x}} que a pessoa usou mas não existem neste e-mail — sairiam vazias.
  const usedVars = Array.from(`${subject} ${title} ${body}`.matchAll(/\{\{\s*(\w+)\s*\}\}/g)).map((m) => m[1]);
  const unknownVars = Array.from(new Set(usedVars.filter((v) => !row.vars.includes(v))));

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
    <div className={`overflow-hidden rounded-3xl border transition-all duration-300 ${open ? 'border-cyan-500/30 bg-cyan-500/5 shadow-[0_20px_60px_rgba(6,182,212,0.1)]' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'}`}>
      <div 
        className="flex cursor-pointer select-none items-center justify-between gap-4 p-6"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex flex-1 items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${open ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-white/10 bg-white/5 text-white/40'}`}>
            <ChevronDown size={18} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
          </div>
          <div>
            <h4 className="font-display text-lg font-light tracking-wide text-white">{row.label}</h4>
            <span className="inline-block mt-1 rounded-full border border-white/5 bg-white/5 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] text-white/40">
              Gatilho: {row.audience}
            </span>
          </div>
        </div>
        
        {/* Switch Moderno */}
        <label className="flex shrink-0 cursor-pointer items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
            {row.enabled ? 'Ativo' : 'Inativo'}
          </span>
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={row.enabled}
              onChange={(e) => save.mutate({ enabled: e.target.checked })}
            />
            <div className={`block h-6 w-10 rounded-full transition-colors ${row.enabled ? 'bg-cyan-500' : 'bg-white/10 border border-white/20'}`}></div>
            <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${row.enabled ? 'translate-x-4 shadow-sm' : ''}`}></div>
          </div>
        </label>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="border-t border-white/5 px-6 pb-6 pt-6 sm:px-10">
              <div className="grid gap-8">
                <div>
                  <label className={labelStyle}>Assunto do E-mail</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={sleekInput}
                  />
                </div>
                
                <div>
                  <label className={labelStyle}>Título (Destaque principal dentro do E-mail)</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={sleekInput}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelStyle} style={{marginBottom: 0}}>Mensagem / Corpo</label>
                    <span className="text-[10px] text-white/30 hidden sm:block">
                      Variáveis permitidas: {row.vars.map((v) => `{{${v}}}`).join(' ')}
                    </span>
                  </div>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={5}
                    className={sleekTextarea}
                  />
                  <span className="text-[10px] text-white/30 block sm:hidden mt-2">
                    Variáveis: {row.vars.map((v) => `{{${v}}}`).join(' ')}
                  </span>
                </div>

                {unknownVars.length > 0 && (
                  <p className="text-[10px] font-bold text-amber-400">
                    Variável não reconhecida: {unknownVars.map((v) => `{{${v}}}`).join(' ')} — vai sair em branco no e-mail.
                  </p>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => save.mutate({ subject, title, body })}
                    disabled={!dirty || save.isPending}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                  >
                    {save.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                    {dirty ? 'Salvar Edição' : 'Salvo'}
                  </button>
                  
                  {row.custom && (
                    <button
                      onClick={() => reset.mutate()}
                      disabled={reset.isPending}
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/50 transition-all hover:bg-white/10 hover:text-white disabled:opacity-30"
                    >
                      <RotateCcw size={14} /> Restaurar Original
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
