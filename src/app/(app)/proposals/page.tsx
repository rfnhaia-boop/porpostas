'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Proposal } from '@/lib/api';
import { formatBRL } from '@/lib/money';
import { usePlatformStore } from '@/store/usePlatformStore';
import { motion } from 'framer-motion';
import { Check, Eye, EyeOff, FileText, Link2, Mail, MessageCircle, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

const STATUS_LABEL: Record<Proposal['status'], { text: string; className: string }> = {
  draft: { text: 'Rascunho', className: 'text-[var(--text-muted)]' },
  sent: { text: 'Enviada', className: 'text-[#FF6A00]' },
  approved: { text: 'Aprovada', className: 'text-green-500' },
  declined: { text: 'Recusada', className: 'text-red-500' },
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  return `há ${Math.floor(s / 86400)} d`;
}

function ResendRow({ proposal }: { proposal: Proposal }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/p/${proposal.publicToken}` : '';
  const client = proposal.client;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const whatsapp = () => {
    const text = encodeURIComponent(
      `Olá, ${client?.name ?? ''}! Seu orçamento ${proposal.proposalNumber} está pronto. Visualize e responda aqui: ${url}`,
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };
  const email = () => {
    const subject = encodeURIComponent(`Orçamento ${proposal.proposalNumber}`);
    const body = encodeURIComponent(`Olá, ${client?.name ?? ''}.\n\nSegue o link do seu orçamento:\n${url}`);
    window.location.href = `mailto:${client?.email ?? ''}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="mt-4 flex items-center gap-4">
      <button
        onClick={copy}
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[#FF6A00] transition-colors"
        title="Copiar link"
      >
        {copied ? <Check size={13} /> : <Link2 size={13} />}
        {copied ? 'Copiado' : 'Copiar link'}
      </button>
      <button onClick={whatsapp} className="text-[var(--text-muted)] hover:text-[#25D366] transition-colors" title="Reenviar por WhatsApp">
        <MessageCircle size={15} />
      </button>
      <button onClick={email} className="text-[var(--text-muted)] hover:text-[#FF6A00] transition-colors" title="Reenviar por e-mail">
        <Mail size={15} />
      </button>
    </div>
  );
}

export default function ProposalsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const loadProposalIntoDraft = usePlatformStore((s) => s.loadProposalIntoDraft);

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['proposals'],
    queryFn: api.proposals.list,
    refetchOnWindowFocus: true,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.proposals.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposals'] }),
  });

  const formatCurrency = formatBRL;

  const editProposal = (p: Proposal) => {
    loadProposalIntoDraft({
      id: p.id,
      publicToken: p.publicToken,
      clientId: p.clientId,
      template: p.template,
      proposalNumber: p.proposalNumber,
      validityDays: p.validityDays,
      timeline: p.timeline,
      paymentTerms: p.paymentTerms,
      notes: p.notes,
      items: p.items.map((it) => ({ name: it.name, description: it.description, price: it.price })),
    });
    router.push('/quotes/preview');
  };

  return (
    <div className="p-12 max-w-7xl mx-auto min-h-screen">
      <header className="mb-12">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Histórico de Propostas</h1>
        <p className="text-[var(--text-muted)] uppercase tracking-widest text-sm font-semibold">Propostas enviadas e arquivadas</p>
      </header>

      {isLoading ? (
        <p className="text-[var(--text-muted)] uppercase tracking-widest text-sm animate-pulse">Carregando...</p>
      ) : proposals.length === 0 ? (
        <div className="liquid-glass rounded-3xl p-16 text-center">
          <FileText size={48} className="mx-auto mb-6 text-[var(--border-color)]" />
          <p className="text-[var(--text-muted)] uppercase tracking-widest text-sm mb-6">Nenhuma proposta salva ainda.</p>
          <Link href="/quotes/new">
            <button className="bg-[#FF6A00] text-[#0A0A0A] px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all">
              Criar Nova Proposta
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proposals.map((proposal, i) => {
            const status = STATUS_LABEL[proposal.status] ?? STATUS_LABEL.draft;
            const date = new Date(proposal.createdAt).toLocaleDateString('pt-BR');
            const respondedAt = proposal.respondedAt
              ? new Date(proposal.respondedAt).toLocaleDateString('pt-BR')
              : null;
            const shareable = proposal.status !== 'draft';
            return (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="liquid-glass p-8 rounded-3xl group relative flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[#FF6A00] font-bold text-xs uppercase tracking-widest mb-1">{proposal.proposalNumber}</p>
                    <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">{date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => editProposal(proposal)}
                      className="text-[var(--text-muted)] hover:text-[#FF6A00] transition-colors"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => remove.mutate(proposal.id)}
                      className="text-[var(--text-muted)] hover:text-red-500 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-black text-2xl uppercase tracking-tighter mb-1 truncate">
                    {proposal.client?.name || 'Cliente Removido'}
                  </h3>
                  <p className="text-sm font-semibold text-[var(--text-muted)] truncate">{proposal.items.length} Serviços Incluídos</p>
                </div>

                {shareable && (
                  <p className="mb-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    {proposal.viewedAt ? (
                      <>
                        <Eye size={12} className="text-green-500" /> Visualizada {timeAgo(proposal.viewedAt)}
                      </>
                    ) : (
                      <>
                        <EyeOff size={12} /> Ainda não aberta
                      </>
                    )}
                  </p>
                )}

                {proposal.responseNote && (
                  <p className="mb-4 rounded-xl bg-[var(--panel-bg)] border border-[var(--border-color)] p-3 text-xs italic text-[var(--text-muted)]">
                    “{proposal.responseNote}”
                  </p>
                )}

                <div className="mt-auto border-t border-[var(--border-color)] pt-6">
                  <div className="flex justify-between items-end">
                    <div className="text-2xl font-black">{formatCurrency(proposal.total)}</div>
                    <div className="text-right">
                      <span className={`block text-[10px] font-bold uppercase tracking-widest ${status.className}`}>{status.text}</span>
                      {respondedAt && (
                        <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)]">em {respondedAt}</span>
                      )}
                    </div>
                  </div>
                  {shareable && <ResendRow proposal={proposal} />}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
