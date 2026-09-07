"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { GoogleIcon } from "@/components/auth/GoogleButton";

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Login com Google ainda não foi configurado.",
  google_cancelled: "Login com Google cancelado.",
  google_failed: "Não foi possível entrar com o Google. Tente de novo.",
  not_found: "Nenhuma conta encontrada com esse Google. Use o link que você recebeu na proposta pra criar seu acesso.",
  invalid_proposal: "Link inválido.",
};

export default function PortalLoginPage() {
  return (
    <Suspense fallback={null}>
      <PortalLogin />
    </Suspense>
  );
}

function PortalLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("error");
    if (code) setError(GOOGLE_ERROR_MESSAGES[code] || "Não foi possível entrar.");
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao fazer login");
      router.push("/portal");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm rounded-[2.5rem] border border-white/10 p-8 shadow-2xl backdrop-blur-2xl"
        style={{
          background: "rgba(255, 255, 255, 0.05)",
        }}
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black uppercase tracking-tight text-[var(--foreground)]">Portal do Cliente</h1>
          <p className="mt-2 text-xs text-[var(--text-muted)] uppercase tracking-widest">Acesso Exclusivo</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 p-3 text-center text-sm font-medium text-red-500 border border-red-500/20">
            {error}
          </div>
        )}

        <a
          href="/api/portal/auth/google"
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-full border border-[var(--border-color)] bg-[var(--panel-bg)]/50 p-4 text-sm font-bold text-[var(--foreground)] transition hover:border-[#FF6A00]"
        >
          <GoogleIcon />
          Entrar com Google
        </a>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-[var(--border-color)]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">ou</span>
          <div className="h-px flex-1 bg-[var(--border-color)]" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)]/50 p-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
              placeholder="Seu e-mail"
            />
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)]/50 p-4 pr-12 text-sm text-[var(--foreground)] outline-none transition focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
              placeholder="Sua senha"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[#FF6A00] transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group mt-6 flex w-full items-center justify-between rounded-full bg-[#FF6A00] pl-6 pr-2 py-2 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(255,106,0,0.3)] transition hover:bg-[#ff7a1a]"
          >
            {loading ? "Entrando..." : "Entrar"}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 transition group-hover:bg-white/30">
              <ArrowRight size={18} />
            </div>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
