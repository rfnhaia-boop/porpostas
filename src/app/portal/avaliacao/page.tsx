import { redirect } from "next/navigation";
import { loadPortalProposals } from "@/lib/portalData";
import { AvaliacaoView } from "./AvaliacaoView";

export default async function PortalAvaliacao() {
  const data = await loadPortalProposals();
  if (!data) redirect("/portal/login");

  const projects = data.proposals.map((p) => ({
    id: p.id,
    title: p.title || `#${p.proposalNumber}`,
    proposalNumber: p.proposalNumber,
    reviews: (p.reviews ?? []).map((r: any) => ({
      month: r.month,
      rating: r.rating,
      comment: r.comment,
    })),
  }));

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-[var(--foreground)] mb-2">
          Avaliação
        </h1>
        <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">
          Como está sendo o serviço este mês?
        </p>
      </div>

      <AvaliacaoView projects={projects} />
    </div>
  );
}
