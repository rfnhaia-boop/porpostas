'use client';

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Payment } from '@/lib/api';
import { formatBRL } from '@/lib/money';
import { Check, X, FileText } from 'lucide-react';

const METHOD_LABEL: Record<string, string> = {
  pix: 'Pix',
  boleto: 'Boleto',
  transferencia: 'Transferência',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  outro: 'Outro',
};

function fmt(d: string | null | undefined) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

// Lista os recibos que o cliente enviou pra fechar aquele mês, pro dono conferir.
export function PaymentEntriesReview({ proposalId, payment }: { proposalId: string; payment: Payment }) {
  const queryClient = useQueryClient();
  const entries = payment.entries ?? [];

  const verify = useMutation({
    mutationFn: ({ entryId, status }: { entryId: string; status: 'verified' | 'rejected' }) =>
      api.payments.verifyEntry(proposalId, payment.id, entryId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposals'] }),
  });

  if (entries.length === 0) {
    return <p className="mt-3 text-[11px] text-[var(--text-muted)]">Nenhum recibo enviado ainda.</p>;
  }

  const registered = entries.filter((e) => e.status !== 'rejected').reduce((s, e) => s + e.amount, 0);

  return (
    <div className="mt-3 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
        Recibos do cliente · {formatBRL(registered)} de {formatBRL(payment.amount)}
      </p>
      {entries.map((entry) => {
        const verified = entry.status === 'verified';
        const rejected = entry.status === 'rejected';
        const planned = entry.status === 'planned';
        return (
          <div
            key={entry.id}
            className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs ${
              verified
                ? 'border-green-500/30 bg-green-500/5'
                : rejected
                  ? 'border-red-500/30 bg-red-500/5 opacity-70'
                  : planned
                    ? 'border-[var(--border-color)]'
                    : 'border-amber-500/30 bg-amber-500/5'
            }`}
          >
            <div className="min-w-0">
              <span className="font-bold">{formatBRL(entry.amount)}</span>{' '}
              <span className="text-[var(--text-muted)]">
                · {METHOD_LABEL[entry.method ?? 'outro'] ?? 'Outro'} · {fmt(entry.paidOn)}
                {planned && ' · sem recibo'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!planned && (
                <a
                  href={api.payments.entryReceiptUrl(proposalId, payment.id, entry.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-muted)] hover:text-[#FF6A00] transition-colors"
                  title="Ver recibo"
                >
                  <FileText size={13} />
                </a>
              )}
              {!verified && (
                <button
                  onClick={() => verify.mutate({ entryId: entry.id, status: 'verified' })}
                  disabled={verify.isPending}
                  className="text-green-500 hover:opacity-70 transition-opacity"
                  title="Conferir (bate)"
                >
                  <Check size={14} />
                </button>
              )}
              {!rejected && (
                <button
                  onClick={() => verify.mutate({ entryId: entry.id, status: 'rejected' })}
                  disabled={verify.isPending}
                  className="text-red-500 hover:opacity-70 transition-opacity"
                  title="Recusar (não bate)"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
