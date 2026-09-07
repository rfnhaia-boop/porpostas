'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Proposal } from '@/lib/api';
import { usePlatformStore } from '@/store/usePlatformStore';
import { buildPublicPath } from '@/lib/slug';
import { generateAccessPhrase } from '@/lib/accessPhrase';
import { buildSendMessage, buildEmailSubject } from '@/lib/proposalMessage';
import {
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Mail,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Users,
  X,
} from 'lucide-react';

export function SendProposalModal({
  proposal,
  onClose,
}: {
  proposal: Proposal;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const companyName = usePlatformStore((s) => s.companyInfo.name);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['proposals'] });

  const [phrase, setPhrase] = useState(() => proposal.accessPhrase || generateAccessPhrase());
  const [maxAccesses, setMaxAccesses] = useState(proposal.maxAccesses || 1);
  const [accessCount, setAccessCount] = useState(proposal.accessCount || 0);
  const [copied, setCopied] = useState(false);
  const editedRef = useRef(false);
  const bootstrapped = useRef(false);
  const [customMsg, setCustomMsg] = useState<string | null>(null);

  const url = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${buildPublicPath(proposal.publicToken, proposal.client?.name)}`;
  }, [proposal.publicToken, proposal.client?.name]);

  const save = useMutation({
    mutationFn: (data: { accessPhrase?: string; maxAccesses?: number }) =>
      api.proposals.update(proposal.id, data),
    onSuccess: invalidate,
  });
  const reset = useMutation({
    mutationFn: () => api.proposals.resetAccess(proposal.id),
    onSuccess: () => {
      setAccessCount(0);
      invalidate();
    },
  });

  // Abriu sem código? Salva o que já foi gerado no useState — uma vez só
  // (o ref segura o StrictMode double-invoke do dev).
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    if (!proposal.accessPhrase) save.mutate({ accessPhrase: phrase });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Texto padrão vem do modelo de WhatsApp (editável em Disparos → WhatsApp);
  // se não der, cai no texto embutido.
  const { data: waTemplates } = useQuery({
    queryKey: ['whatsappTemplates'],
    queryFn: api.whatsappTemplates.list,
  });
  const autoMsg = useMemo(() => {
    const tpl = waTemplates?.find((t) => t.key === 'wa_proposal');
    if (tpl && tpl.enabled && tpl.body.trim()) {
      const vars: Record<string, string> = {
        cliente: proposal.client?.name?.trim().split(/\s+/)[0] || 'tudo bem',
        empresa: companyName,
        proposta: proposal.title || proposal.proposalNumber,
        link: url,
        palavraAcesso: phrase,
      };
      return tpl.body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '');
    }
    return buildSendMessage({
      companyName,
      clientName: proposal.client?.name,
      url,
      phrase,
      maxAccesses,
    });
  }, [waTemplates, proposal, companyName, url, phrase, maxAccesses]);
  const message = customMsg ?? autoMsg;

  const persistPhrase = () => {
    const p = phrase.trim();
    if (p && p !== (proposal.accessPhrase || '')) save.mutate({ accessPhrase: p });
  };
  const rollNewPhrase = () => {
    const p = generateAccessPhrase();
    setPhrase(p);
    setCustomMsg(null);
    editedRef.current = false;
    save.mutate({ accessPhrase: p });
  };
  const pickSeats = (n: number) => {
    setMaxAccesses(n);
    if (!editedRef.current) setCustomMsg(null);
    save.mutate({ maxAccesses: n });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignora */
    }
  };
  const whatsapp = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  const email = () => {
    const subject = encodeURIComponent(buildEmailSubject(companyName, proposal.proposalNumber));
    window.location.href = `mailto:${proposal.client?.email ?? ''}?subject=${subject}&body=${encodeURIComponent(message)}`;
  };

  const full = accessCount >= maxAccesses;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="liquid-glass w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[#FF6A00] text-xs font-bold uppercase tracking-widest mb-1">
              {proposal.proposalNumber}
            </p>
            <h2 className="text-xl font-black uppercase tracking-tight truncate">
              {proposal.title || proposal.client?.name || 'Enviar proposta'}
            </h2>
            {proposal.title && proposal.client?.name && (
              <p className="text-xs text-[var(--text-muted)]">{proposal.client.name}</p>
            )}
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[#FF6A00] transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Link */}
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Link da proposta</p>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3">
            <p className="min-w-0 flex-1 truncate text-xs text-[var(--text-muted)]">{url}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-[var(--text-muted)] hover:text-[#FF6A00] transition-colors"
              title="Abrir"
            >
              <ExternalLink size={15} />
            </a>
          </div>
        </div>

        {/* Palavra de acesso */}
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
            <KeyRound size={12} /> Palavra de acesso
          </p>
          <div className="flex items-center gap-2">
            <input
              value={phrase}
              onChange={(e) => {
                setPhrase(e.target.value);
                if (!editedRef.current) setCustomMsg(null);
              }}
              onBlur={persistPhrase}
              placeholder="NEX-XXXX"
              className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3 py-2.5 text-sm font-bold uppercase tracking-widest outline-none focus:border-[#FF6A00]"
            />
            <button
              onClick={rollNewPhrase}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[#FF6A00] transition-colors"
              title="Gerar outra"
            >
              <RefreshCw size={13} /> Gerar
            </button>
          </div>
        </div>

        {/* Vagas */}
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
            <Users size={12} /> Quantas pessoas podem abrir
          </p>
          <div className="flex gap-2">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => pickSeats(n)}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-black transition-colors ${
                  maxAccesses === n
                    ? 'border-[#FF6A00] bg-[#FF6A00] text-white'
                    : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[#FF6A00]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className={full ? 'font-bold text-red-500' : 'text-[var(--text-muted)]'}>
              Acessos usados: {accessCount} / {maxAccesses}
              {full && ' · link travado'}
            </span>
            {accessCount > 0 && (
              <button
                onClick={() => reset.mutate()}
                disabled={reset.isPending}
                className="flex items-center gap-1 font-bold uppercase tracking-widest text-[#FF6A00] hover:underline disabled:opacity-50"
              >
                <RotateCcw size={11} /> Liberar de novo
              </button>
            )}
          </div>
        </div>

        {/* Mensagem pronta */}
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Mensagem pra enviar</p>
          <textarea
            value={message}
            onChange={(e) => {
              editedRef.current = true;
              setCustomMsg(e.target.value);
            }}
            rows={7}
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3 text-sm leading-relaxed outline-none focus:border-[#FF6A00]"
          />
          {customMsg !== null && (
            <button
              onClick={() => {
                setCustomMsg(null);
                editedRef.current = false;
              }}
              className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[#FF6A00]"
            >
              Restaurar mensagem padrão
            </button>
          )}
        </div>

        {/* Ações */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={copy}
            className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-3 text-sm font-bold hover:border-[#FF6A00] transition-colors"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
          <button
            onClick={whatsapp}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-black text-[#07170c]"
          >
            <MessageCircle size={16} /> WhatsApp
          </button>
          <button
            onClick={email}
            className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-3 text-sm font-bold hover:border-[#FF6A00] transition-colors"
          >
            <Mail size={16} /> E-mail
          </button>
        </div>
      </div>
    </div>
  );
}
