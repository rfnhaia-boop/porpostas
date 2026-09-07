"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LogOut, LayoutDashboard, History, FolderOpen, Star } from "lucide-react";
import { motion } from "framer-motion";

const NAV = [
  { href: "/portal", label: "Painel", icon: LayoutDashboard },
  { href: "/portal/historico", label: "Histórico", icon: History },
  { href: "/portal/documentos", label: "Documentos", icon: FolderOpen },
  { href: "/portal/avaliacao", label: "Avaliação", icon: Star },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/portal/login") {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen text-[var(--foreground)] overflow-hidden font-sans">
      
      {/* Imagens Customizadas (Claro e Escuro automático pelas vars do CSS) */}
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-500" style={{ backgroundImage: "var(--portal-bg-image)" }} />
      
      {/* Overlay leve para garantir legibilidade dos textos e do vidro */}
      <div className="fixed inset-0 z-0 bg-white/30 dark:bg-black/60 backdrop-blur-[8px]" />

      {/* Floating Header */}
      <header className="relative z-20 w-full p-4 md:p-6 flex justify-center">
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-5xl rounded-[2rem] border border-white/20 dark:border-white/10 p-4 px-6 shadow-2xl flex items-center justify-between"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(40px) saturate(200%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
          }}
        >
          <div className="flex items-center gap-6">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest text-[#FF6A00]">NEX <span className="text-[var(--foreground)] opacity-50">Portal</span></h2>
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = href === "/portal" ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${
                      active
                        ? "bg-[#FF6A00] text-white"
                        : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <ThemeToggle />
            <button
              onClick={async () => {
                await fetch("/api/portal/auth/logout", { method: "POST" });
                window.location.href = "/portal/login";
              }}
              className="flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-red-500 transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </motion.div>
      </header>

      {/* Nav mobile */}
      <nav className="md:hidden relative z-20 flex justify-center gap-2 px-4">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/portal" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border py-2.5 text-[9px] font-black uppercase tracking-widest transition-colors ${
                active
                  ? "border-[#FF6A00] bg-[#FF6A00]/10 text-[#FF6A00]"
                  : "border-white/10 bg-white/5 text-[var(--text-muted)]"
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-5xl mx-auto p-4 md:p-6 pb-24">
        {children}
      </main>
    </div>
  );
}
