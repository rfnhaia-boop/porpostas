'use client';

import React from 'react';
import type { MonthPoint } from '@/lib/analytics';

// Gráfico de barras em CSS puro. Valor sempre visível em cima da barra
// (não some no mobile), linha tracejada da média e mês sem dado marcado
// como tracinho — pra não parecer bug quando só um mês tem valor.
export function MiniBarChart({
  data,
  formatValue = (v) => String(v),
  labelFormat,
}: {
  data: MonthPoint[];
  formatValue?: (v: number) => string;
  labelFormat?: (v: number) => string;
}) {
  const label = labelFormat ?? formatValue;
  const values = data.map((d) => d.value);
  const max = Math.max(1, ...values);
  const nonZero = values.filter((v) => v > 0);
  // Só faz sentido mostrar "média" com 2+ meses de dado.
  const avg = nonZero.length >= 2 ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0;
  const avgPct = Math.min(100, (avg / max) * 100);

  return (
    <div className="w-full">
      <div className="relative flex items-end justify-between gap-1.5 sm:gap-3 h-44">
        {avg > 0 && (
          <div
            className="pointer-events-none absolute inset-x-0 flex items-center gap-2"
            style={{ bottom: `calc(1.25rem + (100% - 2.75rem) * ${avgPct / 100})` }}
          >
            <div className="flex-1 border-t border-dashed border-[var(--text-muted)]/40" />
            <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-muted)]/60">
              média
            </span>
          </div>
        )}

        {data.map((d) => {
          const pct = (d.value / max) * 100;
          const zero = d.value === 0;
          return (
            <div
              key={d.key}
              className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              title={formatValue(d.value)}
            >
              <span
                className={`tabular-nums text-[10px] font-bold sm:text-xs ${
                  zero ? 'text-[var(--text-muted)]/40' : 'text-[var(--foreground)]'
                }`}
              >
                {zero ? '–' : label(d.value)}
              </span>
              <div className="flex min-h-0 w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-[#FF6A00]/60 to-[#FF6A00] transition-[height] duration-500 group-hover:from-[#FF6A00]/80"
                  style={{ height: zero ? '3px' : `max(8px, ${pct}%)` }}
                />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
