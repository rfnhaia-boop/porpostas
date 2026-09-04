// Gera o plano de cobrança de uma proposta: recorrência (única ou mensal) × parcelas por ciclo.

export interface PaymentPlanInput {
  recurrence: 'once' | 'monthly';
  occurrences: number; // nº de meses (1 se "once")
  installmentsPerCycle: number; // 1, 2 ou 3
  cycleAmount: number; // centavos — valor de cada cobrança/mês
  firstDueDate?: string | null; // ISO date, opcional
}

export interface GeneratedPayment {
  label: string;
  amount: number; // centavos
  dueDate: Date | null;
}

export function generatePaymentPlan(input: PaymentPlanInput): GeneratedPayment[] {
  const occurrences = Math.max(1, Math.min(60, Math.round(input.occurrences) || 1));
  const perCycle = Math.max(1, Math.min(12, Math.round(input.installmentsPerCycle) || 1));
  const base = Math.floor(input.cycleAmount / perCycle);
  const remainder = input.cycleAmount - base * perCycle;
  const firstDue = input.firstDueDate ? new Date(input.firstDueDate) : null;

  const out: GeneratedPayment[] = [];
  for (let cycle = 1; cycle <= occurrences; cycle++) {
    const dueDate = firstDue ? addMonths(firstDue, cycle - 1) : null;
    for (let i = 1; i <= perCycle; i++) {
      const amount = i === perCycle ? base + remainder : base; // resto vai na última parcela do ciclo
      const label =
        input.recurrence === 'monthly'
          ? perCycle > 1
            ? `Mês ${cycle} · Parcela ${i}/${perCycle}`
            : `Mês ${cycle}`
          : perCycle > 1
            ? `Parcela ${i}/${perCycle}`
            : 'Pagamento único';
      out.push({ label, amount, dueDate });
    }
  }
  return out;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
