'use client';

import React, { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Payment, type Proposal } from '@/lib/api';
import { formatBRL, toCents } from '@/lib/money';
import { AlertTriangle, CheckCircle2, Circle, FileText, Paperclip, Trash2, Upload, X } from 'lucide-react';

function PunctualityBanner({ clientId }: { clientId: string }) {
  const { data } = useQuery({
    queryKey: ['clientInsight', clientId],
    queryFn: () => api.clients.insight(clientId),
  });
  if (!data?.chronicLate) return null;

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex gap-3 items-start">
      <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">Cliente atrasa recorrente</p>
        <p className="text-sm text-[var(--foreground)]">{data.suggestion}</p>
      </div>
    </div>
  );
}

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('pt-BR');
}

function ContractBox({ proposal }: { proposal: Proposal }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: (file: File) => api.contracts.upload(proposal.id, file),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
    onError: (e: Error) => setError(e.message),
  });
  const remove = useMutation({
    mutationFn: () => api.contracts.remove(proposal.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposals'] }),
  });

  return (
    <div className="liquid-glass rounded-2xl p-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">Contrato</h3>
      {proposal.contractFileName ? (
        <div className="flex items-center justify-between gap-3">
          <a
            href={api.contracts.fileUrl(proposal.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-semibold hover:text-[#FF6A00] transition-colors truncate"
          >
            <FileText size={16} className="shrink-0" />
            <span className="truncate">{proposal.contractFileName}</span>
          </a>
          <button
            onClick={() => remove.mutate()}
            disabled={remove.isPending}
            className="text-[var(--text-muted)] hover:text-red-500 transition-colors shrink-0"
            title="Remover contrato"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-[var(--border-color)] rounded-xl py-4 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[#FF6A00] hover:border-[#FF6A00] transition-colors"
        >
          <Upload size={14} /> {upload.isPending ? 'Enviando...' : 'Anexar contrato (PDF)'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload.mutate(file);
          e.target.value = '';
        }}
      />
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function PlanForm({ proposalId }: { proposalId: string }) {
  const queryClient = useQueryClient();
  const [recurrence, setRecurrence] = useState<'once' | 'monthly'>('once');
  const [occurrences, setOccurrences] = useState('3');
  const [installments, setInstallments] = useState('1');
  const [amount, setAmount] = useState('');
  const [firstDueDate, setFirstDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generate = useMutation({
    mutationFn: () =>
      api.payments.generatePlan(proposalId, {
        recurrence,
        occurrences: recurrence === 'monthly' ? Number(occurrences) || 1 : 1,
        installmentsPerCycle: Number(installments) || 1,
        cycleAmount: toCents(amount),
        firstDueDate: firstDueDate || null,
      }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="liquid-glass rounded-2xl p-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">Cobrança</h3>
      <div className="space-y-4">
        <div className="flex gap-2">
          {(['once', 'monthly'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRecurrence(r)}
              className={`flex-1 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
                recurrence === r ? 'bg-[#FF6A00] text-[#0A0A0A]' : 'bg-[var(--panel-bg)] text-[var(--text-muted)]'
              }`}
            >
              {r === 'once' ? 'Pagamento único' : 'Mensal / recorrente'}
            </button>
          ))}
        </div>

        {recurrence === 'monthly' && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">
              Por quantos meses?
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={occurrences}
              onChange={(e) => setOccurrences(e.target.value)}
              className="w-full rounded-xl bg-[var(--panel-bg)] border border-[var(--border-color)] px-3 py-2 text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">
            {recurrence === 'monthly' ? 'Valor por mês (R$)' : 'Valor total (R$)'}
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl bg-[var(--panel-bg)] border border-[var(--border-color)] px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">
            Em quantas parcelas {recurrence === 'monthly' ? 'por mês' : ''}?
          </label>
          <div className="flex gap-2">
            {['1', '2', '3'].map((n) => (
              <button
                key={n}
                onClick={() => setInstallments(n)}
                className={`flex-1 py-2 rounded-full text-xs font-bold transition-colors ${
                  installments === n ? 'bg-[#FF6A00] text-[#0A0A0A]' : 'bg-[var(--panel-bg)] text-[var(--text-muted)]'
                }`}
              >
                {n}x
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">
            Primeiro vencimento (opcional)
          </label>
          <input
            type="date"
            value={firstDueDate}
            onChange={(e) => setFirstDueDate(e.target.value)}
            className="w-full rounded-xl bg-[var(--panel-bg)] border border-[var(--border-color)] px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending || !amount}
          className="w-full bg-[#FF6A00] text-[#0A0A0A] py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all disabled:opacity-50"
        >
          {generate.isPending ? 'Gerando...' : 'Gerar plano de cobrança'}
        </button>
      </div>
    </div>
  );
}

function ReceiptButton({ proposalId, payment }: { proposalId: string; payment: Payment }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useMutation({
    mutationFn: (file: File) => api.payments.uploadReceipt(proposalId, payment.id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposals'] }),
  });
  const remove = useMutation({
    mutationFn: () => api.payments.removeReceipt(proposalId, payment.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposals'] }),
  });

  if (payment.receiptFileName) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={api.payments.receiptUrl(proposalId, payment.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[#FF6A00] transition-colors"
        >
          <Paperclip size={12} /> Comprovante
        </a>
        <button onClick={() => remove.mutate()} className="text-[var(--text-muted)] hover:text-red-500 transition-colors">
          <X size={12} />
        </button>
      </div>
    );
  }
  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={upload.isPending}
        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[#FF6A00] transition-colors"
      >
        <Paperclip size={12} /> {upload.isPending ? 'Enviando...' : 'Anexar comprovante'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload.mutate(file);
          e.target.value = '';
        }}
      />
    </>
  );
}

function PaymentRow({ proposalId, payment }: { proposalId: string; payment: Payment }) {
  const queryClient = useQueryClient();
  const toggle = useMutation({
    mutationFn: () => api.payments.setStatus(proposalId, payment.id, payment.status === 'paid' ? 'pending' : 'paid'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposals'] }),
  });
  const remove = useMutation({
    mutationFn: () => api.payments.remove(proposalId, payment.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposals'] }),
  });
  const paid = payment.status === 'paid';
  const due = fmtDate(payment.dueDate);
  const paidAt = fmtDate(payment.paidAt);

  return (
    <div className={`rounded-xl border p-4 ${paid ? 'border-green-500/40 bg-green-500/5' : 'border-[var(--border-color)]'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold">{payment.label}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {formatBRL(payment.amount)}
            {due && ` · vence ${due}`}
            {paid && paidAt && ` · pago em ${paidAt}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => remove.mutate()}
            disabled={paid}
            className="text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-30 disabled:hover:text-[var(--text-muted)]"
            title={paid ? 'Não dá pra apagar parcela paga' : 'Apagar parcela'}
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => toggle.mutate()}
            disabled={toggle.isPending}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${
              paid ? 'bg-green-500 text-[#0A0A0A]' : 'bg-[var(--panel-bg)] text-[var(--text-muted)] hover:text-[#FF6A00]'
            }`}
          >
            {paid ? <CheckCircle2 size={13} /> : <Circle size={13} />}
            {paid ? 'Pago' : 'Marcar pago'}
          </button>
        </div>
      </div>
      <div className="mt-3">
        <ReceiptButton proposalId={proposalId} payment={payment} />
      </div>
    </div>
  );
}

function PaymentsList({ proposal }: { proposal: Proposal }) {
  const queryClient = useQueryClient();
  const hasPaid = proposal.payments.some((p) => p.status === 'paid');
  const clearPlan = useMutation({
    mutationFn: () => api.payments.clearPlan(proposal.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposals'] }),
  });

  return (
    <div className="liquid-glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Cobrança</h3>
        {!hasPaid && (
          <button
            onClick={() => clearPlan.mutate()}
            disabled={clearPlan.isPending}
            className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-red-500 transition-colors"
          >
            Apagar plano
          </button>
        )}
      </div>
      <div className="space-y-3">
        {proposal.payments.map((payment) => (
          <PaymentRow key={payment.id} proposalId={proposal.id} payment={payment} />
        ))}
      </div>
    </div>
  );
}

export default function ExecutionModal({ proposal, onClose }: { proposal: Proposal; onClose: () => void }) {
  const queryClient = useQueryClient();
  const setStatus = useMutation({
    mutationFn: (status: 'in_progress' | 'delivered') =>
      api.proposals.update(proposal.id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposals'] }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="liquid-glass w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[#FF6A00] font-bold text-xs uppercase tracking-widest mb-1">{proposal.proposalNumber}</p>
            <h2 className="text-2xl font-black uppercase tracking-tighter">{proposal.client?.name || 'Cliente'}</h2>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[#FF6A00] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {proposal.status === 'approved' && (
            <button
              onClick={() => setStatus.mutate('in_progress')}
              disabled={setStatus.isPending}
              className="flex-1 bg-[#FF6A00] text-[#0A0A0A] py-2.5 rounded-full font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all"
            >
              Iniciar execução
            </button>
          )}
          {proposal.status === 'in_progress' && (
            <button
              onClick={() => setStatus.mutate('delivered')}
              disabled={setStatus.isPending}
              className="flex-1 bg-green-500 text-[#0A0A0A] py-2.5 rounded-full font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all"
            >
              Marcar entregue
            </button>
          )}
          {proposal.status === 'delivered' && (
            <p className="flex-1 text-center py-2.5 text-xs font-bold uppercase tracking-widest text-green-500">
              Projeto entregue
            </p>
          )}
        </div>

        <div className="space-y-6">
          {proposal.clientId && <PunctualityBanner clientId={proposal.clientId} />}
          <ContractBox proposal={proposal} />
          {proposal.payments.length === 0 ? (
            <PlanForm proposalId={proposal.id} />
          ) : (
            <PaymentsList proposal={proposal} />
          )}
        </div>
      </div>
    </div>
  );
}
