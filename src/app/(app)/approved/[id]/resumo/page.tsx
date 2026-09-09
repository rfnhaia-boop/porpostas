'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatBRL } from '@/lib/money';
import { usePlatformStore } from '@/store/usePlatformStore';
import { buildProjectSummary } from '@/lib/projectSummary';
import { MiniBarChart } from '@/components/charts/MiniBarChart';
import { ArrowLeft, ExternalLink, Printer, Star } from 'lucide-react';

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('pt-BR') : '—';
}

function monthLabelPt(ym: string) {
  const [y, m] = String(ym || '').split('-').map(Number);
  if (!y || !m) return ym || '';
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export default function ProjectResumoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const company = usePlatformStore((s) => s.companyInfo);

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['proposals'],
    queryFn: api.proposals.list,
  });
  const proposal = proposals.find((p) => p.id === id);

  if (isLoading) {
    return <div className="p-8"><p className="text-sm text-[var(--text-muted)] animate-pulse">Carregando...</p></div>;
  }
  if (!proposal) {
    return (
      <div className="p-8">
        <p className="text-sm text-[var(--text-muted)]">Projeto não encontrado.</p>
        <Link href="/approved" className="mt-3 inline-block font-bold text-[#FF6A00]">← Aprovados</Link>
      </div>
    );
  }

  const s = buildProjectSummary(proposal);
  const period = `${fmtDate(proposal.startedAt)} — ${fmtDate(proposal.deliveredAt)}`;

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8 print:p-0 print:max-w-none">
      {/* Barra de ações — some na impressão */}
      <div className="no-print mb-8 flex items-center justify-between">
        <Link
          href={`/approved/${id}`}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[#FF6A00] transition-colors"
        >
          <ArrowLeft size={14} /> Voltar ao projeto
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-full bg-[#FF6A00] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-[#ff7a1a] transition"
        >
          <Printer size={14} /> Imprimir / PDF
        </button>
      </div>

      <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--background)] p-6 sm:p-10 print:border-0 print:bg-white print:text-black">
        {/* Cabeçalho */}
        <div className="mb-8 border-b border-[var(--border-color)] pb-6 print:border-black/10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6A00]">
            {company.name} · Relatório de Projeto
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
            {proposal.title || `#${proposal.proposalNumber}`}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)] print:text-black/60">
            {proposal.client?.name ? `Cliente: ${proposal.client.name} · ` : ''}
            {proposal.proposalNumber} · {period}
          </p>
        </div>

        {/* Números-chave */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Entregas', value: String(s.deliveriesCount) },
            { label: s.months === 1 ? 'Mês de trabalho' : 'Meses de trabalho', value: String(s.months) },
            { label: 'Etapas concluídas', value: `${s.blocksDone}/${s.blocksTotal || '—'}` },
            { label: 'Investimento', value: formatBRL(s.totalPaid) },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl border border-[var(--border-color)] p-4 print:border-black/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] print:text-black/50">
                {k.label}
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums">{k.value}</p>
            </div>
          ))}
        </div>

        {/* Satisfação */}
        {s.reviewAvg !== null && (
          <div className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">
              Sua avaliação do serviço
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black tabular-nums">
                  {s.reviewAvg.toFixed(1).replace('.', ',')}
                </span>
                <span className="mb-1.5 text-sm font-bold text-[var(--text-muted)]">/ 5</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={22}
                    className={
                      n <= Math.round(s.reviewAvg as number)
                        ? 'fill-[#FF6A00] text-[#FF6A00]'
                        : 'text-[var(--text-muted)] opacity-30'
                    }
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                média de {s.reviewCount} {s.reviewCount === 1 ? 'avaliação' : 'avaliações'}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {s.reviews.map((r) => (
                <div key={r.month} className="rounded-xl border border-[var(--border-color)] p-3 print:border-black/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold capitalize">{r.label}</span>
                    <span className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={13}
                          className={n <= r.rating ? 'fill-[#FF6A00] text-[#FF6A00]' : 'text-[var(--text-muted)] opacity-30'}
                        />
                      ))}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="mt-1.5 text-xs text-[var(--text-muted)] print:text-black/70">“{r.comment}”</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Entregas por mês */}
        {s.deliveriesByMonth.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">
              Entregas por mês
            </h2>
            <MiniBarChart data={s.deliveriesByMonth} />
          </div>
        )}

        {/* Tudo que foi entregue */}
        {s.deliveries.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">
              Tudo que foi entregue
            </h2>
            <div className="space-y-2">
              {s.deliveries.map((d, i) => (
                <a
                  key={`${d.url}-${i}`}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] px-4 py-3 hover:border-[#FF6A00] transition-colors print:border-black/10"
                >
                  <span className="min-w-0 text-sm font-bold">
                    {d.title}
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] capitalize">
                      · {d.context}
                    </span>
                  </span>
                  <ExternalLink size={14} className="shrink-0 text-[var(--text-muted)] no-print" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Andamento mês a mês */}
        {(proposal.progressUpdates ?? []).length > 0 && (
          <div className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">
              Andamento mês a mês
            </h2>
            <div className="space-y-3">
              {(proposal.progressUpdates ?? []).map((u) => (
                <div key={u.id} className="rounded-xl border border-[var(--border-color)] p-4 print:border-black/10">
                  <p className="text-sm font-black capitalize text-[#FF6A00]">{monthLabelPt(u.month)}</p>
                  {u.summary && <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{u.summary}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fechamento */}
        <div className="mt-10 rounded-2xl border border-[#FF6A00]/30 bg-[#FF6A00]/[0.06] p-6 print:bg-transparent print:border-black/20">
          <p className="text-sm font-bold">
            Foi um prazer trabalhar com você. Todo esse resultado veio de uma parceria que funcionou —
            e dá pra ir muito além. Vamos continuar juntos?
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)] print:text-black/60">
            {company.name} · {company.email || ''} {company.phone ? `· ${company.phone}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
