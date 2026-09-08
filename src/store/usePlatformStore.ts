import { newCommercialConfig, type CommercialConfig, type BillingType } from '@/lib/commercial';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, type Company, type Client as ApiClient, type Service as ApiService } from '@/lib/api';

export interface CompanyInfo {
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
}

export interface Client {
  id: string;
  name: string;
  company: string; // nome da empresa do cliente (API: orgName)
  document: string;
  email: string;
}

export interface SavedService {
  billingType?: BillingType; optional?: boolean; selected?: boolean; packageId?: string;
  id: string;
  name: string;
  description: string;
  kind: 'service' | 'product';
  unitLabel: string;
  price: number; // por unidade (centavos)
  details: string[];
  defaultStages: string[]; // etapas/blocos padrão do serviço
  defaultTimeline: string;
  minCommitment: string; // fidelidade / permanência mínima
  quantity: number; // 1 no catálogo; ajustável ao montar o orçamento
}

export interface QuoteDraft {
  commercial?: CommercialConfig | null;
  clientId: string | null;
  services: SavedService[];
  template: 'cyber' | 'minimalista' | 'executivo' | 'escopo' | 'essencial' | 'detalhado';
  proposalNumber: string;
  title: string; // nome da proposta ('' = usa o número)
  validityDays: string;
  paymentTerms: string;
  notes: string;
  timeline: string;
  accessPhrase: string; // palavra-chave do link ('' = link aberto)
  requiresSignedContract: boolean; // trava: só inicia após anexar o contrato assinado
  // Preenchidos quando o rascunho é uma proposta existente sendo editada.
  proposalId: string | null;
  publicToken: string | null;
}

// Proposta vinda da API para carregar no rascunho (formato mínimo necessário).
export interface EditableProposal {
  commercial?: CommercialConfig | null;
  id: string;
  publicToken: string;
  clientId: string | null;
  template: string;
  proposalNumber: string;
  title: string;
  validityDays: string;
  timeline: string;
  paymentTerms: string;
  notes: string;
  accessPhrase: string | null;
  requiresSignedContract?: boolean;
  items: {
    billingType?: BillingType; optional?: boolean; selected?: boolean; packageId?: string; order?: number;
    name: string;
    description: string;
    details: string[];
    unitLabel: string;
    quantity: number;
    unitPrice: number;
  }[];
}

// --- mapeamento API <-> store -------------------------------------------------
const toCompanyInfo = (c: Company): CompanyInfo => ({
  name: c.name,
  cnpj: c.cnpj,
  logoUrl: c.logoUrl,
  email: c.email,
  phone: c.phone,
  pixKey: c.pixKey ?? '',
  pixKeyType: c.pixKeyType ?? '',
  pixReceiverName: c.pixReceiverName ?? '',
  pixReceiverCity: c.pixReceiverCity ?? '',
  emailVerified: !!c.emailVerified,
});
const toClient = (c: ApiClient): Client => ({
  id: c.id,
  name: c.name,
  company: c.orgName,
  document: c.document,
  email: c.email,
});
const toService = (s: ApiService): SavedService => ({
  billingType: s.billingType ?? 'once',
  id: s.id,
  name: s.name,
  description: s.description,
  kind: s.kind,
  unitLabel: s.unitLabel,
  price: s.price,
  details: s.details ?? [],
  defaultStages: s.defaultStages ?? [],
  defaultTimeline: s.defaultTimeline ?? '',
  minCommitment: s.minCommitment ?? '',
  quantity: 1,
});

export interface PlatformState {
  companyInfo: CompanyInfo;
  clients: Client[];
  savedServices: SavedService[];
  quoteDraft: QuoteDraft;
  hydrated: boolean;

  hydrate: () => Promise<void>;

  updateCompanyInfo: (data: Partial<CompanyInfo>) => Promise<void>;

  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (id: string, data: Partial<Omit<Client, 'id'>>) => Promise<void>;
  removeClient: (id: string) => Promise<void>;

  addSavedService: (service: Omit<SavedService, 'id'>) => Promise<void>;
  updateSavedService: (id: string, data: Partial<Omit<SavedService, 'id'>>) => Promise<void>;
  removeSavedService: (id: string) => Promise<void>;

  updateQuoteDraft: (data: Partial<QuoteDraft>) => void;
  resetQuoteDraft: () => void;
  loadProposalIntoDraft: (proposal: EditableProposal) => void;
}

const initialCompanyInfo: CompanyInfo = {
  name: 'Minha Empresa',
  cnpj: '',
  logoUrl: '',
  email: '',
  phone: '',
  pixKey: '',
  pixKeyType: '',
  pixReceiverName: '',
  pixReceiverCity: '',
  emailVerified: false,
};

