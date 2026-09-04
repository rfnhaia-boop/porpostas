'use client';

import React, { useState } from 'react';
import { CheckCircle2, MessageSquareText, Printer, XCircle } from 'lucide-react';

type Status = 'draft' | 'sent' | 'approved' | 'declined' | 'changes_requested';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-xs font-bold text-[#14251f]"
    >
      <Printer size={15} /> Imprimir / PDF
    </button>
  );
}

export function ClientResponse({
  token,
  initialStatus,
  initialNote,
}: {
  token: string;
  initialStatus: Status;
  initialNote: string | null;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [note, setNote] = useState(initialNote ?? '');
  const [saving, setSaving] = useState<null | 'approved' | 'declined' | 'changes_requested'>(null);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  const decided = status === 'approved' || status === 'declined' || status === 'changes_requested';

  const respond = async (decision: 'approved' | 'declined' | 'changes_requested') => {
    if (saving) return;
    if (decision === 'changes_requested' && !note.trim()) {
      setError('Escreva o que precisa ser alterado antes de enviar.');
      return;
    }
    setSaving(decision);
    setError(null);
    try {
      const res = await fetch(`/api/p/${token}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, note }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Não foi possível registrar sua resposta.');
      }
      setStatus(decision);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar.');
    } finally {
      setSaving(null);
    }
  };

  const badge =
    status === 'approved'
      ? { bg: 'bg-[#d7efdf]', fg: 'text-[#17613f]', icon: <CheckCircle2 size={28} />, title: 'Orçamento aprovado' }
      : status === 'declined'
        ? { bg: 'bg-[#f3ded8]', fg: 'text-[#9f3f2c]', icon: <XCircle size={28} />, title: 'Orçamento recusado' }
        : { bg: 'bg-[#e3ebf6]', fg: 'text-[#2a4a80]', icon: <MessageSquareText size={28} />, title: 'Alteração solicitada' };

  return (
    <section className="no-print border-t-4 border-[#153c2f] bg-[#f6f4ed] px-6 py-12 text-center text-[#14251f] md:px-12 md:py-16">
      <div className="mx-auto max-w-xl">
        {decided ? (
          <div className="mb-10">
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${badge.bg} ${badge.fg}`}>
              {badge.icon}
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[.25em] text-black/45">Resposta registrada</p>
            <h2 className="mt-2 text-3xl font-black text-[#14251f]">{badge.title}</h2>
            <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-black/55">
              O responsável foi notificado. Você pode alterar sua resposta abaixo se precisar.
            </p>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#237153]">Sua resposta</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#14251f]">Como deseja seguir?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/60">
              Revise o orçamento acima e registre sua decisão. O responsável é notificado na hora.
            </p>
          </>
        )}

        <div className="mt-7 text-left">
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-[.2em] text-black/45">
            Observação / o que quer mudar
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex.: ajustar o prazo para 20 dias, tirar o item 2, dúvida sobre o pagamento…"
            className="w-full rounded-2xl border border-black/15 bg-white p-4 text-sm text-[#14251f] placeholder:text-black/35 focus:border-[#153c2f] focus:outline-none"
            rows={3}
          />
        </div>

        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

        <button
          onClick={() => respond('changes_requested')}
          disabled={!!saving}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#2a4a80]/30 bg-[#e9eff8] px-6 py-3.5 text-sm font-bold text-[#2a4a80] disabled:opacity-50"
        >
          <MessageSquareText size={18} />
          {saving === 'changes_requested' ? 'Enviando…' : 'Solicitar alteração'}
        </button>

        <label className="mt-7 flex items-center justify-center gap-2 text-xs text-black/60">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="h-4 w-4 accent-[#153c2f]"
          />
          Li e concordo com o escopo e os valores acima.
        </label>

        <div className="mt-3 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={() => respond('declined')}
            disabled={!!saving}
            className="flex items-center justify-center gap-2 rounded-2xl border border-black/20 bg-white px-8 py-4 font-bold text-[#14251f] disabled:opacity-50"
          >
            <XCircle size={19} /> {saving === 'declined' ? 'Enviando…' : 'Recusar'}
          </button>
          <button
            onClick={() => respond('approved')}
            disabled={!!saving || !agreed}
            title={!agreed ? 'Marque a confirmação acima' : undefined}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#153c2f] px-8 py-4 font-black text-white shadow-lg transition-opacity disabled:opacity-40"
          >
            <CheckCircle2 size={19} /> {saving === 'approved' ? 'Enviando…' : 'Aprovar orçamento'}
          </button>
        </div>
      </div>
    </section>
  );
}
