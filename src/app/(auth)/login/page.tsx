'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth-client';
import { GoogleButton } from '@/components/auth/GoogleButton';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    const { error } = await signIn.email({ email, password });
    if (error) {
      setError(error.message || 'E-mail ou senha inválidos.');
      setLoading(false);
      return;
    }
    router.push('/');
    router.refresh();
  };

  return (
    <div className="liquid-glass rounded-[2rem] p-10">
      <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--foreground)] mb-1">Entrar</h2>
      <p className="text-sm text-[var(--text-muted)] mb-8">Acesse o painel da sua empresa.</p>

      <GoogleButton label="Entrar com Google" />

      <div className="flex items-center gap-4 my-6">
        <div className="h-px flex-1 bg-[var(--border-color)]" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">ou</span>
        <div className="h-px flex-1 bg-[var(--border-color)]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-[var(--text-muted)] text-[10px] font-bold tracking-widest uppercase mb-2 block">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border-b-2 border-[var(--border-color)] text-lg text-[var(--foreground)] focus:outline-none focus:border-[#FF6A00] pb-2 transition-colors"
          />
        </div>
        <div>
          <label className="text-[var(--text-muted)] text-[10px] font-bold tracking-widest uppercase mb-2 block">Senha</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border-b-2 border-[var(--border-color)] text-lg text-[var(--foreground)] focus:outline-none focus:border-[#FF6A00] pb-2 transition-colors"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#FF6A00] text-[#0A0A0A] p-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
        Não tem conta?{' '}
        <Link href="/signup" className="text-[#FF6A00] font-bold uppercase tracking-widest">Criar conta</Link>
      </p>
    </div>
  );
}
