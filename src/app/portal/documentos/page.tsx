import { redirect } from "next/navigation";
import { loadPortalProposals } from "@/lib/portalData";
import { DocumentosView } from "./DocumentosView";

function monthLabel(ym: string) {
  const [y, m] = String(ym || "").split("-").map(Number);
  if (!y || !m) return "";
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default async function PortalDocumentos() {
  const data = await loadPortalProposals();
  if (!data) redirect("/portal/login");

  const docs = data.proposals.map((p: any) => {
    // Junta tudo que virou "documento" no caminho: entregas do diário + links das etapas.
    const entregas: { title: string; url: string; context: string }[] = [];
    for (const u of p.progressUpdates ?? []) {
      for (const d of u.deliveries ?? []) {
        if (d.url) entregas.push({ title: d.title || "Entrega", url: d.url, context: monthLabel(u.month) });
      }
    }
    for (const b of p.blocks ?? []) {
      if (b.link) {
        entregas.push({
          title: b.title,
          url: b.link,
          context: b.status === "done" ? "Etapa concluída" : "Etapa",
        });
      }
    }
    return {
      id: p.id,
      title: p.title || `#${p.proposalNumber}`,
      proposalNumber: p.proposalNumber,
      publicToken: p.publicToken,
      contractFileName: p.contractFileName || null,
      entregas,
    };
  });

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-[var(--foreground)] mb-2">
          Documentos
        </h1>
        <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">
          Proposta, contrato e tudo que foi entregue
        </p>
      </div>

      <DocumentosView docs={docs} />
    </div>
  );
}
