'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { RaviServiceChat, RaviChatRef, Msg } from '@/components/ravi/RaviServiceChat';
import { RaviOnboardingChat } from '@/components/ravi/RaviOnboardingChat';
import { ArrowLeft, Building2, Check, Sparkles, MessageSquarePlus, Clock, MessageSquareText, Trash2, Loader2 } from 'lucide-react';

export default function HaviPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: company } = useQuery({ queryKey: ['company'], queryFn: api.company.get });
  const { data: conversations = [] } = useQuery({
    queryKey: ['raviConversations'],
    queryFn: api.raviConversations.list,
  });
  const [onbOpen, setOnbOpen] = useState(false);

  // sessionId força o remount do chat (zera / carrega mensagens).
  const [sessionId, setSessionId] = useState(1);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [loadedMessages, setLoadedMessages] = useState<Msg[] | undefined>(undefined);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const chatRef = useRef<RaviChatRef>(null);
  const hasContext = !!company?.haviContext;

  const newChat = useCallback(() => {
    setCurrentConvId(null);
    setLoadedMessages(undefined);
    setSessionId((n) => n + 1);
  }, []);

  const openConversation = useCallback(async (id: string) => {
    if (loadingId) return;
    setLoadingId(id);
    try {
      const conv = await api.raviConversations.get(id);
      setLoadedMessages((conv.messages as Msg[]) ?? []);
      setCurrentConvId(id);
      setSessionId((n) => n + 1);
    } catch {
      /* ignora — a lista continua clicável */
    } finally {
      setLoadingId(null);
    }
  }, [loadingId]);

  const deleteConversation = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm('Apagar esta conversa do histórico?')) return;
      try {
        await api.raviConversations.remove(id);
        queryClient.invalidateQueries({ queryKey: ['raviConversations'] });
        if (id === currentConvId) newChat();
      } catch {
        /* ignora */
      }
    },
    [currentConvId, newChat, queryClient],
  );

  const onConversationChange = useCallback(
    (id: string) => {
      setCurrentConvId(id);
      queryClient.invalidateQueries({ queryKey: ['raviConversations'] });
    },
    [queryClient],
  );

  return (
    <div className="flex h-[100dvh] lg:h-screen w-full flex-row bg-[#030303]">
      {/* Background Holográfico Base */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:3rem_3rem]" />

      {/* ==== SIDEBAR INTERNA (HISTÓRICO) ==== */}
      <div className="relative z-10 hidden w-72 shrink-0 flex-col border-r border-white/5 bg-black/40 p-4 md:flex">
        <button
          onClick={newChat}
          className="group mb-6 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:border-white/20 hover:bg-white/10"
        >
          <div className="flex items-center justify-center rounded-lg bg-white/10 p-1.5 text-white transition-colors group-hover:bg-[#FF6A00]/20 group-hover:text-[#FF6A00]">
            <MessageSquarePlus size={16} />
          </div>
          <span className="font-display text-sm font-medium text-white group-hover:text-[#FF6A00]">Novo chat</span>
        </button>

        <div className="flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="mb-4 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
            <Clock size={12} />
            <span>Recentes</span>
          </div>

          <div className="flex flex-col gap-1">
            {conversations.length === 0 && (
              <p className="px-3 py-2 text-xs font-light text-white/25">Suas conversas com o Havi aparecem aqui.</p>
            )}
            {conversations.map((c) => {
              const active = c.id === currentConvId;
              return (
                <div
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    active
                      ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                      : 'text-white/60 hover:bg-white/5'
                  }`}
                >
                  {loadingId === c.id ? (
                    <Loader2 size={14} className="shrink-0 animate-spin text-white/50" />
                  ) : (
                    <MessageSquareText
                      size={14}
                      className={`shrink-0 ${active ? 'text-white/50' : 'text-white/20 group-hover:text-white/40'}`}
                    />
                  )}
                  <span className={`flex-1 truncate text-sm ${active ? 'font-medium' : 'font-light group-hover:text-white/90'}`}>
                    {c.title}
                  </span>
                  <button
                    onClick={(e) => deleteConversation(c.id, e)}
                    className="shrink-0 text-white/0 transition-colors group-hover:text-white/30 hover:!text-red-400"
                    title="Apagar"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==== ÁREA DE CHAT PRINCIPAL ==== */}
      <div className="relative z-10 flex flex-1 flex-col p-0">
        <div className="pointer-events-none absolute left-1/2 top-[10%] z-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF6A00]/10 blur-[150px]" />
        <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] z-0 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[120px]" />

        <div className="relative z-10 flex w-full items-center gap-3 px-4 pt-4 sm:px-8 sm:pt-8">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:border-white/20 hover:text-white"
            title="Voltar"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={newChat}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:border-white/20 hover:text-white md:hidden"
            title="Novo chat"
          >
            <MessageSquarePlus size={16} />
          </button>
          <button
            onClick={() => setOnbOpen(true)}
            className={`group flex flex-1 items-center justify-between gap-3 overflow-hidden rounded-full border px-6 py-3 text-left transition-all duration-500 ${
              hasContext
                ? 'border-white/5 bg-white/[0.02] text-white/50 hover:bg-white/[0.05] hover:text-white/80'
                : 'border-[#FF6A00]/30 bg-gradient-to-r from-[#FF6A00]/10 to-[#FF6A00]/5 text-white shadow-[0_0_30px_rgba(255,106,0,0.15)] hover:border-[#FF6A00]/50 hover:shadow-[0_0_40px_rgba(255,106,0,0.25)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  hasContext ? 'bg-white/5 text-cyan-400' : 'bg-[#FF6A00]/20 text-[#FF6A00] shadow-[0_0_15px_rgba(255,106,0,0.4)]'
                }`}
              >
                {hasContext ? <Check size={14} /> : <Building2 size={14} />}
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] sm:text-xs">
                {hasContext ? 'Memória da Empresa: Ativa' : 'O Havi ainda não conhece a sua empresa'}
              </span>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-colors group-hover:text-white">
              {hasContext ? (
                <span className="text-white/40">Revisar Contexto</span>
              ) : (
                <span className="flex items-center gap-1 text-[#FF6A00]">
                  <Sparkles size={12} /> Configurar HAVI
                </span>
              )}
            </span>
          </button>
        </div>

        <div className="relative z-10 mt-4 min-h-0 w-full flex-1">
          <RaviServiceChat
            ref={chatRef}
            key={sessionId}
            variant="page"
            conversationId={currentConvId}
            initialMessages={loadedMessages}
            onConversationChange={onConversationChange}
            onClose={() => router.push('/')}
          />
        </div>
      </div>

      {onbOpen && <RaviOnboardingChat onClose={() => setOnbOpen(false)} />}
    </div>
  );
}
