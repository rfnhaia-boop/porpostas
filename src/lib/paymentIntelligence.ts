// Inteligência de pontualidade: compara vencimento x data real de pagamento
// pra detectar cliente que atrasa recorrente e sugerir um ajuste.

const CHRONIC_THRESHOLD = 2; // quantas parcelas seguidas atrasadas já conta como padrão

export interface PunctualityInput {
  dueDate: Date | string | null;
  paidAt: Date | string | null;
  status: string; // 'pending' | 'paid'
}

export interface PunctualityResult {
  chronicLate: boolean;
  consecutiveLate: number;
  avgDelayDays: number | null;
  lastDelays: { dueDate: string; delayDays: number }[];
  suggestion: string | null;
}

function toDate(d: Date | string | null): Date | null {
  if (!d) return null;
  return d instanceof Date ? d : new Date(d);
}

function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

/**
 * Recebe o histórico de parcelas de um cliente (de todas as propostas) e
 * detecta se ele tem atrasado de forma recorrente.
 * Só considera parcelas com vencimento definido e já "resolvidas"
 * (pagas, ou pendentes e vencidas — aí contam como atraso em curso).
 */
export function analyzeClientPunctuality(payments: PunctualityInput[]): PunctualityResult {
  const now = new Date();

  const resolved = payments
    .map((p) => {
      const due = toDate(p.dueDate);
      if (!due) return null;
      const paidAt = toDate(p.paidAt);
      if (p.status === 'paid' && paidAt) {
        return { dueDate: due, delayDays: diffDays(paidAt, due) };
      }
      if (p.status !== 'paid' && due < now) {
        return { dueDate: due, delayDays: diffDays(now, due) };
      }
      return null; // ainda não venceu / sem base pra avaliar
    })
    .filter((x): x is { dueDate: Date; delayDays: number } => x !== null)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  let consecutiveLate = 0;
  for (let i = resolved.length - 1; i >= 0; i--) {
    if (resolved[i].delayDays > 0) consecutiveLate++;
    else break;
  }

  const lateStreak = consecutiveLate > 0 ? resolved.slice(resolved.length - consecutiveLate) : [];
  const avgDelayDays =
    lateStreak.length > 0
      ? Math.round(lateStreak.reduce((sum, x) => sum + x.delayDays, 0) / lateStreak.length)
      : null;

  const chronicLate = consecutiveLate >= CHRONIC_THRESHOLD;

  const suggestion = chronicLate
    ? `Esse cliente atrasou as últimas ${consecutiveLate} parcelas (média de ${avgDelayDays} dia${avgDelayDays === 1 ? '' : 's'} de atraso). Vale ajustar o dia de vencimento pra depois do recebimento dele, mandar um lembrete alguns dias antes, ou combinar outra forma de cobrança.`
    : null;

  return {
    chronicLate,
    consecutiveLate,
    avgDelayDays,
    lastDelays: resolved.slice(-6).map((x) => ({ dueDate: x.dueDate.toISOString(), delayDays: x.delayDays })),
    suggestion,
  };
}
