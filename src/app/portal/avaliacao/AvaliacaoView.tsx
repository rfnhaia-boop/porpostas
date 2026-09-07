"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Star, Loader2, CheckCircle2 } from "lucide-react";

type Review = { month: string; rating: number; comment: string };
type Project = { id: string; title: string; proposalNumber: string; reviews: Review[] };

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function AvaliacaoView({ projects }: { projects: Project[] }) {
  const [selected, setSelected] = useState(0);

  if (projects.length === 0) {
    return (
      <div className="w-full rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-3xl p-10 text-center shadow-2xl">
        <p className="text-white/60 font-bold uppercase tracking-widest">Nenhum projeto ativo pra avaliar.</p>
      </div>
    );
  }

  const project = projects[Math.min(selected, projects.length - 1)];

  return (
    <div className="w-full space-y-8">
      {projects.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {projects.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setSelected(i)}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all ${
                i === selected
                  ? "bg-[#FF6A00] text-white border-[#FF6A00]"
                  : "bg-white/5 text-[var(--text-muted)] border-white/10 hover:bg-white/10"
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

      <ProjectReview key={project.id} project={project} />
    </div>
  );
}

function ProjectReview({ project }: { project: Project }) {
  const router = useRouter();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const existing = project.reviews.find((r) => r.month === currentMonth);

  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (saving) return;
    if (rating < 1) {
      setError("Escolha uma nota.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/proposals/${project.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: currentMonth, rating, comment }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao enviar.");
      setDone(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const past = project.reviews.filter((r) => r.month !== currentMonth);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-white/10 p-6 md:p-8"
        style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(30px) saturate(180%)",
          WebkitBackdropFilter: "blur(30px) saturate(180%)",
        }}
      >
        <div className="mb-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6A00]">
            {monthLabel(currentMonth)}
          </span>
          <h2 className="text-2xl font-black text-[var(--foreground)]">{project.title}</h2>
        </div>

        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
          Sua nota este mês
        </p>
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={
                  n <= (hover || rating) ? "fill-[#FF6A00] text-[#FF6A00]" : "text-white/20"
                }
              />
            </button>
          ))}
        </div>

        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
          O que pode melhorar? O que você gostou?
        </p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Ex.: o suporte foi rápido, mas o relatório atrasou..."
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-[var(--foreground)] outline-none focus:border-[#FF6A00] transition"
        />

        {error && <p className="mt-3 text-xs font-bold text-red-500">{error}</p>}

        <button
          onClick={submit}
          disabled={saving}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl bg-[#FF6A00] py-3.5 text-xs font-black uppercase tracking-widest text-white hover:bg-[#ff7a1a] transition disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : done ? <CheckCircle2 size={16} /> : null}
          {saving ? "Enviando..." : done ? "Avaliação enviada" : existing ? "Atualizar avaliação" : "Enviar avaliação"}
        </button>
      </motion.div>

      {past.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            Avaliações anteriores
          </p>
          {past.map((r) => (
            <div key={r.month} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--foreground)] capitalize">
                  {monthLabel(r.month)}
                </span>
                <span className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={14}
                      className={n <= r.rating ? "fill-[#FF6A00] text-[#FF6A00]" : "text-white/20"}
                    />
                  ))}
                </span>
              </div>
              {r.comment && <p className="mt-2 text-xs text-[var(--text-muted)]">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
