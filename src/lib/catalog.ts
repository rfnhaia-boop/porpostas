// Normaliza os campos de um item de catálogo (serviço/produto) vindos do request.

export function parseCatalogFields(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  if (typeof body.name === 'string') out.name = body.name.trim();
  if (typeof body.description === 'string') out.description = body.description;
  if (body.billingType === 'once' || body.billingType === 'monthly') out.billingType = body.billingType;
  if (body.kind === 'service' || body.kind === 'product') out.kind = body.kind;
  if (typeof body.unitLabel === 'string' && body.unitLabel.trim()) out.unitLabel = body.unitLabel.trim();
  if (typeof body.defaultTimeline === 'string') out.defaultTimeline = body.defaultTimeline.trim();
  if (typeof body.minCommitment === 'string') out.minCommitment = body.minCommitment.trim();
  if (body.price !== undefined) {
    const p = Number(body.price);
    out.price = Number.isFinite(p) ? Math.round(p) : 0;
  }
  if (Array.isArray(body.details)) {
    out.details = body.details
      .filter((d): d is string => typeof d === 'string')
      .map((d) => d.trim())
      .filter(Boolean)
      .slice(0, 30);
  }
  if (Array.isArray(body.defaultStages)) {
    out.defaultStages = body.defaultStages
      .filter((d): d is string => typeof d === 'string')
      .map((d) => d.trim())
      .filter(Boolean)
      .slice(0, 40);
  }
  return out;
}

type RawItem = {
  billingType?: unknown; optional?: unknown; selected?: unknown; packageId?: unknown;
  name?: unknown;
  description?: unknown;
  details?: unknown;
  unitLabel?: unknown;
  quantity?: unknown;
  unitPrice?: unknown;
};

export type NormalizedItem = {
  billingType: string; optional: boolean; selected: boolean; packageId: string; order: number;
  name: string;
  description: string;
  details: string[];
  unitLabel: string;
  quantity: number;
  unitPrice: number;
  price: number;
};

/** Normaliza os itens de uma proposta e calcula o total da linha. */
export function normalizeProposalItems(raw: unknown[]): NormalizedItem[] {
  return raw
    .filter((it): it is RawItem => typeof (it as RawItem)?.name === 'string')
    .map((it, order) => {
      const quantity = Number.isFinite(Number(it.quantity)) && Number(it.quantity) > 0 ? Number(it.quantity) : 1;
      const unitPrice = Number.isFinite(Number(it.unitPrice)) ? Math.round(Number(it.unitPrice)) : 0;
      return {
        billingType: it.billingType === 'monthly' ? 'monthly' : 'once',
        optional: it.optional === true,
        selected: it.optional === true ? it.selected === true : true,
        packageId: typeof it.packageId === 'string' ? it.packageId.slice(0, 60) : '',
        order,
        name: String(it.name),
        description: typeof it.description === 'string' ? it.description : '',
        details: Array.isArray(it.details)
          ? it.details.filter((d): d is string => typeof d === 'string').map((d) => d.trim()).filter(Boolean)
          : [],
        unitLabel: typeof it.unitLabel === 'string' && it.unitLabel.trim() ? it.unitLabel.trim() : 'un',
        quantity,
        unitPrice,
        price: Math.round(quantity * unitPrice),
      };
    });
}
