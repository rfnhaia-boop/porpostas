import type { ToolDef, ToolCall } from './groq';

// Fase 1: o Ravi só RASCUNHA um serviço. Nada é gravado aqui — o rascunho volta
// pra tela, o dono revisa e confirma pelo caminho normal (/api/services).

export const RAVI_TOOLS: ToolDef[] = [
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
        priceReais: { type: 'number', description: 'Preço por unidade, em REAIS (ex: 1500.00)' },
        unitLabel: {
          type: 'string',
          description: 'Unidade de venda: projeto, hora, diária, pacote, unidade, mês…',
        },
        description: { type: 'string', description: 'Frase curta do que é (opcional)' },
        details: {
          type: 'array',
          items: { type: 'string' },
          description: 'Entregáveis / o que inclui, um por item (opcional)',
        },
        defaultStages: {
          type: 'array',
          items: { type: 'string' },
          description: 'Etapas/blocos padrão de execução, um por item (opcional)',
        },
        defaultTimeline: { type: 'string', description: 'Prazo padrão, ex: "30 dias úteis" (opcional)' },
        minCommitment: {
          type: 'string',
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

/** Fase 1: só existe rascunhar_servico. Devolve o rascunho ou null. */
export function runRaviTool(call: ToolCall): { draft: ServiceDraft | null } {
  if (call.name === 'rascunhar_servico') return { draft: toServiceDraft(call.arguments) };
  return { draft: null };
}
