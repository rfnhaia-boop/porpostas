import type { CommercialConfig } from './commercial';
// Forma única dos dados que os 6 templates de proposta consomem.
// Serializável — funciona tanto no preview (dados do wizard) quanto na
// página pública /p/<token> (dados do banco).

export interface QuoteViewItem {
  billingType?: string; optional?: boolean; selected?: boolean; packageId?: string;
  id: string;
  name: string;
  description: string;
  details: string[];
  unitLabel: string;
  quantity: number;
  unitPrice: number; // centavos, por unidade
  price: number; // total da linha = round(quantity * unitPrice)
}

/** "2 kg × R$ 15,00" quando faz sentido mostrar; senão "". */
export function itemUnitLine(item: QuoteViewItem, formatMoney: (c: number) => string): string {
  if (item.quantity === 1 && (item.unitLabel === 'projeto' || item.unitLabel === 'un' || !item.unitLabel)) {
    return '';
  }
  const qty = Number.isInteger(item.quantity) ? String(item.quantity) : item.quantity.toFixed(2).replace('.', ',');
  return `${qty} ${item.unitLabel} × ${formatMoney(item.unitPrice)}`;
}

export interface QuoteViewCompany {
  name: string;
  cnpj: string;
  logoUrl: string;
  email: string;
  phone: string;
}

export interface QuoteViewClient {
  name: string;
  company: string; // nome da empresa do cliente
  document: string;
  email: string;
}

export interface QuoteView {
  commercial?: CommercialConfig | null;
  company: QuoteViewCompany;
  client: QuoteViewClient | null;
  proposalNumber: string;
  validityDays: string;
  timeline: string;
  minTerm: string;
  paymentTerms: string;
  notes: string;
  items: QuoteViewItem[];
  total: number; // centavos
}

export const DEFAULT_PAYMENT_TERMS = '50% na aprovação e 50% na entrega';
