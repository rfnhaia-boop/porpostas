// Cliente HTTP tipado para o front. Toda a persistência passa por aqui.

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  logoUrl: string;
  email: string;
  phone: string;
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
  id: string;
  companyId: string;
  name: string;
  description: string;
  kind: CatalogKind;
  unitLabel: string;
  price: number; // centavos, por unidade
  details: string[];
  defaultTimeline: string;
  createdAt: string;
}

export interface ProposalItem {
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

export type PaymentStatus = 'pending' | 'paid';

export interface Payment {
  id: string;
  companyId: string;
  proposalId: string;
  label: string;
  amount: number; // centavos
  dueDate: string | null;
  status: PaymentStatus;
  paidAt: string | null;
  receiptFileName: string | null;
  receiptMimeType: string | null;
  receiptSize: number | null;
  createdAt: string;
}

export interface Proposal {
  id: string;
  companyId: string;
  clientId: string | null;
  client: Client | null;
  proposalNumber: string;
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
}

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

export const api = {
  company: {
    get: () => request<Company>('/api/company'),
    update: (data: Partial<Omit<Company, 'id'>>) =>
      request<Company>('/api/company', { method: 'PATCH', body: JSON.stringify(data) }),
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
      data: Partial<Pick<Service, 'description' | 'kind' | 'unitLabel' | 'price' | 'details' | 'defaultTimeline'>> & {
        name: string;
      },
    ) => request<Service>('/api/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (
      id: string,
      data: Partial<
        Pick<Service, 'name' | 'description' | 'kind' | 'unitLabel' | 'price' | 'details' | 'defaultTimeline'>
      >,
    ) => request<Service>(`/api/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/api/services/${id}`, { method: 'DELETE' }),
  },
  proposals: {
    list: () => request<Proposal[]>('/api/proposals'),
    get: (id: string) => request<Proposal>(`/api/proposals/${id}`),
    create: (data: {
      clientId: string | null;
      template: string;
      proposalNumber: string;
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
          status: ProposalStatus;
          accessPhrase: string | null;
          items: ItemInput[];
        } & Pick<
          Proposal,
          'proposalNumber' | 'template' | 'validityDays' | 'timeline' | 'paymentTerms' | 'notes'
        >
      >,
    ) => request<Proposal>(`/api/proposals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/api/proposals/${id}`, { method: 'DELETE' }),
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
        installmentsPerCycle: number;
        cycleAmount: number;
        firstDueDate?: string | null;
      },
    ) => request<Payment[]>(`/api/proposals/${proposalId}/payments`, { method: 'POST', body: JSON.stringify(data) }),
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
