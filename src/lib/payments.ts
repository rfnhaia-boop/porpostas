// Gera o plano de cobrança de uma proposta: à vista ou mensal × N meses.
// Sem data de vencimento configurável — o vencimento é sempre o FIM DO MÊS.
// Como o cliente vai pagar cada mês (em quantas vezes, método) ele decide no
// portal, anexando 1 recibo (PaymentEntry) por vez.

export interface PaymentPlanInput {
  recurrence: 'once' | 'monthly';
  occurrences: number; // nº de meses (1 se "once")
  cycleAmount: number; // centavos — valor de cada mês
}

export interface GeneratedPayment {
  label: string;
  amount: number; // centavos
  dueDate: Date; // último dia do mês
}

/** Último dia do mês de `base` deslocado em `monthsAhead` meses. */
function endOfMonth(base: Date, monthsAhead: number): Date {
  // dia 0 do mês seguinte = último dia do mês alvo
  return new Date(base.getFullYear(), base.getMonth() + monthsAhead + 1, 0);
}

export function generatePaymentPlan(input: PaymentPlanInput): GeneratedPayment[] {
  const occurrences =
    input.recurrence === 'monthly'
      ? Math.max(1, Math.min(60, Math.round(input.occurrences) || 1))
      : 1;
  const amount = Math.round(input.cycleAmount);
  const now = new Date();

  const out: GeneratedPayment[] = [];
  for (let month = 1; month <= occurrences; month++) {
    out.push({
      label: input.recurrence === 'monthly' ? `Mês ${month}` : 'Pagamento único',
      amount,
      dueDate: endOfMonth(now, month - 1),
    });
  }
  return out;
}
