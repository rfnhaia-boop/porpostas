import type { ToolDef, ToolCall } from './groq';

// O Havi RASCUNHA (serviço, produto, cliente). Nada é gravado aqui — os rascunhos
// voltam pra tela e o dono confirma pelos endpoints de sempre (/api/services, /api/clients).

export const RAVI_TOOLS: ToolDef[] = [
  {
    name: 'rascunhar_cliente',
    description:
      'Monta o rascunho de um cliente. Chame quando estiver cadastrando um cliente novo ou quando extrair o cliente de um contrato. Só precisa do nome; o resto é opcional.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome da pessoa de contato ou do cliente' },
        orgName: { type: ['string', 'null'], description: 'Nome da empresa do cliente (opcional)' },
        document: { type: ['string', 'null'], description: 'CPF ou CNPJ (opcional)' },
        email: { type: ['string', 'null'], description: 'E-mail (opcional)' },
        phone: { type: ['string', 'null'], description: 'Telefone / WhatsApp (opcional)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'rascunhar_servico',
    description:
      'Monta o rascunho de um serviço ou produto do catálogo depois de coletar os dados na conversa. Chame quando tiver pelo menos nome, tipo, forma de cobrança e preço.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome do serviço/produto' },
        kind: { type: 'string', enum: ['service', 'product'], description: 'serviço ou produto' },
        billingType: {
          type: 'string',
          enum: ['once', 'monthly'],
          description: 'once = cobra uma vez; monthly = mensalidade',
        },
        priceReais: { type: ['number', 'null'], description: 'Preço por unidade, em REAIS (ex: 1500.00)' },
        unitLabel: {
          type: ['string', 'null'],
          description: 'Unidade de venda: projeto, hora, diária, pacote, unidade, mês…',
        },
        description: { type: ['string', 'null'], description: 'Frase curta do que é (opcional)' },
        details: {
          type: ['array', 'null'],
          items: { type: 'string' },
          description: 'Entregáveis / o que inclui, um por item (opcional)',
        },
        defaultStages: {
          type: ['array', 'null'],
          items: { type: 'string' },
          description: 'Etapas/blocos padrão de execução, um por item (opcional)',
        },
        defaultTimeline: { type: ['string', 'null'], description: 'Prazo padrão, ex: "30 dias úteis" (opcional)' },
        minCommitment: {
          type: ['string', 'null'],
          description: 'Fidelidade / permanência mínima, ex: "3 meses" (opcional)',
        },
      },
      required: ['name', 'kind', 'billingType', 'priceReais'],
    },
  },
];

export interface ServiceDraft {
  name: string;
  kind: 'service' | 'product';
  billingType: 'once' | 'monthly';
  priceReais: number;
  unitLabel: string;
  description: string;
  details: string[];
  defaultStages: string[];
  defaultTimeline: string;
  minCommitment: string;
}

const str = (v: unknown, max = 400) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v: unknown, max: number) =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string').map((x) => x.trim()).filter(Boolean).slice(0, max)
    : [];

/** Normaliza os argumentos que o modelo mandou pro rascunho de serviço. */
export function toServiceDraft(rawArgs: string): ServiceDraft | null {
  let a: Record<string, unknown>;
  try {
    a = JSON.parse(rawArgs || '{}');
  } catch {
    return null;
  }
  const name = str(a.name, 120);
  if (!name) return null;
  const priceNum = Number(a.priceReais);
  return {
    name,
    kind: a.kind === 'product' ? 'product' : 'service',
    billingType: a.billingType === 'monthly' ? 'monthly' : 'once',
    priceReais: Number.isFinite(priceNum) && priceNum >= 0 ? priceNum : 0,
    unitLabel: str(a.unitLabel, 20) || (a.kind === 'product' ? 'unidade' : 'projeto'),
    description: str(a.description, 400),
    details: list(a.details, 30),
    defaultStages: list(a.defaultStages, 40),
    defaultTimeline: str(a.defaultTimeline, 60),
    minCommitment: str(a.minCommitment, 40),
  };
}

export interface ClientDraft {
  name: string;
  orgName: string;
  document: string;
  email: string;
  phone: string;
}

export function toClientDraft(rawArgs: string): ClientDraft | null {
  let a: Record<string, unknown>;
  try {
    a = JSON.parse(rawArgs || '{}');
  } catch {
    return null;
  }
  const name = str(a.name, 120);
  if (!name) return null;
  return {
    name,
    orgName: str(a.orgName, 120),
    document: str(a.document, 40),
    email: str(a.email, 160),
    phone: str(a.phone, 40),
  };
}

export type RaviDraft =
  | { type: 'service'; data: ServiceDraft }
  | { type: 'client'; data: ClientDraft };

/** Converte as tool-calls do modelo em rascunhos (serviço/produto/cliente). */
export function runRaviTools(calls: ToolCall[]): RaviDraft[] {
  const out: RaviDraft[] = [];
  for (const c of calls) {
    if (c.name === 'rascunhar_servico') {
      const d = toServiceDraft(c.arguments);
      if (d) out.push({ type: 'service', data: d });
    } else if (c.name === 'rascunhar_cliente') {
      const d = toClientDraft(c.arguments);
      if (d) out.push({ type: 'client', data: d });
    }
  }
  return out;
}
