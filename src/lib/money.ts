// Dinheiro é sempre guardado e trafegado em CENTAVOS (inteiro).
// Converta só na borda: entrada do usuário (reais → centavos) e exibição (centavos → texto).

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Centavos (inteiro) → "R$ 1.234,56" */
export function formatBRL(cents: number): string {
  return BRL.format((Number(cents) || 0) / 100);
}

/** Reais (o que o usuário digita) → centavos inteiro. */
export function toCents(reais: number | string): number {
  const n = typeof reais === 'string' ? Number(reais.replace(',', '.')) : reais;
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** Centavos → número em reais (para preencher um input de edição). */
export function toReais(cents: number): number {
  return (Number(cents) || 0) / 100;
}
