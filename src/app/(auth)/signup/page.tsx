'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/auth-client';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (password.length < 8) {
      setError('A senha precisa de pelo menos 8 caracteres.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await signUp.email({ name, email, password });
    if (error) {
      setError(error.message || 'Não foi possível criar a conta.');
      setLoading(false);
      return;
    }
    router.push('/');
    router.refresh();
  };

  return (
    <div className="liquid-glass rounded-[2rem] p-10">
      <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--foreground)] mb-1">Criar conta</h2>
      <p className="text-sm text-[var(--text-muted)] mb-8">Sua empresa é criada junto com o cadastro.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-[var(--text-muted)] text-[10px] font-bold tracking-widest uppercase mb-2 block">Seu nome</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent border-b-2 border-[var(--border-color)] text-lg text-[var(--foreground)] focus:outline-none focus:border-[#FF6A00] pb-2 transition-colors"
          />
        </div>
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
          <p className="mt-2 text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Mínimo 8 caracteres</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#FF6A00] text-[#0A0A0A] p-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all disabled:opacity-50"
        >
          {loading ? 'Criando...' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
        Já tem conta?{' '}
        <Link href="/login" className="text-[#FF6A00] font-bold uppercase tracking-widest">Entrar</Link>
      </p>
    </div>
  );
}
