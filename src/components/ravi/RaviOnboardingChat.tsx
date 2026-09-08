'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowUp, X, Loader2, Check, Mic, Square, Trash2, AudioLines, Building2 } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string; contextDraft?: { text: string } | null };

const FIRST: Msg = {
  role: 'assistant',
  content: 'Bora te conhecer rápido. Em poucas palavras — o que a sua empresa faz?',
};

export function RaviOnboardingChat({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved?: () => void;
}) {
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<Msg[]>([FIRST]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editText, setEditText] = useState<string | null>(null);
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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }, [input]);

  const push = async (text: string) => {
    const t = text.trim();
    if (!t || thinking) return;
    const shown: Msg[] = [...messages, { role: 'user', content: t }];
    setMessages(shown);
    setInput('');
    setThinking(true);
    setErr(null);
    try {
      const res = await fetch('/api/ravi/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: shown.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha.');
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: data.reply, contextDraft: data.contextDraft ?? null },
      ]);
      if (typeof data.contextDraft?.text === 'string') {
        setEditText((prev) => prev ?? data.contextDraft.text);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Não consegui responder.');
    } finally {
      setThinking(false);
    }
  };

  const saveContext = async () => {
    if (saving || editText === null) return;
    const ctx = editText.trim();
    if (!ctx) {
      setErr('O perfil está vazio.');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch('/api/ravi/context', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: ctx, log: JSON.stringify(messages).slice(0, 20000) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Não consegui salvar.');
      queryClient.invalidateQueries({ queryKey: ['company'] });
      setSaved(true);
      onSaved?.();
      setTimeout(onClose, 1400);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  // --- ditado de voz (mesma trilha do Havi: Groq Whisper) --------------------
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

  const hasDraft = editText !== null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full max-h-[820px] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#050505]/95 shadow-[0_20px_70px_rgba(0,0,0,0.8)] backdrop-blur-3xl"
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.05] px-5 sm:px-8">
          <div className="flex items-center gap-2 text-zinc-300">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/havi-icon.webp" alt="Havi" className="h-7 w-7 rounded-full" />
            <span className="text-sm font-light tracking-wide">Conhecer sua empresa</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white/50 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Descoberta
            </span>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-all hover:border-white/20 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="custom-scrollbar mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-y-auto px-5 pb-6 pt-6 sm:px-8"
        >
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} />
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

          {hasDraft && !saved && (
            <div className="w-full rounded-2xl border border-[#FF6A00]/40 bg-[#FF6A00]/5 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#FF6A00]">
                <Building2 size={12} /> Perfil da empresa
              </p>
              <textarea
                value={editText ?? ''}
                onChange={(e) => setEditText(e.target.value)}
                rows={7}
                className="custom-scrollbar w-full resize-y rounded-xl border border-white/10 bg-black/30 p-3 text-[13px] leading-relaxed text-zinc-100 outline-none focus:border-[#FF6A00]/40"
              />
              <p className="mt-1.5 text-[11px] text-zinc-500">
                Ajuste o que quiser. Isso entra em toda conversa com o Havi daqui pra frente.
              </p>
              <button
                onClick={saveContext}
                disabled={saving}
                className="mt-3 flex items-center gap-1.5 rounded-full bg-[#FF6A00] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[#0A0A0A] disabled:opacity-50"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Salvar contexto
              </button>
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 self-start rounded-2xl border border-green-500/40 bg-green-500/10 px-3.5 py-2.5 text-sm text-green-400">
              <Check size={15} /> Contexto salvo. O Havi já vai usar isso.
            </div>
          )}
        </div>

        <div className="mx-auto w-full max-w-2xl shrink-0 px-5 pb-5 pt-2 sm:px-8">
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
                  placeholder="Responde aqui ou fala…"
                  className="w-full resize-none bg-transparent px-5 pb-2 pt-4 text-[15px] font-light tracking-wide text-white outline-none placeholder:text-zinc-500 disabled:opacity-60 sm:px-7"
                  style={{ scrollbarWidth: 'none' }}
                />
                <div className="flex items-center justify-between px-4 pb-3.5 pt-1 sm:px-6">
                  <span className="flex h-9 items-center gap-2 rounded-full border border-[#FF6A00]/20 bg-[#FF6A00]/[0.04] pl-1 pr-3 text-[#FF6A00]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/havi-icon.webp" alt="" className="h-7 w-7 rounded-full" />
                    <span className="hidden text-[10px] font-black uppercase tracking-widest sm:inline">Havi</span>
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
            Conversa rápida — nada é salvo sem você confirmar.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function Bubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user';
  return (
    <div className={`flex w-full flex-col ${isUser ? 'items-end' : 'items-start'}`}>
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
    </div>
  );
}
