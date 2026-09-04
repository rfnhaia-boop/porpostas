// Forma única dos dados que os 6 templates de proposta consomem.
// Serializável — funciona tanto no preview (dados do wizard) quanto na
// página pública /p/<token> (dados do banco).

export interface QuoteViewItem {
  id: string;
  name: string;
  description: string;
  price: number; // centavos
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
  company: QuoteViewCompany;
  client: QuoteViewClient | null;
  proposalNumber: string;
  validityDays: string;
  timeline: string;
  paymentTerms: string;
  notes: string;
  items: QuoteViewItem[];
  total: number; // centavos
}

export const DEFAULT_PAYMENT_TERMS = '50% na aprovação e 50% na entrega';