const initialQuoteDraft: QuoteDraft = {
  commercial: newCommercialConfig(),
  clientId: null,
  services: [],
  template: 'cyber',
  proposalNumber: `PRJ-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
  title: '',
  validityDays: '15 Dias',
  paymentTerms: '50% na aprovação e 50% na entrega',
  notes: '',
  timeline: '30 dias úteis',
  accessPhrase: '',
  requiresSignedContract: false,
  proposalId: null,
  publicToken: null,
};

const TEMPLATES = ['cyber', 'minimalista', 'executivo', 'escopo', 'essencial', 'detalhado'] as const;
const asTemplate = (t: string): QuoteDraft['template'] =>
  (TEMPLATES as readonly string[]).includes(t) ? (t as QuoteDraft['template']) : 'cyber';
const randomId = () =>
  (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set, get) => ({
      companyInfo: initialCompanyInfo,
      clients: [],
      savedServices: [],
      quoteDraft: initialQuoteDraft,
      hydrated: false,

      hydrate: async () => {
        const [company, clients, services] = await Promise.all([
          api.company.get(),
          api.clients.list(),
          api.services.list(),
        ]);
        set({
          companyInfo: toCompanyInfo(company),
          clients: clients.map(toClient),
          savedServices: services.map(toService),
          hydrated: true,
        });
      },

      updateCompanyInfo: async (data) => {
        set((state) => ({ companyInfo: { ...state.companyInfo, ...data } })); // otimista
        const saved = await api.company.update(data);
        set({ companyInfo: toCompanyInfo(saved) });
      },

      addClient: async (client) => {
        const created = await api.clients.create({
          name: client.name,
          orgName: client.company,
          document: client.document,
          email: client.email,
        });
        set((state) => ({ clients: [toClient(created), ...state.clients] }));
      },
      updateClient: async (id, data) => {
        const saved = await api.clients.update(id, {
          name: data.name,
          orgName: data.company,
          document: data.document,
          email: data.email,
        });
        set((state) => ({ clients: state.clients.map((c) => (c.id === id ? toClient(saved) : c)) }));
      },
      removeClient: async (id) => {
        set((state) => ({ clients: state.clients.filter((c) => c.id !== id) })); // otimista
        try {
          await api.clients.remove(id);
        } catch {
          await get().hydrate();
        }
      },

      addSavedService: async (service) => {
        const created = await api.services.create({
          billingType: service.billingType,
          name: service.name,
          description: service.description,
          kind: service.kind,
          unitLabel: service.unitLabel,
          price: service.price,
          details: service.details,
          defaultStages: service.defaultStages,
          defaultTimeline: service.defaultTimeline,
          minCommitment: service.minCommitment,
        });
        set((state) => ({ savedServices: [toService(created), ...state.savedServices] }));
      },
      updateSavedService: async (id, data) => {
        const { quantity: _q, ...patch } = data;
        void _q;
        const saved = await api.services.update(id, patch);
        set((state) => ({
          savedServices: state.savedServices.map((s) => (s.id === id ? toService(saved) : s)),
        }));
      },
      removeSavedService: async (id) => {
        set((state) => ({ savedServices: state.savedServices.filter((s) => s.id !== id) })); // otimista
        try {
          await api.services.remove(id);
        } catch {
          await get().hydrate();
        }
      },

      updateQuoteDraft: (data) => set((state) => ({ quoteDraft: { ...state.quoteDraft, ...data } })),
      resetQuoteDraft: () =>
        set({
          quoteDraft: {
            ...initialQuoteDraft,
            proposalNumber: `PRJ-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          },
        }),
      loadProposalIntoDraft: (p) =>
        set({
          quoteDraft: {
            commercial: p.commercial ?? null,
            clientId: p.clientId,
            services: [...p.items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((it) => ({
              billingType: it.billingType ?? 'once', optional: it.optional, selected: it.selected, packageId: it.packageId,
              id: randomId(),
              name: it.name,
              description: it.description,
              kind: (it.unitLabel === 'projeto' ? 'service' : 'product') as 'service' | 'product',
              unitLabel: it.unitLabel,
              price: it.unitPrice,
              details: it.details ?? [],
              defaultStages: [],
              defaultTimeline: '',
              minCommitment: '',
              quantity: it.quantity ?? 1,
            })),
            template: asTemplate(p.template),
            proposalNumber: p.proposalNumber,
            title: p.title ?? '',
            validityDays: p.validityDays,
            paymentTerms: p.paymentTerms,
            notes: p.notes,
            timeline: p.timeline,
            accessPhrase: p.accessPhrase ?? '',
            requiresSignedContract: p.requiresSignedContract ?? false,
            proposalId: p.id,
            publicToken: p.publicToken,
          },
        }),
    }),
    {
      name: 'nex-platform-storage',
      partialize: (state) => ({ quoteDraft: state.quoteDraft }),
    },
  ),
);
