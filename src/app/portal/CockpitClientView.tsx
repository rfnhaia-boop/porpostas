"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  FileText,
  ExternalLink,
  CalendarClock,
  Plus,
  Trash2,
  Loader2,
  Upload,
  Pencil,
  Star,
  QrCode,
  PartyPopper,
  Check,
} from "lucide-react";
import { PixQRCode } from "@/components/PixQRCode";
import { buildProjectSummary } from "@/lib/projectSummary";
import { formatBRL } from "@/lib/money";

const STATUS_LABEL: Record<string, string> = {
  approved: "Aprovado",
  in_progress: "Em Execução",
  delivered: "Entregue",
};

const METHODS: { value: string; label: string }[] = [
  { value: "pix", label: "Pix" },
  { value: "boleto", label: "Boleto" },
  { value: "transferencia", label: "Transferência" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão" },
  { value: "outro", label: "Outro" },
];
const METHOD_LABEL = Object.fromEntries(METHODS.map((m) => [m.value, m.label]));
const MAX_PER_MONTH = 4;

// Datas "puras" guardadas como meia-noite UTC — formatar em UTC pra não voltar um dia.
function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return "A definir";
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}
function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function today(): string {
  return new Date().toISOString().split("T")[0];
}
function parseCents(v: string): number {
  return Math.round(Number(v.replace(/\./g, "").replace(",", ".")) * 100);
}
function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
// Mês da avaliação = mês do vencimento da cobrança (guardado meia-noite UTC).
function reviewMonthOf(payment: any): string {
  if (payment?.dueDate) return new Date(payment.dueDate).toISOString().slice(0, 7);
  return new Date().toISOString().slice(0, 7);
}
function monthLabelLong(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default function CockpitClientView({ proposals }: { proposals: any[] }) {
  const [selected, setSelected] = useState(0);

  if (proposals.length === 0) {
    return (
      <div className="w-full rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-3xl p-10 text-center shadow-2xl">
        <p className="text-white/60 font-bold uppercase tracking-widest">Nenhum projeto ativo no momento.</p>
      </div>
    );
  }

  const proposal = proposals[Math.min(selected, proposals.length - 1)];

  return (
    <div className="space-y-8 w-full">
      {proposals.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {proposals.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setSelected(i)}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all ${
                i === selected
                  ? "bg-[#FF6A00] text-white border-[#FF6A00] shadow-[0_0_20px_rgba(255,106,0,0.3)]"
                  : "bg-white/5 text-[var(--text-muted)] border-white/10 hover:bg-white/10"
              }`}
            >
              {p.title || `#${p.proposalNumber}`}
            </button>
          ))}
        </div>
      )}

      <ProjectCockpit key={proposal.id} proposal={proposal} />
    </div>
  );
}

