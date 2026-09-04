'use client';

import React, { useState } from 'react';
import { CheckCircle2, Printer, XCircle } from 'lucide-react';

type Status = 'draft' | 'sent' | 'approved' | 'declined';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-xs font-bold"
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
  const [saving, setSaving] = useState<null | 'approved' | 'declined'>(null);
  const [error, setError] = useState<string | null>(null);

  const responded = status === 'approved' || status === 'declined';

  const respond = async (decision: 'approved' | 'declined') => {
    if (saving) return;
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

  return (
    <section className="no-print border-t border-black/10 bg-[#f6f4ed] p-8 text-center md:p-12">
      {responded && (
        <div className="mb-8">
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
              status === 'approved' ? 'bg-[#d7efdf] text-[#17613f]' : 'bg-[#f3ded8] text-[#9f3f2c]'
            }`}
          >
            {status === 'approved' ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[.25em] text-black/40">Resposta registrada</p>
          <h2 className="mt-2 text-3xl font-black">
            {status === 'approved' ? 'Orçamento aprovado' : 'Orçamento recusado'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-black/45">
            Você pode alterar sua resposta abaixo se precisar.
          </p>
        </div>
      )}

      {!responded && (
        <>
          <p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#237153]">Sua resposta</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">Como deseja seguir?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-black/50">
            Registre sua decisão. O responsável é notificado no painel dele.
          </p>
        </>
      )}

      <div className="mx-auto mt-6 max-w-xl">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Observação (opcional) — ex: ajustar prazo, dúvida sobre um item…"
          className="w-full rounded-2xl border border-black/15 bg-white p-4 text-sm text-[#14251f] placeholder:text-black/35 focus:border-[#153c2f] focus:outline-none"
          rows={2}
        />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          onClick={() => respond('declined')}
          disabled={!!saving}
          className="flex items-center justify-center gap-2 rounded-2xl border border-black/15 px-8 py-4 font-bold disabled:opacity-50"
        >
          <XCircle size={19} /> {saving === 'declined' ? 'Enviando…' : 'Recusar orçamento'}
        </button>
        <button
          onClick={() => respond('approved')}
          disabled={!!saving}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#153c2f] px-8 py-4 font-black text-white shadow-lg disabled:opacity-50"
        >
          <CheckCircle2 size={19} /> {saving === 'approved' ? 'Enviando…' : 'Aprovar orçamento'}
        </button>
      </div>
    </section>
  );
}
