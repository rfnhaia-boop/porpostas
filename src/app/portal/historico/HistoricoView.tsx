"use client";

import { motion } from "framer-motion";
import { CheckCircle2, FileText } from "lucide-react";

const METHOD_LABEL: Record<string, string> = {
  pix: "Pix",
  boleto: "Boleto",
  transferencia: "Transferência",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  outro: "Outro",
};

function fmtDate(v: string | Date | null | undefined): string {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}
function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function HistoricoView({ groups }: { groups: any[] }) {
  if (groups.length === 0) {
    return (
      <div className="w-full rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-3xl p-10 text-center shadow-2xl">
        <p className="text-white/60 font-bold uppercase tracking-widest">Nenhum pagamento concluído ainda.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {groups.map((g, gi) => {
        const total = g.payments.reduce((s: number, p: any) => s + p.amount, 0);
        return (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: gi * 0.05 }}
            className="rounded-[2rem] border border-white/10 p-6 md:p-8"
            style={{
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(30px) saturate(180%)",
              WebkitBackdropFilter: "blur(30px) saturate(180%)",
            }}
          >
            <div className="flex items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6A00]">
                  #{g.proposalNumber}
                </span>
                <h2 className="text-2xl font-black text-[var(--foreground)]">{g.title}</h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Total pago</p>
                <p className="text-xl font-black text-green-500">{brl(total)}</p>
              </div>
            </div>

            <div className="space-y-4">
              {g.payments.map((p: any) => (
                <div key={p.id} className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-[var(--foreground)]">{p.label}</h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        {brl(p.amount)} · quitado em {fmtDate(p.paidAt)}
                      </p>
                    </div>
                    <span className="flex items-center gap-1.5 text-green-500 text-[10px] font-black uppercase tracking-widest">
                      <CheckCircle2 size={16} /> Quitado
                    </span>
                  </div>

                  {(p.entries ?? []).length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {p.entries.map((e: any) => (
                        <div
                          key={e.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] border border-white/10 px-3 py-2 text-xs"
                        >
                          <span className="text-[var(--foreground)]">
                            <span className="font-bold">{brl(e.amount)}</span>
                            <span className="text-[var(--text-muted)]">
                              {" "}
                              · {METHOD_LABEL[e.method] || "Outro"} · {fmtDate(e.paidOn)}
                            </span>
                          </span>
                          {e.receiptFileName && (
                            <a
                              href={`/api/portal/payments/${p.id}/entries/${e.id}/receipt`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[var(--text-muted)] hover:text-[#FF6A00] transition-colors"
                              title="Ver recibo"
                            >
                              <FileText size={14} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
