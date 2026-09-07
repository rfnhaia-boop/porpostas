// Resolve qual PIX vale pra uma proposta: o override da proposta (se houver)
// ou o PIX global da empresa. Devolve já pronto pra `buildPixBrCode`.

import {
  buildPixBrCode,
  detectPixKeyType,
  normalizePixKey,
  pixConfigReady,
  type PixConfig,
  type PixKeyType,
} from "./pixBrCode";

type CompanyPix = {
  pixKey?: string | null;
  pixKeyType?: string | null;
  pixReceiverName?: string | null;
  pixReceiverCity?: string | null;
  name?: string | null;
};

type ProposalPix = {
  pixKeyOverride?: string | null;
};

export function resolvePix(company: CompanyPix, proposal?: ProposalPix): PixConfig | null {
  const name = (company.pixReceiverName || company.name || "").trim();
  const city = (company.pixReceiverCity || "").trim();

  const override = (proposal?.pixKeyOverride || "").trim();
  if (override) {
    const key = normalizePixKey(override, detectPixKeyType(override));
    const cfg = { key, name, city };
    return pixConfigReady(cfg) ? cfg : null;
  }

  const type = (company.pixKeyType || "") as PixKeyType;
  const key = normalizePixKey(company.pixKey || "", type);
  const cfg = { key, name, city };
  return pixConfigReady(cfg) ? cfg : null;
}

// Atalho: BR Code de um pagamento (valor em centavos) já resolvido, ou null.
export function proposalPaymentBrCode(
  company: CompanyPix,
  proposal: ProposalPix & { proposalNumber?: string },
  opts: { amountCents?: number; txid?: string } = {},
): string | null {
  const cfg = resolvePix(company, proposal);
  if (!cfg) return null;
  return buildPixBrCode({ ...cfg, amountCents: opts.amountCents, txid: opts.txid });
}
