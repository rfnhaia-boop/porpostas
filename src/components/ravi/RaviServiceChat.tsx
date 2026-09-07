'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePlatformStore } from '@/store/usePlatformStore';
import { toCents } from '@/lib/money';
import { formatBRL } from '@/lib/money';
import { Sparkles, Send, X, Loader2, Check } from 'lucide-react';

interface ServiceDraft {
  name: string;
  kind: 'service' | 'product';
  billingType: 'once' | 'monthly';
  priceReais: number;
  unitLabel: string;
  description: string;
  details: string[];
  defaultStages: string[];
  defaultTimeline: string;
  minCommitment: string;
}
type Msg = { role: 'user' | 'assistant'; content: string };

const GREETING =
  'Oi! Me conta o que você vende que eu monto o serviço no catálogo. Pode ser bem direto — ex: "gestão de tráfego, mensal, R$ 1.500".';

export function RaviServiceChat({ onClose }: { onClose: () => void }) {
  const addSavedService = usePlatformStore((s) => s.addSavedService);
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState<ServiceDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking, draft]);

  const send = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    setThinking(true);
    setErr(null);
    setDraft(null);
    try {
      const res = await fetch('/api/ravi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha.');
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
      if (data.draft) setDraft(data.draft);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Não consegui responder.');
    } finally {
      setThinking(false);
    }
  };

  const createService = async () => {
    if (!draft || saving) return;
    setSaving(true);
    setErr(null);
    try {
      await addSavedService({
        name: draft.name,
        description: draft.description,
        kind: draft.kind,
        billingType: draft.billingType,
        unitLabel: draft.unitLabel,
        price: toCents(draft.priceReais),
        details: draft.details,
        defaultStages: draft.defaultStages,
        defaultTimeline: draft.defaultTimeline,
        minCommitment: draft.minCommitment,
        quantity: 1,
      });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setSavedName(draft.name);
      setDraft(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="liquid-glass flex w-full max-w-lg flex-col rounded-3xl p-5 sm:p-6 max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#FF6A00]">
            <Sparkles size={15} /> Criar serviço com o Ravi
          </p>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'ml-auto bg-[#FF6A00] text-[#0A0A0A]'
                  : 'bg-white/5 text-[var(--foreground)]'
              }`}
            >
              {m.content}
            </div>
          ))}

          {thinking && (
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Loader2 size={13} className="animate-spin" /> Ravi está pensando…
            </div>
          )}

          {draft && (
            <div className="rounded-2xl border border-[#FF6A00]/40 bg-[#FF6A00]/5 p-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#FF6A00]">
                Rascunho
              </p>
              <p className="text-base font-bold text-[var(--foreground)]">{draft.name}</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {draft.kind === 'product' ? 'Produto' : 'Serviço'} ·{' '}
                {draft.billingType === 'monthly' ? 'mensalidade' : 'valor único'} ·{' '}
                {formatBRL(toCents(draft.priceReais))} / {draft.unitLabel}
                {draft.defaultTimeline ? ` · ${draft.defaultTimeline}` : ''}
                {draft.minCommitment ? ` · fidelidade ${draft.minCommitment}` : ''}
              </p>
              {draft.description && (
                <p className="mt-2 text-xs text-[var(--text-muted)]">{draft.description}</p>
              )}
              {draft.details.length > 0 && (
                <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-[var(--text-muted)]">
                  {draft.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
              {draft.defaultStages.length > 0 && (
                <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                  Etapas: {draft.defaultStages.join(' → ')}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={createService}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-full bg-[#FF6A00] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[#0A0A0A] disabled:opacity-50"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Criar serviço
                </button>
                <button
                  onClick={() => setDraft(null)}
                  className="rounded-full border border-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white"
                >
                  Ajustar
                </button>
              </div>
            </div>
          )}

          {savedName && (
            <div className="flex items-center gap-2 rounded-2xl border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-400">
              <Check size={15} /> "{savedName}" foi pro catálogo.
            </div>
          )}

          {err && <p className="text-xs font-bold text-red-400">{err}</p>}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Escreve pro Ravi…"
            className="flex-1 rounded-full border border-white/15 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-[#FF6A00]"
          />
          <button
            onClick={send}
            disabled={!input.trim() || thinking}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF6A00] text-[#0A0A0A] disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
