import { redirect } from "next/navigation";
import { loadPortalProposals } from "@/lib/portalData";
import { resolvePix } from "@/lib/pixResolve";
import { buildPixBrCode } from "@/lib/pixBrCode";
import CockpitClientView from "./CockpitClientView";

export default async function PortalDashboard() {
  const data = await loadPortalProposals();
  if (!data) redirect("/portal/login");

  // Painel = só os meses em aberto. O que já foi quitado vai pro Histórico.
  // Já anexa o BR Code do PIX (com o valor do mês embutido) em cada cobrança.
  const proposals = data.proposals.map((p) => {
    const pixCfg = p.company ? resolvePix(p.company, p) : null;
    return {
      ...p,
      payments: (p.payments ?? [])
        .filter((pay: any) => pay.status !== "paid")
        .map((pay: any) => ({
          ...pay,
          pixPayload: pixCfg
            ? buildPixBrCode({
                ...pixCfg,
                amountCents: pay.amount,
                txid: `${p.proposalNumber}${pay.id.slice(-6)}`,
              })
            : null,
        })),
    };
  });

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-[var(--foreground)] mb-2">
          Olá, {data.firstName}
        </h1>
        <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">
          Painel de Acompanhamento
        </p>
      </div>

      <CockpitClientView proposals={proposals} />
    </div>
  );
}
