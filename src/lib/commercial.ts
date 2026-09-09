export type CommercialModel = 'fixed' | 'monthly' | 'hybrid' | 'packages' | 'items';
export type BillingType = 'once' | 'monthly';
// Como o 1º vencimento é definido:
//  fixed     — o dono escolhe uma data (firstDueDate)
//  month_end — vence no último dia de cada mês
//  client    — o cliente escolhe o dia ao aceitar (cai em month_end se não escolher)
export type DueDateMode = 'fixed' | 'month_end' | 'client';
export const DUE_DATE_MODES: DueDateMode[] = ['fixed', 'month_end', 'client'];
export type CommercialConfig = {
  version: 1;
  model: CommercialModel;
  months: number;
  installments: number;
  firstDueDate: string;
  dueDateMode: DueDateMode;
  commitmentMonths: number;
  exclusions: string;
  revisions: string;
  packages: { id: string; name: string }[];
  selectedPackage: string;
}
export interface CommercialItem {
  id?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  billingType?: string;
  optional?: boolean;
  selected?: boolean;
  packageId?: string;
}
export const COMMERCIAL_MODELS = [
  { id: 'fixed', name: 'Projeto fechado', description: 'Site, marca e entregas com escopo definido.', template: 'escopo' },
  { id: 'monthly', name: 'Serviço mensal', description: 'Entregas contínuas com mensalidade e vigência.', template: 'executivo' },
  { id: 'hybrid', name: 'Implantação + mensalidade', description: 'Um investimento inicial e acompanhamento mensal.', template: 'cyber' },
  { id: 'packages', name: 'Pacotes comparativos', description: 'O cliente escolhe um plano e os adicionais.', template: 'minimalista' },
  { id: 'items', name: 'Orçamento por itens', description: 'Produtos, horas, diárias e serviços avulsos.', template: 'detalhado' },
] as const;

export function newCommercialConfig(model: CommercialModel = 'fixed'): CommercialConfig {
  return { version: 1, model, months: 3, installments: 1, firstDueDate: '', dueDateMode: 'fixed', commitmentMonths: 0,
    exclusions: '', revisions: '', selectedPackage: 'essential',
    packages: [{ id: 'essential', name: 'Essencial' }, { id: 'professional', name: 'Profissional' }, { id: 'complete', name: 'Completo' }] };
}

export function parseCommercial(raw: unknown): CommercialConfig | null {
  if (raw == null) return null;
  if (typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Modelo comercial inválido.');
  const r = raw as Record<string, unknown>;
  if (r.version !== 1 || !COMMERCIAL_MODELS.some(m => m.id === r.model)) throw new Error('Modelo comercial inválido.');
  const integer = (key: string, min: number, max: number) => {
    const n = r[key];
    if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) throw new Error(`Valor inválido: ${key}.`);
    return n;
  };
  const model = r.model as CommercialModel;
  const months = integer('months', 1, 60);
  const installments = integer('installments', 1, 48);
  const commitmentMonths = integer('commitmentMonths', 0, months);
  const firstDueDate = typeof r.firstDueDate === 'string' ? r.firstDueDate : '';
  if (firstDueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(firstDueDate) || Number.isNaN(Date.parse(firstDueDate)) || new Date(firstDueDate).toISOString().slice(0, 10) !== firstDueDate)) throw new Error('Informe uma data válida para o primeiro vencimento.');
  // Propostas antigas não têm o campo — assumem 'fixed'.
  const dueDateMode: DueDateMode = DUE_DATE_MODES.includes(r.dueDateMode as DueDateMode) ? (r.dueDateMode as DueDateMode) : 'fixed';
  const packages = newCommercialConfig().packages.map(p => {
    const found = Array.isArray(r.packages) ? r.packages.find(v => v && typeof v === 'object' && v.id === p.id) : null;
    return { id: p.id, name: typeof found?.name === 'string' && found.name.trim() ? found.name.trim().slice(0, 60) : p.name };
  });
  const selectedPackage = typeof r.selectedPackage === 'string' ? r.selectedPackage : '';
  if (model === 'packages' && !packages.some(p => p.id === selectedPackage)) throw new Error('Selecione um pacote válido.');
  return { version: 1, model, months, installments, firstDueDate, dueDateMode, commitmentMonths, packages, selectedPackage,
    exclusions: typeof r.exclusions === 'string' ? r.exclusions.trim().slice(0, 4000) : '',
    revisions: typeof r.revisions === 'string' ? r.revisions.trim().slice(0, 1000) : '' };
}

export function included(item: CommercialItem, c: CommercialConfig): boolean {
  return (!item.optional || item.selected === true) && (c.model !== 'packages' || !item.packageId || item.packageId === c.selectedPackage);
}

export function commercialTotals(items: CommercialItem[], c: CommercialConfig) {
  let once = 0; let monthly = 0;
  for (const item of items.filter(i => included(i, c))) {
    const amount = Math.round(item.quantity * item.unitPrice);
    if (item.billingType === 'monthly') monthly += amount; else once += amount;
  }
  return { once, monthly, total: once + monthly * c.months };
}

