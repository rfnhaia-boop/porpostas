'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { awaitingContract } from '@/lib/contractGate';
import { formatBRL } from '@/lib/money';
import { usePlatformStore } from '@/store/usePlatformStore';
import { buildProjectSummary } from '@/lib/projectSummary';
import { ProgressLog } from '@/components/ProgressLog';
import { ProjectBlocks } from '@/components/ProjectBlocks';
import ExecutionModal from '@/components/ExecutionModal';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Circle, Copy, FileCog, FileText, Loader2, PartyPopper } from 'lucide-react';

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  approved: { text: 'Aprovada', className: 'text-green-500 border-green-500/30 bg-green-500/10' },
  in_progress: { text: 'Em execução', className: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
  delivered: { text: 'Entregue', className: 'text-green-500 border-green-500/30 bg-green-500/10' },
};

// respondedAt / paidAt são timestamps reais — formata no fuso local (não UTC,
// senão à noite mostra o dia anterior).
function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('pt-BR') : null;
}

export default function ApprovedProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const loadProposalIntoDraft = usePlatformStore((s) => s.loadProposalIntoDraft);
  const updateQuoteDraft = usePlatformStore((s) => s.updateQuoteDraft);
  const [execOpen, setExecOpen] = useState(false);

  // Deriva da lista de propostas — assim as mutações do ExecutionModal (que
  // invalidam ['proposals']) refletem aqui na hora, sem reload.
  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['proposals'],
    queryFn: api.proposals.list,
    refetchOnWindowFocus: true,
  });
  const proposal = proposals.find((p) => p.id === id);
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: api.services.list,
  });

  const setStatus = useMutation({
    mutationFn: (status: 'in_progress' | 'delivered') => api.proposals.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposal', id] });
    },
  });

  // Clona a proposta como um rascunho novo (mesmo cliente, mesmos itens) e abre no preview.
  const cloneAsRenewal = () => {
    if (!proposal) return;
    loadProposalIntoDraft({
      id: proposal.id,
      publicToken: proposal.publicToken,
      clientId: proposal.clientId,
      template: proposal.template,
      proposalNumber: proposal.proposalNumber,
      title: proposal.title,
      validityDays: proposal.validityDays,
      timeline: proposal.timeline,
      paymentTerms: proposal.paymentTerms,
      notes: proposal.notes,
      accessPhrase: proposal.accessPhrase,
      items: proposal.items.map((it) => ({
        name: it.name,
        description: it.description,
        details: it.details ?? [],
        unitLabel: it.unitLabel ?? 'un',
        quantity: it.quantity ?? 1,
        unitPrice: it.unitPrice ?? it.price,
        billingType: it.billingType,
        optional: it.optional,
        selected: it.selected,
        packageId: it.packageId,
        order: it.order,
      })),
    });
    updateQuoteDraft({
      proposalId: null,
      publicToken: null,
      proposalNumber: `PRJ-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      title: proposal.title ? `${proposal.title} — Continuação` : '',
    });
    router.push('/quotes/preview');
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-12">
        <p className="animate-pulse text-sm uppercase tracking-widest text-[var(--text-muted)]">Carregando...</p>
      </div>
    );
  }
  if (!proposal) {
    return (
      <div className="p-6 lg:p-12">
        <p className="text-sm text-[var(--text-muted)]">Proposta não encontrada.</p>
        <Link href="/approved" className="mt-4 inline-block text-[#FF6A00] font-bold">
          ← Voltar
        </Link>
      </div>
    );
  }

  const gated = awaitingContract(proposal);
  const st = gated
    ? { text: 'Aguardando contrato', className: 'text-amber-500 border-amber-500/30 bg-amber-500/10' }
    : STATUS_LABEL[proposal.status] ?? STATUS_LABEL.approved;
  const paidTotal = proposal.payments
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + p.amount, 0);

  // Etapas padrão do catálogo pros serviços usados nesta proposta (pra "puxar").
  const itemNames = new Set(proposal.items.map((it) => it.name.trim().toLowerCase()));
  const blockSuggestions = services
    .filter(
      (svc) =>
        (svc.defaultStages?.length ?? 0) > 0 && itemNames.has(svc.name.trim().toLowerCase()),
    )
    .map((svc) => ({ serviceName: svc.name, stages: svc.defaultStages }));

  const summary = buildProjectSummary(proposal);
  const isDone = proposal.status === 'delivered';

  return (
    <div className="p-4 sm:p-6 lg:p-12 max-w-5xl mx-auto min-h-screen">
      <Link
        href="/approved"
        className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] transition-colors hover:text-[#FF6A00]"
      >
        <ArrowLeft size={14} /> Aprovados
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex flex-col gap-4 border-b border-[var(--border-color)] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[#FF6A00] text-xs font-bold uppercase tracking-widest mb-1">
              {proposal.proposalNumber}
            </p>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter">
              {proposal.title || proposal.client?.name || 'Projeto'}
            </h1>
            {proposal.client?.name && (
              <p className="mt-1 text-sm text-[var(--text-muted)]">{proposal.client.name}</p>
            )}
          </div>
          <span className={`shrink-0 rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-widest ${st.className}`}>
            {st.text}
          </span>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {proposal.status === 'approved' && !gated && (
            <button
              onClick={() => setStatus.mutate('in_progress')}
              disabled={setStatus.isPending}
              className="flex items-center gap-2 rounded-full bg-[#FF6A00] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-[#0A0A0A] transition hover:opacity-90 disabled:opacity-50"
            >
              {setStatus.isPending ? <Loader2 size={13} className="animate-spin" /> : <Circle size={13} />}
              Iniciar execução
            </button>
          )}
          {gated && (
            <button
              onClick={() => setExecOpen(true)}
              className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-[#0A0A0A] transition hover:opacity-90"
            >
              <FileText size={14} /> Anexar contrato assinado
            </button>
          )}
          {proposal.status === 'in_progress' && (
            <button
              onClick={() => setStatus.mutate('delivered')}
              disabled={setStatus.isPending}
              className="flex items-center gap-2 rounded-full bg-green-500 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-[#0A0A0A] transition hover:opacity-90 disabled:opacity-50"
            >
              {setStatus.isPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              Marcar entregue
            </button>
          )}
          <button
            onClick={() => setExecOpen(true)}
            className="flex items-center gap-2 rounded-full border border-[var(--border-color)] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-[var(--foreground)] transition hover:border-[#FF6A00]"
          >
            <FileCog size={14} /> Contrato e cobrança
          </button>
        </div>

        {gated && (
          <div className="mb-8 rounded-3xl border border-amber-500/40 bg-amber-500/[0.08] p-6 sm:p-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">
              Aguardando contrato assinado
            </h3>
            <p className="mt-2 text-sm text-[var(--foreground)]">
              {proposal.client?.name || 'O cliente'} já aceitou a proposta
              {proposal.respondedAt ? ` em ${fmtDate(proposal.respondedAt)}` : ''}. A execução, os prazos
              e o andamento só começam quando você anexar o contrato assinado.
            </p>
            <button
              onClick={() => setExecOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-[#0A0A0A] transition hover:opacity-90"
            >
              <FileText size={14} /> Anexar contrato pra iniciar
            </button>
          </div>
        )}

        {/* Pagamentos — resumo */}
        <div className="liquid-glass mb-8 rounded-3xl p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Pagamentos</h3>
            <span className="text-xs font-bold text-[var(--text-muted)]">
              Recebido: <span className="text-green-500">{formatBRL(paidTotal)}</span> / {formatBRL(proposal.total)}
            </span>
          </div>
          {proposal.payments.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              Nenhum plano de cobrança. Crie em “Contrato e cobrança”.
            </p>
          ) : (
            <div className="space-y-2">
              {proposal.payments.map((pay) => {
                const paid = pay.status === 'paid';
                const awaiting = pay.status === 'awaiting_verification';
                return (
                  <div
                    key={pay.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm"
                  >
                    <span className="font-bold">{pay.label}</span>
                    <span className="flex items-center gap-3 text-xs">
                      <span className="tabular-nums text-[var(--foreground)]">{formatBRL(pay.amount)}</span>
                      <span
                        className={`font-bold uppercase tracking-widest ${
                          paid ? 'text-green-500' : awaiting ? 'text-amber-500' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {paid ? `Pago${fmtDate(pay.paidAt) ? ` · ${fmtDate(pay.paidAt)}` : ''}` : awaiting ? 'Em análise' : 'Em aberto'}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {isDone && (
          <div className="mb-8 rounded-3xl border border-[#FF6A00]/30 bg-[#FF6A00]/[0.06] p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <PartyPopper size={18} className="text-[#FF6A00]" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Encerramento & Continuação
              </h3>
            </div>

            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Entregas', value: String(summary.deliveriesCount) },
                { label: summary.months === 1 ? 'Mês' : 'Meses', value: String(summary.months) },
                {
                  label: 'Nota média',
                  value:
                    summary.reviewAvg === null
                      ? '—'
                      : `${summary.reviewAvg.toFixed(1).replace('.', ',')} ★`,
                },
                { label: 'Recebido', value: formatBRL(summary.totalPaid) },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-[var(--border-color)] p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                    {s.label}
                  </p>
                  <p className="mt-1 text-xl font-black tabular-nums text-[var(--foreground)]">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={cloneAsRenewal}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#FF6A00] px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white transition hover:bg-[#ff7a1a]"
              >
                <Copy size={15} /> Gerar proposta de continuação
              </button>
              <Link
                href={`/approved/${id}/resumo`}
                className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-color)] px-6 py-3.5 text-xs font-black uppercase tracking-widest text-[var(--foreground)] transition hover:border-[#FF6A00]"
              >
                <FileText size={15} /> Ver / imprimir resumo
              </Link>
            </div>
          </div>
        )}

        {!gated && (
          <>
            <div className="mb-8">
              <ProjectBlocks
                proposalId={id}
                blocks={proposal.blocks ?? []}
                suggestions={blockSuggestions}
              />
            </div>

            <ProgressLog proposalId={id} updates={proposal.progressUpdates ?? []} />
          </>
        )}
      </motion.div>

      {execOpen && <ExecutionModal proposal={proposal} onClose={() => setExecOpen(false)} />}
    </div>
  );
}
