'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api, type Proposal } from '@/lib/api';
import { formatBRL } from '@/lib/money';
import { PageHeader } from '@/components/layout/PageHeader';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const EXECUTABLE: Proposal['status'][] = ['approved', 'in_progress', 'delivered'];
const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  approved: { text: 'Aprovada', className: 'text-green-500' },
  in_progress: { text: 'Em execução', className: 'text-blue-400' },
  delivered: { text: 'Entregue', className: 'text-green-500' },
};

export default function ApprovedPage() {
  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['proposals'],
    queryFn: api.proposals.list,
    refetchOnWindowFocus: true,
  });

  const approved = proposals
    .filter((p) => EXECUTABLE.includes(p.status))
    .sort((a, b) => (b.respondedAt || b.createdAt).localeCompare(a.respondedAt || a.createdAt));

  return (
    <div className="p-4 sm:p-6 lg:p-12 max-w-7xl mx-auto min-h-screen">
      <PageHeader title="Aprovados" description="Projetos fechados — andamento, entregas e cobrança" />

      {isLoading ? (
        <p className="text-[var(--text-muted)] uppercase tracking-widest text-sm animate-pulse">Carregando...</p>
      ) : approved.length === 0 ? (
        <div className="liquid-glass rounded-3xl p-16 text-center">
          <CheckCircle2 size={48} className="mx-auto mb-6 text-[var(--border-color)]" />
          <p className="text-[var(--text-muted)] uppercase tracking-widest text-sm">
            Nenhuma proposta aprovada ainda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {approved.map((p, i) => {
            const st = STATUS_LABEL[p.status] ?? STATUS_LABEL.approved;
            const months = p.progressUpdates?.length ?? 0;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/approved/${p.id}`}
                  className="liquid-glass group flex h-full flex-col rounded-3xl p-6 sm:p-8 transition-colors hover:border-[#FF6A00]/40"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[#FF6A00] text-xs font-bold uppercase tracking-widest mb-1 truncate">
                        {p.proposalNumber}
                      </p>
                      <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight break-words line-clamp-2">
                        {p.title || p.client?.name || 'Projeto'}
                      </h3>
                      {p.client?.name && (
                        <p className="text-xs text-[var(--text-muted)] break-words line-clamp-1">{p.client.name}</p>
                      )}
                    </div>
                    <ArrowRight
                      size={18}
                      className="shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[#FF6A00]"
                    />
                  </div>

                  <div className="mt-auto border-t border-[var(--border-color)] pt-5">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${st.className}`}>
                      {st.text}
                    </span>
                    <p className="mt-1 text-xl sm:text-2xl font-black tabular-nums">{formatBRL(p.total)}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                      {months > 0 ? `${months} ${months === 1 ? 'mês no diário' : 'meses no diário'}` : 'Sem diário ainda'}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