export function validateCommercial(items: CommercialItem[], c: CommercialConfig, requireDate = false) {
  if (requireDate && (c.dueDateMode ?? 'fixed') === 'fixed' && !c.firstDueDate) throw new Error('Defina o primeiro vencimento antes de enviar (ou mude o modo de vencimento).');
  if (!items.length || items.length > 100) throw new Error('Inclua de 1 a 100 itens.');
  for (const item of items) {
    if (!item.name.trim() || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isSafeInteger(item.unitPrice) || item.unitPrice < 0 || item.unitPrice > 2_000_000_000) throw new Error('Revise os nomes, quantidades e valores dos itens.');
    const lineTotal = Math.round(item.quantity * item.unitPrice);
    if (!Number.isSafeInteger(lineTotal) || lineTotal > 2_000_000_000) throw new Error('O valor de um item supera o limite permitido.');
    if (!['once', 'monthly'].includes(item.billingType ?? 'once')) throw new Error('Cobrança inválida.');
    if (c.model === 'monthly' && item.billingType !== 'monthly') throw new Error('O modelo mensal aceita apenas mensalidades. Use implantação + mensalidade para combinar cobranças.');
    if (['fixed', 'items'].includes(c.model) && item.billingType === 'monthly') throw new Error('Escolha um modelo com mensalidade para incluir serviços recorrentes.');
    if (item.packageId && (c.model !== 'packages' || !c.packages.some(p => p.id === item.packageId))) throw new Error('Pacote inválido em um item.');
  }
  const configurations = c.model === 'packages' ? c.packages.map(p => ({ ...c, selectedPackage: p.id })) : [c];
  for (const config of configurations) {
    if (c.model === 'packages' && !items.some(i => i.packageId === config.selectedPackage && !i.optional)) throw new Error('Inclua pelo menos um item obrigatório em cada pacote.');
    const { once, monthly, total } = commercialTotals(items, config);
    if (!Number.isSafeInteger(total) || total <= 0 || total > 2_000_000_000) throw new Error('O total contratado deve ser positivo e dentro do limite permitido.');
    if (once > 0 && once < c.installments) throw new Error('O número de parcelas supera o valor disponível em centavos.');
    if (monthly === 0 && c.model === 'monthly') throw new Error('Inclua uma mensalidade maior que zero.');
  }
}

/** Último dia do mês corrente, meia-dia UTC — usado quando o vencimento não é data fixa. */
function currentMonthEnd(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 12));
}

/** Preserva os centavos e o dia contratado, inclusive fevereiro e meses de 30 dias. */
export function commercialSchedule(
  items: CommercialItem[],
  c: CommercialConfig,
  opts: { clientDueDate?: string } = {},
) {
  validateCommercial(items, c, true);
  const { once, monthly } = commercialTotals(items, c);
  const mode = c.dueDateMode ?? 'fixed';
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (mode === 'client' && opts.clientDueDate) parseCommercial({ ...c, firstDueDate: opts.clientDueDate });
  const base =
    mode === 'fixed'
      ? new Date(`${c.firstDueDate}T12:00:00.000Z`)
      : mode === 'client' && opts.clientDueDate && iso.test(opts.clientDueDate)
        ? new Date(`${opts.clientDueDate}T12:00:00.000Z`)
        : c.firstDueDate ? new Date(`${c.firstDueDate}T12:00:00.000Z`) : currentMonthEnd();
  const dateAt = (offset: number) => {
    const last = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + offset + 1, 0)).getUTCDate();
    return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + offset, mode === 'month_end' || (mode === 'client' && !opts.clientDueDate) ? last : Math.min(base.getUTCDate(), last), 12));
  };
  const plan: { label: string; amount: number; dueDate: Date }[] = [];
  if (once) {
    const amount = Math.floor(once / c.installments);
    for (let i = 0; i < c.installments; i++) plan.push({ label: c.installments > 1 ? `${monthly ? 'Implantação' : 'Projeto'} · Parcela ${i + 1}/${c.installments}` : monthly ? 'Implantação' : 'Pagamento único', amount: amount + (i < once % c.installments ? 1 : 0), dueDate: dateAt(i) });
  }
  if (monthly) for (let i = 0; i < c.months; i++) plan.push({ label: `Mensalidade ${i + 1}/${c.months}`, amount: monthly, dueDate: dateAt(i) });
  return plan.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export function commercialPaymentTerms(items: CommercialItem[], c: CommercialConfig, money: (n: number) => string) {
  const { once, monthly } = commercialTotals(items, c);
  const parts: string[] = [];
  if (once) parts.push(`${monthly ? 'Implantação' : 'Pagamento do projeto'}: ${money(once)}${c.installments > 1 ? ` em ${c.installments} parcelas mensais (ajuste de centavos nas primeiras parcelas)` : ' em pagamento único'}`);
  if (monthly) parts.push(`${c.months} mensalidades de ${money(monthly)}. Vigência: ${c.months} meses${c.commitmentMonths ? `; permanência mínima: ${c.commitmentMonths} meses` : ''}`);
  const mode = c.dueDateMode ?? 'fixed';
  // 'client' foi descontinuado (o cliente não escolhe mais a data no aceite) — cai em fim do mês.
  if (mode === 'month_end' || mode === 'client') parts.push('Vencimento no último dia de cada mês');
  else parts.push(c.firstDueDate ? `Primeiro vencimento: ${c.firstDueDate.split('-').reverse().join('/')}. Demais vencimentos no mesmo dia dos meses seguintes, limitado ao último dia do mês` : 'Primeiro vencimento a definir antes do envio');
  return parts.join('. ') + '.';
}
