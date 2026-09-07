import { redirect } from "next/navigation";
import { loadPortalProposals } from "@/lib/portalData";
import { HistoricoView } from "./HistoricoView";

export default async function PortalHistorico() {
  const data = await loadPortalProposals();
  if (!data) redirect("/portal/login");

  // Só o que já foi quitado.
  const groups = data.proposals
    .map((p) => ({
      id: p.id,
      title: p.title || `#${p.proposalNumber}`,
      proposalNumber: p.proposalNumber,
      payments: (p.payments ?? []).filter((pay: any) => pay.status === "paid"),
    }))
    .filter((g) => g.payments.length > 0);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-[var(--foreground)] mb-2">
          Histórico
        </h1>
        <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">
          Pagamentos concluídos
        </p>
      </div>

      <HistoricoView groups={groups} />
    </div>
  );
}
