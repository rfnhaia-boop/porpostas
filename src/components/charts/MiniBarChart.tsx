'use client';

import React from 'react';
import type { MonthPoint } from '@/lib/analytics';

export function MiniBarChart({
  data,
  formatValue = (v) => String(v),
}: {
  data: MonthPoint[];
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex items-end justify-between gap-3 h-40 pt-2">
      {data.map((d) => {
        const heightPct = d.value === 0 ? 2 : Math.max(6, Math.round((d.value / max) * 100));
        return (
          <div key={d.key} className="flex-1 flex flex-col items-center gap-2 group">
            <span className="text-[10px] font-bold text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
              {formatValue(d.value)}
            </span>
            <div className="w-full h-32 flex items-end">
              <div
                className="w-full rounded-t-md bg-[#FF6A00] transition-all duration-500"
                style={{ height: `${heightPct}%`, opacity: d.value === 0 ? 0.15 : 0.85 }}
              />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
