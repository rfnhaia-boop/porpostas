'use client';

import React, { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Payment, type Proposal } from '@/lib/api';
import { formatBRL, toCents } from '@/lib/money';
import { AlertTriangle, CheckCircle2, Circle, FileText, Paperclip, QrCode, Star, Trash2, Upload, X } from 'lucide-react';
import { PaymentEntriesReview } from '@/components/PaymentEntriesReview';
import { resolvePix } from '@/lib/pixResolve';
import { awaitingContract } from '@/lib/contractGate';
import Link from 'next/link';

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

function ContractBox({ proposal, highlight = false }: { proposal: Proposal; highlight?: boolean }) {
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
    <div className={`liquid-glass rounded-2xl p-6 ${highlight ? 'border border-[#FF6A00]/50 shadow-[0_0_24px_rgba(255,106,0,0.15)]' : ''}`}>
      <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">
        {highlight ? 'Contrato assinado · anexe pra iniciar' : 'Contrato'}
      </h3>
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

function PixBox({ proposal }: { proposal: Proposal }) {
  const queryClient = useQueryClient();
  const { data: company } = useQuery({ queryKey: ['company'], queryFn: () => api.company.get() });
  const [override, setOverride] = useState(proposal.pixKeyOverride || '');
  const [editing, setEditing] = useState(false);

  const save = useMutation({
    mutationFn: () => api.proposals.update(proposal.id, { pixKeyOverride: override.trim() }),
    onSuccess: () => {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
  });

  const globalReady = !!company && resolvePix(company) !== null;
  const usingOverride = !!(proposal.pixKeyOverride || '').trim();

  return (
    <div className="liquid-glass rounded-2xl p-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
        <QrCode size={14} /> PIX / QR Code
      </h3>

      {!globalReady && !usingOverride ? (
        <p className="text-xs text-[var(--text-muted)]">
          Nenhum PIX configurado.{' '}
          <Link href="/settings" className="text-[#FF6A00] font-bold hover:underline">
            Configurar em Configurações
          </Link>{' '}
          — o QR aparece automático pra todos os clientes.
        </p>
      ) : (
        <p className="text-xs text-[var(--foreground)]">
          {usingOverride ? (
            <>Esta proposta usa um PIX próprio: <span className="font-bold">{proposal.pixKeyOverride}</span></>
          ) : (
            <>Usando o PIX global da empresa. O cliente vê o QR com o valor de cada mês.</>
          )}
        </p>
      )}

      {editing ? (
        <div className="mt-3 flex gap-2 items-center">
          <input
            type="text"
            value={override}
            onChange={(e) => setOverride(e.target.value)}
            placeholder="Chave PIX só desta proposta (deixe vazio p/ usar a global)"
            className="flex-1 rounded bg-[var(--background)] border border-[var(--border-color)] px-2 py-1.5 text-xs outline-none focus:border-[#FF6A00]"
          />
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="bg-[#FF6A00] text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
          >
            Salvar
          </button>
          <button
            onClick={() => {
              setOverride(proposal.pixKeyOverride || '');
              setEditing(false);
            }}
            className="text-[var(--text-muted)] hover:text-red-500 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[#FF6A00] transition-colors"
        >
          {usingOverride ? 'Editar PIX desta proposta' : 'Usar um PIX diferente nesta proposta'}
        </button>
      )}
    </div>
  );
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function ClientReviews({ proposal }: { proposal: Proposal }) {
  const reviews = proposal.reviews || [];
  if (reviews.length === 0) return null;

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  return (
    <div className="liquid-glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Avaliação mensal do cliente</h3>
        <span className="flex items-center gap-1.5 text-sm font-bold">
          <Star size={15} className="fill-[#FF6A00] text-[#FF6A00]" />
          {avg.toFixed(1)}
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            · {reviews.length} {reviews.length === 1 ? 'mês' : 'meses'}
          </span>
        </span>
      </div>
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-[var(--border-color)] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold capitalize">{monthLabel(r.month)}</span>
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
            {r.comment && <p className="mt-1.5 text-xs text-[var(--text-muted)] leading-relaxed">{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanForm({ proposalId }: { proposalId: string }) {
  const queryClient = useQueryClient();
  const [recurrence, setRecurrence] = useState<'once' | 'monthly'>('once');
  const [occurrences, setOccurrences] = useState('3');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generate = useMutation({
    mutationFn: () =>
      api.payments.generatePlan(proposalId, {
        recurrence,
        occurrences: recurrence === 'monthly' ? Number(occurrences) || 1 : 1,
        cycleAmount: toCents(amount),
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

        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
          Vencimento é sempre o fim do mês. Em quantas vezes e como pagar, o cliente
          define no portal dele, anexando um recibo por vez.
        </p>

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

function PaymentRow({ proposalId, payment, locked = false }: { proposalId: string; payment: Payment; locked?: boolean }) {
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
  const awaiting = payment.status === 'awaiting_verification';
  const due = fmtDate(payment.dueDate);
  const paidAt = fmtDate(payment.paidAt);
  const expectedDate = fmtDate(payment.expectedPaymentDate as unknown as string);

  return (
    <div className={`rounded-xl border p-4 ${paid ? 'border-green-500/40 bg-green-500/5' : awaiting ? 'border-amber-500/40 bg-amber-500/5' : 'border-[var(--border-color)]'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="w-full">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold">{payment.label}</p>
            {awaiting && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-widest">Aguardando Aprovação</span>}
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            {formatBRL(payment.amount)}
            {due && ` · vence ${due}`}
            {paid && paidAt && ` · pago em ${paidAt}`}
          </p>
          {expectedDate && !paid && (
            <p className="text-xs font-bold text-[#FF6A00] mt-1">Previsão do cliente: {expectedDate}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
          <button
            onClick={() => remove.mutate()}
            disabled={paid || locked}
            className="text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-30 disabled:hover:text-[var(--text-muted)]"
            title={locked ? 'Cobrança vinculada ao aceite' : paid ? 'Não dá pra apagar parcela paga' : 'Apagar parcela'}
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
      </div>
      <PaymentEntriesReview proposalId={proposalId} payment={payment} />
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
        {!hasPaid && !proposal.commercial && (
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
          <PaymentRow key={payment.id} proposalId={proposal.id} payment={payment} locked={!!proposal.commercial} />
        ))}
      </div>
    </div>
  );
}

export default function ExecutionModal({ proposal, onClose }: { proposal: Proposal; onClose: () => void }) {
  const queryClient = useQueryClient();
  const gated = awaitingContract(proposal);
  const setStatus = useMutation({
    mutationFn: (status: 'in_progress' | 'delivered') =>
      api.proposals.update(proposal.id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposals'] }),
  });

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="liquid-glass w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-8"
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

        {gated && (
          <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500">Aguardando contrato assinado</p>
            <p className="mt-1 text-sm text-[var(--foreground)]">
              O cliente já aceitou. A execução e os prazos começam quando você anexar o contrato
              assinado aqui embaixo.
            </p>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {proposal.status === 'approved' && !gated && (
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
          {gated && <ContractBox proposal={proposal} highlight />}
          {proposal.clientId && <PunctualityBanner clientId={proposal.clientId} />}
          <ClientReviews proposal={proposal} />
          <PixBox proposal={proposal} />
          {!gated && <ContractBox proposal={proposal} />}
          {proposal.payments.length === 0 ? (
            proposal.commercial ? <p className="text-sm text-[var(--text-muted)]">As cobranças serão geradas a partir das condições comerciais no aceite.</p> : <PlanForm proposalId={proposal.id} />
          ) : (
            <PaymentsList proposal={proposal} />
          )}
        </div>
      </div>
    </div>
  );
}
