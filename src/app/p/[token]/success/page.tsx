"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { GoogleIcon } from "@/components/auth/GoogleButton";

export default function SetupClientAccount() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email e senha são obrigatórios.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/p/${token}/setup-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao configurar a conta.");

      router.push("/portal");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error && !/fetch/i.test(err.message) ? err.message : "Não deu pra conectar agora. Tenta de novo.");
      setSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6 overflow-hidden">
      
      {/* Imagens Customizadas (Claro e Escuro automático pelas vars do CSS) */}
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-300" style={{ backgroundImage: 'var(--bg-image)' }} />
      
      {/* Overlay leve para garantir legibilidade dos textos e do vidro */}
      <div className="absolute inset-0 z-0 bg-white/20 dark:bg-black/40 backdrop-blur-[2px]" />

      <div className="absolute top-6 right-6 z-20 flex flex-col items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Tema</span>
        <ThemeToggle />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md rounded-[2.5rem] border border-white/20 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.25)] dark:border-white/10"
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
        }}
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black uppercase tracking-tight text-[var(--foreground)]">Sucesso!</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Seu projeto foi iniciado. Crie sua senha de acesso ao <strong>Portal do Cliente</strong> para acompanhar cronogramas e realizar pagamentos.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 p-3 text-center text-sm font-medium text-red-500 border border-red-500/20">
            {error}
          </div>
        )}

        <a
          href={`/api/portal/auth/google?token=${token}`}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-full border border-[var(--border-color)] bg-[var(--panel-bg)]/50 p-4 text-sm font-bold text-[var(--foreground)] transition hover:border-[#FF6A00]"
        >
          <GoogleIcon />
          Continuar com Google
        </a>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-[var(--border-color)]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">ou crie uma senha</span>
          <div className="h-px flex-1 bg-[var(--border-color)]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Seu E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)]/50 p-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
              placeholder="voce@empresa.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              WhatsApp / Telefone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)]/50 p-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
              placeholder="(11) 99999-9999"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Criar Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)]/50 p-3 pr-12 text-sm text-[var(--foreground)] outline-none transition focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
                placeholder="Criar uma senha segura"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[#FF6A00] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 flex w-full items-center justify-center rounded-full bg-[#FF6A00] py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(255,106,0,0.4)] transition hover:bg-[#ff7a1a] hover:shadow-[0_0_30px_rgba(255,106,0,0.6)] disabled:opacity-50"
          >
            {saving ? "Configurando..." : "Criar Conta e Acessar o Portal"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