function ProjectCockpit({ proposal }: { proposal: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-[2.5rem] border border-white/10 dark:border-white/5 p-6 md:p-10 shadow-2xl overflow-hidden relative"
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(40px) saturate(200%)",
        WebkitBackdropFilter: "blur(40px) saturate(200%)",
      }}
    >
      {proposal.status === "delivered" && <ProjectDoneCard proposal={proposal} />}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-10 border-b border-white/10">
        <div>
          <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#FF6A00] mb-2 block">
            {proposal.title ? `Proposta · #${proposal.proposalNumber}` : "Cockpit do Projeto"}
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--foreground)]">
            {proposal.title || `#${proposal.proposalNumber}`}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-2 font-medium max-w-md">
            {proposal.notes || "Acompanhamento do seu contrato e cronograma de pagamentos."}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-col items-end gap-2 md:flex-row">
            <a
              href={`/p/${proposal.publicToken}`}
              target="_blank"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-bold text-xs uppercase tracking-widest text-[var(--foreground)]"
            >
              <FileText size={16} /> Ver Proposta <ExternalLink size={14} />
            </a>
            {proposal.contractFileName && (
              <a
                href={`/api/portal/proposals/${proposal.id}/contract`}
                target="_blank"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-bold text-xs uppercase tracking-widest text-[var(--foreground)]"
              >
                <FileText size={16} /> Ver Contrato <ExternalLink size={14} />
              </a>
            )}
          </div>
          <div className="px-6 py-2 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.2)]">
            {STATUS_LABEL[proposal.status] || "Ativo"} · Prazo: {proposal.timeline}
          </div>
        </div>
      </div>

      {((proposal.progressUpdates ?? []).length > 0 || (proposal.blocks ?? []).length > 0) && (
        <div className="mb-10">
          <h3 className="text-xl font-black uppercase tracking-widest text-[var(--foreground)] mb-6 flex items-center gap-3">
            <FileText size={22} /> Andamento do Projeto
          </h3>

          {(proposal.blocks ?? []).length > 0 &&
            (() => {
              const bl: any[] = proposal.blocks;
              const feito = bl.filter((b) => b.status === 'done').length;
              return (
                <div className="mb-4 rounded-3xl border border-white/10 bg-black/20 dark:bg-black/40 p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-black uppercase tracking-widest text-[var(--foreground)]">Etapas</p>
                    <span className="text-xs font-bold text-[var(--text-muted)]">
                      {feito} de {bl.length} concluídas
                    </span>
                  </div>
                  <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#FF6A00] transition-all"
                      style={{ width: `${Math.round((feito / bl.length) * 100)}%` }}
                    />
                  </div>
                  <div className="space-y-2">
                    {bl.map((b) => (
                      <div key={b.id} className="flex items-center gap-3">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            b.status === 'done'
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-white/20'
                          }`}
                        >
                          {b.status === 'done' && <CheckCircle2 size={12} />}
                        </span>
                        <span
                          className={`flex-1 text-sm font-bold ${
                            b.status === 'done'
                              ? 'text-[var(--text-muted)] line-through'
                              : 'text-[var(--foreground)]'
                          }`}
                        >
                          {b.title}
                        </span>
                        {b.link && (
                          <a
                            href={b.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-[#FF6A00] hover:underline"
                          >
                            Abrir <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          <div className="space-y-4">
            {(proposal.progressUpdates ?? []).map((u: any) => (
              <div key={u.id} className="rounded-3xl border border-white/10 bg-black/20 dark:bg-black/40 p-6">
                <p className="text-sm font-black capitalize text-[#FF6A00] mb-2">{monthLabelLong(u.month)}</p>
                {u.summary && (
                  <p className="text-sm leading-relaxed text-[var(--foreground)] whitespace-pre-wrap">{u.summary}</p>
                )}
                {(u.deliveries ?? []).length > 0 && (
                  <div className="mt-4 space-y-2">
                    {u.deliveries.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                        <span className="text-sm font-bold text-[var(--foreground)]">{d.title || 'Entrega'}</span>
                        {d.url && (
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#FF6A00] hover:underline"
                          >
                            Abrir <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-black uppercase tracking-widest text-[var(--foreground)] mb-6 flex items-center gap-3">
          <ReceiptIcon /> Cronograma Financeiro
        </h3>

        {(proposal.payments ?? []).length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Nenhuma cobrança em aberto. Os pagamentos concluídos ficam no Histórico.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {proposal.payments.map((payment: any) => {
              const rm = reviewMonthOf(payment);
              const review = (proposal.reviews ?? []).find((r: any) => r.month === rm);
              return (
                <MonthCard
                  key={payment.id}
                  payment={payment}
                  pattern={proposal.paymentPattern}
                  proposalId={proposal.id}
                  reviewMonth={rm}
                  review={review}
                />
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Card de fechamento no portal: agradecimento + resumo + "quero continuar".
function ProjectDoneCard({ proposal }: { proposal: any }) {
  const s = buildProjectSummary(proposal);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const wantContinue = async () => {
    if (busy || sent) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/portal/proposals/${proposal.id}/renew-interest`, {
        method: "POST",
      });
      if (res.ok) setSent(true);
    } finally {
      setBusy(false);
    }
  };

  const stats = [
    { label: "Entregas", value: String(s.deliveriesCount) },
    { label: s.months === 1 ? "Mês" : "Meses", value: String(s.months) },
    {
      label: "Sua nota média",
      value: s.reviewAvg === null ? "—" : s.reviewAvg.toFixed(1).replace(".", ","),
    },
    // No portal os pagamentos quitados ficam filtrados fora do Painel — usa o
    // valor da proposta, que é o "investimento" que faz sentido mostrar pro cliente.
    { label: "Investido", value: formatBRL(proposal.total || s.totalPaid) },
  ];

  return (
    <div className="mb-10 rounded-[2rem] border border-[#FF6A00]/30 bg-[#FF6A00]/[0.06] p-6 md:p-8">
      <div className="flex items-center gap-3">
        <PartyPopper size={24} className="text-[#FF6A00]" />
        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[var(--foreground)]">
          Projeto concluído
        </h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)] max-w-2xl">
        Obrigado pela parceria! Foi um prazer construir isso com você. Aqui está o resumo do que
        rolou — e se quiser dar o próximo passo, é só avisar.
      </p>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((st) => (
          <div key={st.label} className="rounded-2xl border border-white/10 bg-black/10 dark:bg-black/30 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
              {st.label}
            </p>
            <p className="mt-1 text-xl md:text-2xl font-black tabular-nums text-[var(--foreground)]">
              {st.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <a
          href={`/portal/documentos`}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-[var(--foreground)] hover:bg-white/10 transition"
        >
          <FileText size={15} /> Ver tudo que foi entregue
        </a>
        <button
          onClick={wantContinue}
          disabled={busy || sent}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#FF6A00] px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white hover:bg-[#ff7a1a] transition disabled:opacity-60"
        >
          {sent ? <Check size={15} /> : busy ? <Loader2 size={15} className="animate-spin" /> : null}
          {sent ? "Recebemos! Já te chamamos" : "Quero continuar"}
        </button>
      </div>
    </div>
  );
}

type Pattern = { amount: number; method: string }[] | null | undefined;

function MonthCard({
  payment,
  pattern,
  proposalId,
  reviewMonth,
  review,
}: {
  payment: any;
  pattern: Pattern;
  proposalId: string;
  reviewMonth: string;
  review?: any;
}) {
  const router = useRouter();
  const entries: any[] = payment.entries ?? [];
  const status: string = payment.status;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPix, setShowPix] = useState(false);

  const isPaid = status === "paid";
  const isAwaiting = status === "awaiting_verification";
  const hasEntries = entries.length > 0;
  const hasVerified = entries.some((e) => e.status === "verified");

  // "planejado" = tudo que o cliente registrou (parcelas não recusadas).
  // "pago" = só o que o dono já conferiu (verified).
  const planned = entries
    .filter((e) => e.status !== "rejected")
    .reduce((s, e) => s + e.amount, 0);
  const paidAmount = entries
    .filter((e) => e.status === "verified")
    .reduce((s, e) => s + e.amount, 0);
  const missing = Math.max(0, payment.amount - paidAmount);
  const plannedMismatch = hasEntries && planned !== payment.amount;
  // Cliente terminou a parte dele: registrou parcelas que cobrem o mês inteiro.
  const clientDone = hasEntries && planned >= payment.amount;

  const refresh = () => router.refresh();

  const applyPattern = async () => {
    if (!pattern || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/portal/payments/${payment.id}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: pattern.map((p) => ({ amount: p.amount, method: p.method, paidOn: today() })),
        }),
      });
      if (res.ok) refresh();
    } finally {
      setBusy(false);
    }
  };

  const redo = async () => {
    if (busy) return;
    if (!confirm("Refazer o registro deste mês? As parcelas atuais serão apagadas.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/portal/payments/${payment.id}/entries`, { method: "DELETE" });
      if (res.ok) {
        setOpen(true);
        refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`rounded-3xl border p-6 transition-all ${
        isPaid
          ? "border-green-500/20 bg-green-500/5"
          : isAwaiting
            ? "border-amber-500/20 bg-amber-500/5"
            : "border-white/10 bg-black/20 dark:bg-black/40"
      }`}
    >
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <span
            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
              isPaid
                ? "bg-green-500/20 text-green-500 border-green-500/30"
                : isAwaiting
                  ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                  : "bg-white/5 text-[var(--foreground)] border-white/10"
            }`}
          >
            {isPaid ? "Quitado" : isAwaiting ? "Em Análise" : "Aberto"}
          </span>
          <h4 className="text-2xl font-black text-[var(--foreground)] mt-2">{payment.label}</h4>
          <p className={`text-xl font-black mt-1 ${isPaid ? "text-green-500" : "text-[#FF6A00]"}`}>
            {brl(payment.amount)}
          </p>
          <p className="text-xs text-[var(--text-muted)] font-medium mt-2 flex items-center gap-1.5">
            <CalendarClock size={14} /> Vencimento: {fmtDate(payment.dueDate)}
          </p>
          {!isPaid && hasEntries && (
            <div className="mt-2 space-y-0.5">
              <p className="text-xs font-bold text-[var(--foreground)]">
                Pago: <span className="text-green-500">{brl(paidAmount)}</span>
                {" · "}
                Falta pagar: <span className="text-[#FF6A00]">{brl(missing)}</span>
              </p>
              {plannedMismatch && (
                <p className="text-[11px] font-bold text-red-500">
                  {planned > payment.amount
                    ? `Suas parcelas somam ${brl(planned)} — passou ${brl(planned - payment.amount)} do valor do mês.`
                    : `Suas parcelas somam ${brl(planned)} — faltam ${brl(payment.amount - planned)} pra fechar o mês.`}
                  {" Ajuste as parcelas."}
                </p>
              )}
            </div>
          )}
        </div>

        {payment.pixPayload && !isPaid && (
          <button
            onClick={() => setShowPix((v) => !v)}
            className="self-start flex items-center gap-2 rounded-xl bg-[#FF6A00]/10 border border-[#FF6A00]/30 px-4 py-2 text-xs font-black uppercase tracking-widest text-[#FF6A00] hover:bg-[#FF6A00]/20 transition"
          >
            <QrCode size={14} /> {showPix ? "Esconder PIX" : "Pagar com PIX"}
          </button>
        )}
      </div>

      {payment.pixPayload && !isPaid && showPix && (
        <div className="mt-4 rounded-2xl border border-[#FF6A00]/20 bg-[#FF6A00]/[0.04] p-5 flex flex-col items-center gap-2">
          <p className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            Escaneie ou copie — valor de {brl(payment.amount)} já incluso
          </p>
          <PixQRCode payload={payment.pixPayload} size={190} />
        </div>
      )}

      {entries.length > 0 && (
        <div className="mt-5 space-y-2">
          {entries.map((entry) => (
            <EntryRow key={entry.id} paymentId={payment.id} entry={entry} onChanged={refresh} />
          ))}
        </div>
      )}

      {isPaid ? (
        <div className="mt-5 flex items-center justify-center gap-2 text-green-500 py-4 rounded-2xl bg-green-500/10 border border-green-500/20">
          <CheckCircle2 size={22} />
          <span className="font-black uppercase tracking-widest text-xs">Pagamento Confirmado</span>
        </div>
      ) : open ? (
        <RegisterPaymentFlow
          paymentId={payment.id}
          monthAmount={payment.amount}
          remaining={payment.amount}
          onDone={() => {
            setOpen(false);
            refresh();
          }}
          onCancel={() => setOpen(false)}
        />
      ) : hasEntries ? (
        !hasVerified && (
          <button
            onClick={redo}
            disabled={busy}
            className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl border border-white/10 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--foreground)] transition disabled:opacity-50"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : null}
            Refazer registro
          </button>
        )
      ) : (
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          {pattern && pattern.length > 0 && (
            <button
              onClick={applyPattern}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-[#FF6A00]/40 bg-[#FF6A00]/10 py-3.5 text-xs font-black uppercase tracking-widest text-[#FF6A00] hover:bg-[#FF6A00]/20 transition disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : null}
              Usar meu padrão ({pattern.length}x)
            </button>
          )}
          <button
            onClick={() => setOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#FF6A00] py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_15px_rgba(255,106,0,0.3)] hover:bg-[#ff7a1a] transition"
          >
            <Plus size={16} /> Registrar pagamento
          </button>
        </div>
      )}

      {(clientDone || review) && (
        <MonthReviewBlock proposalId={proposalId} month={reviewMonth} existing={review} />
      )}
    </div>
  );
}

// Assim que o cliente fecha o pagamento do mês, ele avalia o serviço daquele mês aqui mesmo.
function MonthReviewBlock({
  proposalId,
  month,
  existing,
}: {
  proposalId: string;
  month: string;
  existing?: { rating: number; comment: string };
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(!existing);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (saving) return;
    if (rating < 1) {
      setError("Escolha uma nota de 1 a 5.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/proposals/${proposalId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, rating, comment }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao enviar a avaliação.");
      setEditing(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!editing && existing) {
    return (
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            Sua avaliação de {monthLabelLong(month)}
          </p>
          <span className="mt-1 flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={15}
                className={n <= (existing.rating ?? 0) ? "fill-[#FF6A00] text-[#FF6A00]" : "text-white/20"}
              />
            ))}
          </span>
          {existing.comment && (
            <p className="mt-1.5 text-xs text-[var(--text-muted)] max-w-md">{existing.comment}</p>
          )}
        </div>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--foreground)] transition"
        >
          <Pencil size={12} /> Editar
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-2xl border border-[#FF6A00]/30 bg-[#FF6A00]/5 p-5">
      <p className="text-sm font-black text-[var(--foreground)]">
        Pagamento de {monthLabelLong(month)} fechado 🎉
      </p>
      <p className="mb-4 mt-1 text-xs text-[var(--text-muted)]">
        Como foi o serviço neste mês? Sua avaliação ajuda a gente a melhorar.
      </p>
      <div className="mb-4 flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={28}
              className={n <= (hover || rating) ? "fill-[#FF6A00] text-[#FF6A00]" : "text-white/20"}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="O que você gostou? O que pode melhorar?"
        className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[#FF6A00]"
      />
      {error && <p className="mt-2 text-xs font-bold text-red-500">{error}</p>}
      <div className="mt-3 flex gap-3">
        {existing && (
          <button
            onClick={() => setEditing(false)}
            className="flex-1 rounded-xl border border-white/10 py-3 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] transition hover:bg-white/5"
          >
            Cancelar
          </button>
        )}
        <button
          onClick={submit}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#FF6A00] py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-[#ff7a1a] disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          {saving ? "Enviando..." : existing ? "Atualizar avaliação" : "Enviar avaliação"}
        </button>
      </div>
    </div>
  );
}

function EntryRow({
  paymentId,
  entry,
  onChanged,
}: {
  paymentId: string;
  entry: any;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(centsToInput(entry.amount));
  const [method, setMethod] = useState(entry.method || "pix");
  const [paidOn, setPaidOn] = useState(
    entry.paidOn ? new Date(entry.paidOn).toISOString().split("T")[0] : today(),
  );

  const planned = entry.status === "planned";
  const verified = entry.status === "verified";
  const rejected = entry.status === "rejected";
  const awaiting = entry.status === "awaiting_verification";

  const call = async (init: RequestInit, url = `/api/portal/payments/${paymentId}/entries/${entry.id}`) => {
    if (busy) return false;
    setBusy(true);
    try {
      const res = await fetch(url, init);
      if (res.ok) onChanged();
      return res.ok;
    } finally {
      setBusy(false);
    }
  };

  const remove = () => call({ method: "DELETE" });

  const attach = (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return call({ method: "POST", body: fd }, `/api/portal/payments/${paymentId}/entries/${entry.id}/receipt`);
  };

  const saveEdit = async () => {
    const cents = parseCents(amount);
    if (!Number.isFinite(cents) || cents <= 0) return;
    const ok = await call({
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: cents, method, paidOn }),
    });
    if (ok) setEditing(false);
  };

  const chip = verified
    ? { label: "Confirmado", cls: "text-green-500", box: "border-green-500/30 bg-green-500/5" }
    : rejected
      ? { label: "Recusado", cls: "text-red-500", box: "border-red-500/30 bg-red-500/5 opacity-70" }
      : awaiting
        ? { label: "Em análise", cls: "text-amber-500", box: "border-amber-500/30 bg-amber-500/5" }
        : { label: "Planejado", cls: "text-[var(--text-muted)]", box: "border-white/10 bg-white/[0.02]" };

  if (editing) {
    return (
      <div className={`rounded-xl border px-4 py-3 ${chip.box}`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-lg bg-white/5 border border-white/10 p-2 text-sm text-[var(--foreground)] outline-none focus:border-[#FF6A00]"
          />
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="rounded-lg bg-white/5 border border-white/10 p-2 text-sm text-[var(--foreground)] outline-none focus:border-[#FF6A00]"
          >
            {METHODS.map((m) => (
              <option key={m.value} value={m.value} className="bg-[#1a1a1a]">
                {m.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={paidOn}
            onChange={(e) => setPaidOn(e.target.value)}
            className="rounded-lg bg-white/5 border border-white/10 p-2 text-sm text-[var(--foreground)] outline-none focus:border-[#FF6A00]"
          />
        </div>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => setEditing(false)}
            className="flex-1 rounded-lg border border-white/10 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:bg-white/5 transition"
          >
            Cancelar
          </button>
          <button
            onClick={saveEdit}
            disabled={busy}
            className="flex-1 rounded-lg bg-[#FF6A00] py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#ff7a1a] transition disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${chip.box}`}>
      <div className="min-w-0">
        <span className="font-black text-[var(--foreground)]">{brl(entry.amount)}</span>
        <span className="text-[var(--text-muted)] text-xs">
          {" "}
          · {METHOD_LABEL[entry.method] || "Outro"} · {fmtDate(entry.paidOn)}
        </span>
        <span className={`ml-2 text-[9px] font-black uppercase tracking-widest ${chip.cls}`}>{chip.label}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {planned ? (
          <label
            className={`flex items-center gap-1.5 rounded-lg bg-[#FF6A00] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white cursor-pointer hover:bg-[#ff7a1a] transition ${
              busy ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            Anexar comprovante
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) attach(f);
                e.target.value = "";
              }}
            />
          </label>
        ) : (
          <a
            href={`/api/portal/payments/${paymentId}/entries/${entry.id}/receipt`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-muted)] hover:text-[#FF6A00] transition-colors"
            title="Ver recibo"
          >
            <FileText size={15} />
          </a>
        )}
        {!verified && (
          <button
            onClick={() => setEditing(true)}
            className="text-[var(--text-muted)] hover:text-[#FF6A00] transition-colors"
            title="Editar"
          >
            <Pencil size={13} />
          </button>
        )}
        {!verified && (
          <button
            onClick={remove}
            disabled={busy}
            className="text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-40"
            title="Remover"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

type Row = { amount: string; method: string; paidOn: string };

function RegisterPaymentFlow({
  paymentId,
  monthAmount,
  remaining,
  onDone,
  onCancel,
}: {
  paymentId: string;
  monthAmount: number;
  remaining: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<"count" | "rows">("count");
  const [rows, setRows] = useState<Row[]>([]);
  const [saveAsPattern, setSaveAsPattern] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickCount = (n: number) => {
    const base = Math.floor(remaining / n);
    const next: Row[] = Array.from({ length: n }, (_, i) => ({
      amount: centsToInput(i === n - 1 ? remaining - base * (n - 1) : base),
      method: "pix",
      paidOn: today(),
    }));
    setRows(next);
    setStep("rows");
  };

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const total = rows.reduce((s, r) => s + (parseCents(r.amount) || 0), 0);

  const submit = async () => {
    if (saving) return;
    if (rows.some((r) => !Number.isFinite(parseCents(r.amount)) || parseCents(r.amount) <= 0)) {
      setError("Preencha o valor de cada pagamento.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/payments/${paymentId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: rows.map((r) => ({
            amount: parseCents(r.amount),
            method: r.method,
            paidOn: r.paidOn,
          })),
          saveAsPattern,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao registrar.");
      onDone();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (step === "count") {
    return (
      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 dark:bg-black/40 p-5">
        <p className="text-sm font-black text-[var(--foreground)] mb-1">
          Em quantas vezes você vai pagar este mês?
        </p>
        <p className="text-xs text-[var(--text-muted)] mb-4">Total do mês: {brl(monthAmount)}</p>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: MAX_PER_MONTH }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => pickCount(n)}
              className="rounded-xl border border-white/10 bg-white/5 py-4 text-lg font-black text-[var(--foreground)] hover:border-[#FF6A00] hover:text-[#FF6A00] transition"
            >
              {n}x
            </button>
          ))}
        </div>
        <button
          onClick={onCancel}
          className="mt-4 w-full rounded-xl border border-white/10 py-2.5 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:bg-white/5 transition"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 dark:bg-black/40 p-5 space-y-4">
      <p className="text-sm font-black text-[var(--foreground)]">
        {rows.length === 1 ? "Registre o pagamento" : `Registre os ${rows.length} pagamentos`}
      </p>

      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-white/10 p-3">
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-1">
              Valor (R$)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={row.amount}
              onChange={(e) => setRow(i, { amount: e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/10 p-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[#FF6A00]"
            />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-1">
              Forma
            </label>
            <select
              value={row.method}
              onChange={(e) => setRow(i, { method: e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/10 p-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[#FF6A00]"
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value} className="bg-[#1a1a1a]">
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-1">
              Data
            </label>
            <input
              type="date"
              value={row.paidOn}
              onChange={(e) => setRow(i, { paidOn: e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/10 p-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[#FF6A00]"
            />
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between text-xs">
        <label className="flex items-center gap-2 text-[var(--text-muted)] cursor-pointer">
          <input
            type="checkbox"
            checked={saveAsPattern}
            onChange={(e) => setSaveAsPattern(e.target.checked)}
            className="h-4 w-4 accent-[#FF6A00]"
          />
          Salvar como meu padrão de pagamento
        </label>
        <span className={`font-bold ${total === monthAmount ? "text-green-500" : "text-[var(--text-muted)]"}`}>
          Soma: {brl(total)}
        </span>
      </div>

      {error && <p className="text-xs font-bold text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={() => setStep("count")}
          className="flex-1 rounded-xl border border-white/10 py-3 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:bg-white/5 transition"
        >
          Voltar
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#FF6A00] py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-[#ff7a1a] transition disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          {saving ? "Registrando..." : "Registrar"}
        </button>
      </div>
    </div>
  );
}

function ReceiptIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 17.5v-11" />
    </svg>
  );
}
