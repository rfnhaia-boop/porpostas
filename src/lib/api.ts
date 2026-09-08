import type { CommercialConfig, BillingType } from './commercial';
// Cliente HTTP tipado para o front. Toda a persistência passa por aqui.

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  logoUrl: string;
  email: string;
  phone: string;
  pixKey: string;
  pixKeyType: '' | 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  pixReceiverName: string;
  pixReceiverCity: string;
  emailVerified: boolean;
  haviContext: string;
  haviContextAt: string | null;
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  orgName: string;
  document: string;
  email: string;
  createdAt: string;
}

export interface ClientPunctuality {
  chronicLate: boolean;
  consecutiveLate: number;
  avgDelayDays: number | null;
  lastDelays: { dueDate: string; delayDays: number }[];
  suggestion: string | null;
}

export type CatalogKind = 'service' | 'product';

export interface Service {
  billingType?: BillingType;
  id: string;
  companyId: string;
  name: string;
  description: string;
  kind: CatalogKind;
  unitLabel: string;
  price: number; // centavos, por unidade
  details: string[];
  defaultStages: string[];
  defaultTimeline: string;
  minCommitment: string;
  createdAt: string;
}

export interface ProposalItem {
  billingType?: BillingType; optional?: boolean; selected?: boolean; packageId?: string; order?: number;
  id: string;
  proposalId: string;
  name: string;
  description: string;
  details: string[];
  unitLabel: string;
  quantity: number;
  unitPrice: number;
  price: number; // total da linha
}

export interface ItemInput {
  billingType?: BillingType; optional?: boolean; selected?: boolean; packageId?: string; order?: number;
  name: string;
  description: string;
  details?: string[];
  unitLabel?: string;
  quantity?: number;
  unitPrice: number;
}

export type ProposalStatus =
  | 'draft'
  | 'sent'
  | 'approved'
  | 'declined'
  | 'changes_requested'
  | 'in_progress'
  | 'delivered';

export type PaymentStatus = 'pending' | 'awaiting_verification' | 'paid';
export type PaymentEntryStatus = 'planned' | 'awaiting_verification' | 'verified' | 'rejected';
export type PaymentMethod = 'pix' | 'boleto' | 'transferencia' | 'dinheiro' | 'cartao' | 'outro';

export interface PaymentEntry {
  id: string;
  paymentId: string;
  amount: number; // centavos
  method: PaymentMethod | null;
  paidOn: string;
  status: PaymentEntryStatus;
  receiptFileName: string | null;
  receiptMimeType: string | null;
  receiptSize: number | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  companyId: string;
  proposalId: string;
  label: string;
  amount: number; // centavos
  dueDate: string | null;
  status: PaymentStatus;
  paidAt: string | null;
  billingLink?: string | null;
  expectedPaymentDate?: string | null;
  receiptFileName: string | null;
  receiptMimeType: string | null;
  receiptSize: number | null;
  entries?: PaymentEntry[];
  createdAt: string;
}

export interface Proposal {
  commercial?: CommercialConfig | null;
  id: string;
  companyId: string;
  clientId: string | null;
  client: Client | null;
  proposalNumber: string;
  title: string;
  paymentPattern?: { amount: number; method: string }[] | null;
  pixKeyOverride: string;
  template: string;
  validityDays: string;
  timeline: string;
  paymentTerms: string;
  notes: string;
  total: number;
  status: ProposalStatus;
  publicToken: string;
  responseNote: string | null;
  accessPhrase: string | null;
  maxAccesses: number;
  accessCount: number;
  viewedAt: string | null;
  viewCount: number;
  createdAt: string;
  respondedAt: string | null;
  startedAt: string | null;
  deliveredAt: string | null;
  contractFileName: string | null;
  contractMimeType: string | null;
  contractSize: number | null;
  contractUploadedAt: string | null;
  items: ProposalItem[];
  payments: Payment[];
  reviews?: MonthlyReview[];
  progressUpdates?: ProgressUpdate[];
  blocks?: ProposalBlock[];
}

