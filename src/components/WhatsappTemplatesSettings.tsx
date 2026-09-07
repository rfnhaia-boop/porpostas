'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type WhatsappTemplateRow } from '@/lib/api';
import { ChevronDown, Loader2, MessageCircle, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function WhatsappTemplatesSettings() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['whatsappTemplates'],
    queryFn: api.whatsappTemplates.list,
  });

  return (
    <div>
      <div className="mb-10 text-center sm:text-left">
        <h3 className="mb-2 flex items-center justify-center sm:justify-start gap-3 font-display text-2xl md:text-3xl font-light text-white drop-shadow-[0_0_15px_rgba(255,106,0,0.4)]">
          <MessageCircle className="text-[#FF6A00]" size={28} />
          Automação de WhatsApp
        </h3>
        <p className="mx-auto sm:mx-0 max-w-lg text-sm text-white/50 leading-relaxed font-light">
          Textos inteligentes que abrem automaticamente no seu WhatsApp Web ao clicar em "Enviar Proposta" ou "Cobrar". 
          As variáveis entre <code className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#FF6A00] font-mono text-[10px]">{'{{ variável }}'}</code> são substituídas na hora.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center sm:justify-start">
          <div className="h-6 w-6 rounded-full border-2 border-[#FF6A00] border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((r) => (
            <WaCard key={r.key} row={r} />
          ))}
        </div>
      )}
    </div>
  );
}

const labelStyle = "text-[9px] font-black uppercase tracking-[.3em] text-white/40 block mb-2";
const sleekTextarea = "w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-sm font-light text-white placeholder:text-white/20 focus:border-[#FF6A00] focus:ring-0 transition-colors backdrop-blur-sm resize-y min-h-[160px]";

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
    <div className={`overflow-hidden rounded-3xl border transition-all duration-300 ${open ? 'border-[#FF6A00]/30 bg-[#FF6A00]/5 shadow-[0_20px_60px_rgba(255,106,0,0.1)]' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'}`}>
      <div 
        className="flex cursor-pointer select-none items-center justify-between gap-4 p-6"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex flex-1 items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${open ? 'border-[#FF6A00] bg-[#FF6A00]/10 text-[#FF6A00]' : 'border-white/10 bg-white/5 text-white/40'}`}>
            <ChevronDown size={18} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
          </div>
          <div>
            <h4 className="font-display text-lg font-light tracking-wide text-white">{row.label}</h4>
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
            <div className={`block h-6 w-10 rounded-full transition-colors ${row.enabled ? 'bg-[#FF6A00]' : 'bg-white/10 border border-white/20'}`}></div>
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
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelStyle} style={{marginBottom: 0}}>Texto da Mensagem</label>
                    <span className="text-[10px] text-white/30 hidden sm:block">
                      Variáveis permitidas: {row.vars.map((v) => `{{${v}}}`).join(' ')}
                    </span>
                  </div>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={6}
                    className={sleekTextarea}
                  />
                  <span className="text-[10px] text-white/30 block sm:hidden mt-2">
                    Variáveis: {row.vars.map((v) => `{{${v}}}`).join(' ')}
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => save.mutate({ body })}
                    disabled={!dirty || save.isPending}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF6A00] to-[#FF8C33] px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black shadow-[0_0_20px_rgba(255,106,0,0.3)] transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                  >
                    {save.isPending ? <Loader2 size={14} className="animate-spin text-black" /> : null}
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
