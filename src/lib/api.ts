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

export interface Service {
  id: string;
  companyId: string;
  name: string;
  description: string;
  price: number;
  createdAt: string;
}

export interface ProposalItem {
  id: string;
  proposalId: string;
  name: string;
  description: string;
  price: number;
}

export type ProposalStatus = 'draft' | 'sent' | 'approved' | 'declined' | 'changes_requested';

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
  items: ProposalItem[];
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
  },
  services: {
    list: () => request<Service[]>('/api/services'),
    create: (data: { name: string; description?: string; price?: number }) =>
      request<Service>('/api/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Pick<Service, 'name' | 'description' | 'price'>>) =>
      request<Service>(`/api/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
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
      items: { name: string; description: string; price: number }[];
    }) => request<Proposal>('/api/proposals', { method: 'POST', body: JSON.stringify(data) }),
    update: (
      id: string,
      data: Partial<
        {
          status: ProposalStatus;
          accessPhrase: string | null;
          items: { name: string; description: string; price: number }[];
        } & Pick<
          Proposal,
          'proposalNumber' | 'template' | 'validityDays' | 'timeline' | 'paymentTerms' | 'notes'
        >
      >,
    ) => request<Proposal>(`/api/proposals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/api/proposals/${id}`, { method: 'DELETE' }),
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