export interface ProposalBlock {
  id: string;
  proposalId: string;
  order: number;
  title: string;
  description: string;
  status: 'pending' | 'done';
  link: string;
  doneAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyReview {
  id: string;
  proposalId: string;
  month: string; // "2026-09"
  rating: number; // 1..5
  comment: string;
  createdAt: string;
}

export interface Delivery {
  id: string;
  progressUpdateId: string;
  title: string;
  url: string;
  createdAt: string;
}

export interface ProgressUpdate {
  id: string;
  proposalId: string;
  month: string; // "2026-09"
  summary: string;
  deliveries: Delivery[];
  createdAt: string;
  updatedAt: string;
}

export type DeliveryInput = { title: string; url: string };

export type NotificationType = 'proposal_viewed' | 'proposal_approved' | 'proposal_declined' | 'proposal_changes_requested';

export interface AppNotification {
  id: string;
  companyId: string;
  type: NotificationType;
  message: string;
  proposalId: string | null;
  readAt: string | null;
  createdAt: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* sem corpo */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface EmailTemplateRow {
  key: string;
  label: string;
  audience: 'cliente' | 'dono';
  vars: string[];
  enabled: boolean;
  subject: string;
  title: string;
  body: string;
  custom: boolean;
  default: { subject: string; title: string; body: string };
}

export interface WhatsappTemplateRow {
  key: string;
  label: string;
  vars: string[];
  enabled: boolean;
  body: string;
  custom: boolean;
  default: { body: string };
}

export const api = {
  company: {
    get: () => request<Company>('/api/company'),
    update: (data: Partial<Omit<Company, 'id'>>) =>
      request<Company>('/api/company', { method: 'PATCH', body: JSON.stringify(data) }),
    resendEmailVerification: () =>
      request<{ ok: true }>('/api/company/verify-email', { method: 'POST' }),
  },
  emailTemplates: {
    list: () => request<EmailTemplateRow[]>('/api/email-templates'),
    save: (
      key: string,
      data: Partial<Pick<EmailTemplateRow, 'subject' | 'title' | 'body' | 'enabled'>>,
    ) => request<unknown>(`/api/email-templates/${key}`, { method: 'PUT', body: JSON.stringify(data) }),
    reset: (key: string) =>
      request<void>(`/api/email-templates/${key}`, { method: 'DELETE' }),
  },
  whatsappTemplates: {
    list: () => request<WhatsappTemplateRow[]>('/api/whatsapp-templates'),
    save: (key: string, data: Partial<Pick<WhatsappTemplateRow, 'body' | 'enabled'>>) =>
      request<unknown>(`/api/whatsapp-templates/${key}`, { method: 'PUT', body: JSON.stringify(data) }),
    reset: (key: string) =>
      request<void>(`/api/whatsapp-templates/${key}`, { method: 'DELETE' }),
  },
  clients: {
    list: () => request<Client[]>('/api/clients'),
    create: (data: { name: string; orgName?: string; document?: string; email?: string }) =>
      request<Client>('/api/clients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Pick<Client, 'name' | 'orgName' | 'document' | 'email'>>) =>
      request<Client>(`/api/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/api/clients/${id}`, { method: 'DELETE' }),
    insight: (id: string) => request<ClientPunctuality>(`/api/clients/${id}/insight`),
  },
  services: {
    list: () => request<Service[]>('/api/services'),
    create: (
      data: Partial<Pick<Service, 'description' | 'kind' | 'unitLabel' | 'price' | 'details' | 'defaultStages' | 'defaultTimeline' | 'minCommitment' | 'billingType'>> & {
        name: string;
      },
    ) => request<Service>('/api/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (
      id: string,
      data: Partial<
        Pick<Service, 'name' | 'description' | 'kind' | 'unitLabel' | 'price' | 'details' | 'defaultStages' | 'defaultTimeline' | 'minCommitment' | 'billingType'>
      >,
    ) => request<Service>(`/api/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/api/services/${id}`, { method: 'DELETE' }),
  },
  proposals: {
    list: () => request<Proposal[]>('/api/proposals'),
    get: (id: string) => request<Proposal>(`/api/proposals/${id}`),
    create: (data: {
      commercial?: CommercialConfig | null;
      clientId: string | null;
      template: string;
      proposalNumber: string;
      title?: string;
      validityDays: string;
      timeline: string;
      paymentTerms: string;
      notes: string;
      status?: 'draft' | 'sent';
      accessPhrase?: string | null;
      items: ItemInput[];
    }) => request<Proposal>('/api/proposals', { method: 'POST', body: JSON.stringify(data) }),
    update: (
      id: string,
      data: Partial<
        {
          commercial: CommercialConfig | null;
          status: ProposalStatus;
          accessPhrase: string | null;
          maxAccesses: number;
          items: ItemInput[];
        } & Pick<
          Proposal,
          | 'proposalNumber'
          | 'title'
          | 'template'
          | 'validityDays'
          | 'timeline'
          | 'paymentTerms'
          | 'notes'
          | 'pixKeyOverride'
        >
      >,
    ) => request<Proposal>(`/api/proposals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    resetAccess: (id: string) =>
      request<{ ok: true }>(`/api/proposals/${id}/access`, { method: 'POST' }),
    remove: (id: string) => request<void>(`/api/proposals/${id}`, { method: 'DELETE' }),
  },
  progress: {
    list: (proposalId: string) =>
      request<ProgressUpdate[]>(`/api/proposals/${proposalId}/progress`),
    addMonth: (proposalId: string, month: string) =>
      request<ProgressUpdate>(`/api/proposals/${proposalId}/progress`, {
        method: 'POST',
        body: JSON.stringify({ month }),
      }),
    update: (
      proposalId: string,
      updateId: string,
      data: { summary?: string; deliveries?: DeliveryInput[] },
    ) =>
      request<ProgressUpdate>(`/api/proposals/${proposalId}/progress/${updateId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    removeMonth: (proposalId: string, updateId: string) =>
      request<void>(`/api/proposals/${proposalId}/progress/${updateId}`, { method: 'DELETE' }),
  },
  blocks: {
    list: (proposalId: string) => request<ProposalBlock[]>(`/api/proposals/${proposalId}/blocks`),
    add: (proposalId: string, title: string) =>
      request<ProposalBlock[]>(`/api/proposals/${proposalId}/blocks`, {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),
    addMany: (proposalId: string, titles: string[]) =>
      request<ProposalBlock[]>(`/api/proposals/${proposalId}/blocks`, {
        method: 'POST',
        body: JSON.stringify({ titles }),
      }),
    update: (
      proposalId: string,
      blockId: string,
      data: Partial<Pick<ProposalBlock, 'title' | 'description' | 'link' | 'order' | 'status'>>,
    ) =>
      request<ProposalBlock>(`/api/proposals/${proposalId}/blocks/${blockId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    remove: (proposalId: string, blockId: string) =>
      request<void>(`/api/proposals/${proposalId}/blocks/${blockId}`, { method: 'DELETE' }),
  },
  contracts: {
    upload: async (proposalId: string, file: File) => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/proposals/${proposalId}/contract`, { method: 'POST', body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Erro ${res.status}`);
      }
      return res.json() as Promise<{ ok: true; fileName: string; size: number }>;
    },
    remove: (proposalId: string) => request<void>(`/api/proposals/${proposalId}/contract`, { method: 'DELETE' }),
    fileUrl: (proposalId: string) => `/api/proposals/${proposalId}/contract`,
  },
  payments: {
    generatePlan: (
      proposalId: string,
      data: {
        recurrence: 'once' | 'monthly';
        occurrences?: number;
        cycleAmount: number;
      },
    ) => request<Payment[]>(`/api/proposals/${proposalId}/payments`, { method: 'POST', body: JSON.stringify(data) }),
    verifyEntry: (proposalId: string, paymentId: string, entryId: string, status: 'verified' | 'rejected') =>
      request<{ ok: true; status: string }>(
        `/api/proposals/${proposalId}/payments/${paymentId}/entries/${entryId}`,
        { method: 'PATCH', body: JSON.stringify({ status }) },
      ),
    entryReceiptUrl: (proposalId: string, paymentId: string, entryId: string) =>
      `/api/proposals/${proposalId}/payments/${paymentId}/entries/${entryId}`,
    clearPlan: (proposalId: string) => request<void>(`/api/proposals/${proposalId}/payments`, { method: 'DELETE' }),
    setStatus: (proposalId: string, paymentId: string, status: PaymentStatus) =>
      request<Payment>(`/api/proposals/${proposalId}/payments/${paymentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    remove: (proposalId: string, paymentId: string) =>
      request<void>(`/api/proposals/${proposalId}/payments/${paymentId}`, { method: 'DELETE' }),
    uploadReceipt: async (proposalId: string, paymentId: string, file: File) => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/proposals/${proposalId}/payments/${paymentId}/receipt`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Erro ${res.status}`);
      }
      return res.json() as Promise<{ ok: true; status: PaymentStatus; paidAt: string | null }>;
    },
    removeReceipt: (proposalId: string, paymentId: string) =>
      request<void>(`/api/proposals/${proposalId}/payments/${paymentId}/receipt`, { method: 'DELETE' }),
    receiptUrl: (proposalId: string, paymentId: string) =>
      `/api/proposals/${proposalId}/payments/${paymentId}/receipt`,
  },
  notifications: {
    list: () => request<{ items: AppNotification[]; unread: number }>('/api/notifications'),
    markRead: (ids?: string[]) =>
      request<{ ok: true }>('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify(ids ? { ids } : {}),
      }),
  },
};
