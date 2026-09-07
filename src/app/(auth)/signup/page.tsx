'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/auth-client';
import { GoogleButton } from '@/components/auth/GoogleButton';

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
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await signUp.email({ email, password, name });
    if (error) {
      setError(error.message || 'Ocorreu um erro ao criar a conta.');
      setLoading(false);
      return;
    }
    router.push('/');
    router.refresh();
  };

  return (
    <div className="w-full">
      <h2 className="font-display text-3xl font-light tracking-tight text-white mb-2">Criar Conta</h2>
      <p className="text-sm font-medium text-white/50 mb-10">Configure o ambiente da sua empresa.</p>

      <GoogleButton label="Cadastrar com Google" />

      <div className="flex items-center gap-4 my-8">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[9px] font-black uppercase tracking-[.4em] text-white/30">ou</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <label className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-[.3em] text-white/50">Nome Completo</span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full bg-transparent border-0 border-b-2 border-white/10 px-0 py-2 text-xl font-light text-white placeholder:text-white/20 focus:border-[#FF6A00] focus:ring-0 transition-all "
          />
        </label>
        
        <label className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-[.3em] text-white/50">E-mail Corporativo</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full bg-transparent border-0 border-b-2 border-white/10 px-0 py-2 text-xl font-light text-white placeholder:text-white/20 focus:border-[#FF6A00] focus:ring-0 transition-all "
          />
        </label>
        
        <label className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-[.3em] text-white/50">Criar Senha</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full bg-transparent border-0 border-b-2 border-white/10 px-0 py-2 text-xl font-light text-white placeholder:text-white/20 focus:border-[#FF6A00] focus:ring-0 transition-all "
          />
        </label>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-10 group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#FF6A00] to-[#FF8C33] px-6 font-grotesque text-[11px] font-black uppercase tracking-[.25em] text-white transition-all disabled:opacity-50 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,106,0,0.3)]"
        >
          {loading ? 'Criando...' : 'Iniciar Operação'}
        </button>
      </form>

      <p className="mt-10 text-center text-xs font-medium text-white/50">
        Já possui conta?{' '}
        <Link href="/login" className="text-[#FF6A00] font-black uppercase tracking-widest hover:text-[#ff8c33] transition-colors">
          Entrar
        </Link>
      </p>
    </div>
  );
}

