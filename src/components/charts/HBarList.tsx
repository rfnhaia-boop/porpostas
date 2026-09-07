'use client';

import React from 'react';

// Lista de barras horizontais: rótulo + barra proporcional + valor à direita.
export function HBarList({
  items,
  empty = 'Sem dados ainda.',
}: {
  items: { label: string; value: number; display: string; sub?: string }[];
  empty?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">{empty}</p>;
  }
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="space-y-3.5">
      {items.map((it, i) => (
        <div key={`${it.label}-${i}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-xs font-bold text-[var(--foreground)]">
              {it.label}
              {it.sub && <span className="ml-1.5 font-normal text-[var(--text-muted)]">{it.sub}</span>}
            </span>
            <span className="shrink-0 text-xs font-black tabular-nums text-[var(--foreground)]">
              {it.display}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--border-color)]/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF6A00]/60 to-[#FF6A00] transition-[width] duration-500"
              style={{ width: `${Math.max(4, (it.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
