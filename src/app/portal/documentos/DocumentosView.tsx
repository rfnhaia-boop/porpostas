"use client";

import { motion } from "framer-motion";
import { FileText, FileCheck2, ExternalLink, Package } from "lucide-react";

export function DocumentosView({ docs }: { docs: any[] }) {
  if (docs.length === 0) {
    return (
      <div className="w-full rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-3xl p-10 text-center shadow-2xl">
        <p className="text-white/60 font-bold uppercase tracking-widest">Nenhum documento disponível.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {docs.map((d, i) => (
        <motion.div
          key={d.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          className="rounded-[2rem] border border-white/10 p-6 md:p-8"
          style={{
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(30px) saturate(180%)",
            WebkitBackdropFilter: "blur(30px) saturate(180%)",
          }}
        >
          <div className="mb-5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6A00]">
              #{d.proposalNumber}
            </span>
            <h2 className="text-2xl font-black text-[var(--foreground)]">{d.title}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={`/p/${d.publicToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 hover:border-[#FF6A00] transition-colors"
            >
              <span className="flex items-center gap-3 text-sm font-bold text-[var(--foreground)]">
                <FileText size={18} className="text-[#FF6A00]" /> Proposta
              </span>
              <ExternalLink size={15} className="text-[var(--text-muted)]" />
            </a>

            {d.contractFileName ? (
              <a
                href={`/api/portal/proposals/${d.id}/contract`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 hover:border-[#FF6A00] transition-colors"
              >
                <span className="flex items-center gap-3 text-sm font-bold text-[var(--foreground)]">
                  <FileCheck2 size={18} className="text-green-500" /> Contrato
                </span>
                <ExternalLink size={15} className="text-[var(--text-muted)]" />
              </a>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-white/10 px-5 py-4 text-sm text-[var(--text-muted)]">
                <FileCheck2 size={18} /> Contrato não anexado
              </div>
            )}
          </div>

          {(d.entregas ?? []).length > 0 && (
            <div className="mt-5">
              <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                Entregas
              </p>
              <div className="space-y-2">
                {d.entregas.map((e: any, idx: number) => (
                  <a
                    key={idx}
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 hover:border-[#FF6A00] transition-colors"
                  >
                    <span className="flex min-w-0 items-center gap-3 text-sm font-bold text-[var(--foreground)]">
                      <Package size={16} className="shrink-0 text-[#FF6A00]" />
                      <span className="truncate">{e.title}</span>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] capitalize">
                        · {e.context}
                      </span>
                    </span>
                    <ExternalLink size={15} className="shrink-0 text-[var(--text-muted)]" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
