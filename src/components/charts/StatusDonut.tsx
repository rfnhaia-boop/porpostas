'use client';

import React from 'react';
import type { StatusSlice } from '@/lib/analytics';

// Rosca em SVG puro (sem lib). Cada fatia é um trecho de stroke do círculo.
export function StatusDonut({ slices }: { slices: StatusSlice[] }) {
  const total = slices.reduce((s, x) => s + x.count, 0);
  const R = 56;
  const C = 2 * Math.PI * R;
  const SW = 20;

  let acc = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
      <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0">
        <g transform="rotate(-90 70 70)">
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth={SW}
            opacity={0.35}
          />
          {total > 0 &&
            slices.map((s) => {
              const len = (s.count / total) * C;
              const dash = `${len} ${C - len}`;
              const offset = -acc;
              acc += len;
              return (
                <circle
                  key={s.key}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={SW}
                  strokeDasharray={dash}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                />
              );
            })}
        </g>
        <text
          x="70"
          y="70"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-[var(--foreground)] font-black"
          fontSize="30"
        >
          {total}
        </text>
      </svg>

      <div className="grid w-full grid-cols-1 gap-2 sm:min-w-[180px]">
        {slices.map((s) => (
          <div key={s.key} className="flex items-center gap-2.5 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="flex-1 text-[var(--text-muted)]">{s.label}</span>
            <span className="font-bold tabular-nums text-[var(--foreground)]">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
