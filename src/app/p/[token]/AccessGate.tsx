'use client';

import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';

export function AccessGate({
  token,
  company,
  clientName,
}: {
  token: string;
  company: { name: string; logoUrl: string };
  clientName: string | null;
}) {
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !phrase.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/p/${token}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const body = await res.json().catch(() => null);
      setError(body?.error || 'Não foi possível liberar o acesso.');
    } catch {
      setError('Erro de conexão. Tente de novo.');
    } finally {
      setLoading(false);
    }
  };

  const firstName = clientName?.trim().split(/\s+/)[0];

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f172a] px-4 py-12 text-white">
      <div className="w-full max-w-sm text-center">
        {company.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logoUrl} alt={company.name} className="mx-auto mb-6 h-14 object-contain" />
        ) : (
          <p className="mb-6 text-2xl font-black uppercase tracking-tight">{company.name}</p>
        )}

        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-xl">
          <KeyRound className="mx-auto mb-4 text-white/55" size={26} />
          {firstName && <p className="mb-1 text-lg font-bold">Olá, {firstName} 👋</p>}
          <p className="mb-6 text-sm leading-6 text-white/60">
            {company.name} preparou uma proposta para você. Digite a palavra-chave que recebeu para abrir.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <input
              autoFocus
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="palavra-chave"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white px-4 py-3 font-bold text-[#0f172a] transition-opacity disabled:opacity-50"
            >
              {loading ? 'Abrindo…' : 'Abrir proposta'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-[10px] uppercase tracking-[0.25em] text-white/25">Documento confidencial</p>
      </div>
    </main>
  );
}
