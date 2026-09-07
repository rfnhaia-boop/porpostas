'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePlatformStore } from '@/store/usePlatformStore';
import { toCents, formatBRL } from '@/lib/money';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowUp,
  X,
  Loader2,
  Check,
  Mic,
  Square,
  Trash2,
  AudioLines,
  Wrench,
  Package,
  ClipboardPaste,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';

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
type Msg = { role: 'user' | 'assistant'; content: string; draft?: ServiceDraft | null };

const STARTERS = [
  { icon: Wrench, title: 'Serviço novo', desc: 'Um serviço que você entrega', text: 'Quero cadastrar um serviço novo.' },
  { icon: Package, title: 'Produto novo', desc: 'Algo que você vende por unidade', text: 'Quero cadastrar um produto novo.' },
  { icon: ClipboardPaste, title: 'Colar de um texto', desc: 'Cole o que você vende, eu monto', text: 'Vou colar o texto do que eu vendo, monta o serviço a partir disso.' },
  { icon: HelpCircle, title: 'Me ajuda a montar', desc: 'Não sei por onde começar', text: 'Me ajuda a montar um serviço do zero, pergunta o que precisar.' },
];

export function RaviServiceChat({ onClose }: { onClose: () => void }) {
  const addSavedService = usePlatformStore((s) => s.addSavedService);
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedNames, setSavedNames] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recSecs, setRecSecs] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasStarted = messages.length > 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }, [input]);

  // --- conversa -------------------------------------------------------------
  const push = async (text: string) => {
    const t = text.trim();
    if (!t || thinking) return;
    const next: Msg[] = [...messages, { role: 'user', content: t }];
    setMessages(next);
    setInput('');
    setThinking(true);
    setErr(null);
    try {
      const res = await fetch('/api/ravi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha.');
      setMessages((m) => [...m, { role: 'assistant', content: data.reply, draft: data.draft ?? null }]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Não consegui responder.');
    } finally {
      setThinking(false);
    }
  };

  const createService = async (draft: ServiceDraft, key: string) => {
    if (saving) return;
    setSaving(key);
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
      setSavedNames((n) => [...n, draft.name]);
      setMessages((m) => m.map((msg) => (msg.draft === draft ? { ...msg, draft: null } : msg)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(null);
    }
  };

  // --- ditado de voz (Groq Whisper) --------------------------------------
  const stopRec = () => {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    if (recRef.current?.state === 'recording') recRef.current.stop();
  };
  const toggleMic = async () => {
    if (recording) return stopRec();
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        if (secTimerRef.current) clearInterval(secTimerRef.current);
        setRecSecs(0);
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        if (blob.size < 1200) return;
        setTranscribing(true);
        try {
          const fd = new FormData();
          fd.append('audio', blob, 'fala.webm');
          const r = await fetch('/api/ravi/transcribe', { method: 'POST', body: fd });
          const d = await r.json();
          if (!r.ok) throw new Error(d?.error || 'Falha.');
          if (d.text) setInput((v) => (v ? `${v} ${d.text}` : d.text));
        } catch (e) {
          setErr(e instanceof Error ? e.message : 'Não consegui transcrever.');
        } finally {
          setTranscribing(false);
        }
      };
      rec.start();
      setRecording(true);
      setRecSecs(0);
      secTimerRef.current = setInterval(() => setRecSecs((s) => s + 1), 1000);
      stopTimerRef.current = setTimeout(stopRec, 120_000);
    } catch {
      setErr('Não consegui acessar o microfone.');
    }
  };
  const cancelRec = () => {
    chunksRef.current = [];
    stopRec();
  };
  useEffect(
    () => () => {
      stopRec();
      if (secTimerRef.current) clearInterval(secTimerRef.current);
    },
    [],
  );
  const mmss = `${String(Math.floor(recSecs / 60)).padStart(2, '0')}:${String(recSecs % 60).padStart(2, '0')}`;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-3 sm:p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full max-h-[860px] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#050505]/95 shadow-[0_20px_70px_rgba(0,0,0,0.8)] backdrop-blur-3xl"
      >
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.05] px-5 sm:px-8">
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#FF6A00]/30 bg-[#FF6A00]/10 text-[#FF6A00]">
              <Sparkles size={13} />
            </span>
            <span className="text-sm font-light tracking-wide">Ravi</span>
            <ChevronDown size={13} className="opacity-30" />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white/50 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Catálogo
            </span>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-all hover:border-white/20 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
        </header>

        {/* Conteúdo */}
        <div
          ref={scrollRef}
          className="custom-scrollbar mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-y-auto px-5 pt-6 sm:px-8"
        >
          {!hasStarted ? (
            <div className="flex flex-1 flex-col items-center justify-center pb-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-9 flex flex-col items-center"
              >
                <span className="text-4xl font-black uppercase tracking-tight text-white">
                  NE<span className="text-[#FF6A00]">X</span>
                </span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.35em] text-white/30">
                  Fechô · Ravi
                </span>
                <h2 className="mt-6 text-lg font-light tracking-tight text-zinc-300 sm:text-xl">
                  O que a gente vai cadastrar hoje?
                </h2>
              </motion.div>

              <div className="grid w-full grid-cols-2 gap-3 sm:gap-4">
                {STARTERS.map((s) => (
                  <motion.button
                    key={s.title}
                    onClick={() => push(s.text)}
                    whileHover={{ y: -3 }}
                    className="group flex h-full flex-col items-start rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4 text-left backdrop-blur-xl transition-colors hover:border-[#FF6A00]/30 hover:bg-white/[0.05] sm:p-5"
                  >
                    <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-[0.9rem] border border-white/10 bg-white/5 text-zinc-400 transition-colors group-hover:border-[#FF6A00]/30 group-hover:text-[#FF6A00]">
                      <s.icon size={17} />
                    </span>
                    <span className="text-xs font-medium leading-tight text-zinc-200 group-hover:text-white sm:text-sm">
                      {s.title}
                    </span>
                    <span className="mt-1 hidden text-[11px] font-light leading-relaxed text-zinc-500 sm:block">
                      {s.desc}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 pb-6">
              {messages.map((m, i) => (
                <Bubble key={i} role={m.role} content={m.content}>
                  {m.draft && (
                    <DraftCard
                      draft={m.draft}
                      busy={saving === `d${i}`}
                      onCreate={() => createService(m.draft!, `d${i}`)}
                    />
                  )}
                </Bubble>
              ))}
              {thinking && (
                <div className="flex items-center gap-1.5 pl-1 text-xs text-white/40">
                  <span className="inline-flex gap-1 py-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#FF6A00] [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#FF6A00] [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#FF6A00]" />
                  </span>
                </div>
              )}
              {savedNames.length > 0 && (
                <div className="flex items-center gap-2 self-start rounded-2xl border border-green-500/40 bg-green-500/10 px-3.5 py-2.5 text-sm text-green-400">
                  <Check size={15} /> {savedNames.length === 1 ? `"${savedNames[0]}" foi` : `${savedNames.length} serviços foram`} pro catálogo.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="mx-auto w-full max-w-3xl shrink-0 px-5 pb-5 pt-2 sm:px-8">
          {err && <p className="mb-2 text-center text-xs font-bold text-red-400">{err}</p>}

          <div
            className="relative w-full rounded-[1.8rem] border border-white/10 bg-[#050505]/80 backdrop-blur-3xl"
            style={{
              boxShadow:
                '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -2px 14px -2px rgba(255,106,0,0.35)',
            }}
          >
            {recording || transcribing ? (
              <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#FF6A00]/30 bg-[#FF6A00]/10 text-[#FF6A00] shadow-[0_0_18px_rgba(255,106,0,0.25)]">
                    {transcribing ? <Loader2 size={16} className="animate-spin" /> : <AudioLines size={16} />}
                  </span>
                  <span className="truncate text-sm font-light text-white">
                    {transcribing ? 'Transcrevendo…' : 'Ouvindo…'}
                  </span>
                  {!transcribing && (
                    <span className="shrink-0 font-mono text-xs tracking-widest text-[#FF6A00]">{mmss}</span>
                  )}
                </div>
                {!transcribing && (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={cancelRec}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-white"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={stopRec}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FF8000] to-[#FF4000] text-white shadow-[0_0_18px_rgba(255,106,0,0.5)]"
                    >
                      <Square size={14} className="fill-white" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col">
                <textarea
                  ref={taRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      push(input);
                    }
                  }}
                  rows={1}
                  disabled={thinking}
                  placeholder={hasStarted ? 'Escreve ou fala pro Ravi…' : 'Ex: "gestão de tráfego, mensal, R$ 1.500"'}
                  className="w-full resize-none bg-transparent px-5 pb-2 pt-4 text-[15px] font-light tracking-wide text-white outline-none placeholder:text-zinc-500 disabled:opacity-60 sm:px-7"
                  style={{ scrollbarWidth: 'none' }}
                />
                <div className="flex items-center justify-between px-4 pb-3.5 pt-1 sm:px-6">
                  <span className="flex h-9 items-center gap-2 rounded-full border border-[#FF6A00]/20 bg-[#FF6A00]/[0.04] px-3 text-[#FF6A00]">
                    <Sparkles size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Ravi</span>
                  </span>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={toggleMic}
                      disabled={thinking}
                      title="Falar"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition-all hover:border-white/20 hover:text-white active:scale-95 disabled:opacity-40"
                    >
                      <Mic size={16} />
                    </button>
                    <button
                      onClick={() => push(input)}
                      disabled={thinking || !input.trim()}
                      aria-label="Enviar"
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-[#FFA733] via-[#FF6600] to-[#CC4400] text-white shadow-[0_5px_18px_rgba(255,106,0,0.55),inset_0_2px_4px_rgba(255,255,255,0.5)] transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                    >
                      <ArrowUp size={19} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <p className="mt-2.5 text-center text-[10px] font-mono uppercase tracking-widest text-zinc-600">
            O Ravi rascunha — nada é salvo sem você confirmar.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function Bubble({
  role,
  content,
  children,
}: {
  role: 'user' | 'assistant';
  content: string;
  children?: React.ReactNode;
}) {
  const isUser = role === 'user';
  return (
    <div className={`flex w-full flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
      {content && (
        <div
          className={`max-w-[85%] rounded-3xl px-4 py-3 text-[14px] leading-relaxed ${
            isUser
              ? 'rounded-br-md border border-[#FF6A00]/30 bg-gradient-to-br from-[#FF6A00]/25 to-[#FF6A00]/10 text-white'
              : 'rounded-bl-md border border-white/10 bg-white/[0.04] text-zinc-100 backdrop-blur-xl'
          }`}
        >
          {content}
        </div>
      )}
      {children}
    </div>
  );
}

function DraftCard({
  draft,
  busy,
  onCreate,
}: {
  draft: {
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
  };
  busy: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="w-full max-w-[85%] rounded-2xl border border-[#FF6A00]/40 bg-[#FF6A00]/5 p-4">
      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#FF6A00]">Rascunho</p>
      <p className="text-base font-bold text-white">{draft.name}</p>
      <p className="mt-0.5 text-xs text-zinc-400">
        {draft.kind === 'product' ? 'Produto' : 'Serviço'} ·{' '}
        {draft.billingType === 'monthly' ? 'mensalidade' : 'valor único'} ·{' '}
        {formatBRL(toCents(draft.priceReais))} / {draft.unitLabel}
        {draft.defaultTimeline ? ` · ${draft.defaultTimeline}` : ''}
        {draft.minCommitment ? ` · fidelidade ${draft.minCommitment}` : ''}
      </p>
      {draft.description && <p className="mt-2 text-xs text-zinc-400">{draft.description}</p>}
      {draft.details.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-zinc-400">
          {draft.details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
      {draft.defaultStages.length > 0 && (
        <p className="mt-2 text-[11px] text-zinc-400">Etapas: {draft.defaultStages.join(' → ')}</p>
      )}
      <button
        onClick={onCreate}
        disabled={busy}
        className="mt-3 flex items-center gap-1.5 rounded-full bg-[#FF6A00] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[#0A0A0A] disabled:opacity-50"
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        Criar serviço
      </button>
    </div>
  );
}
