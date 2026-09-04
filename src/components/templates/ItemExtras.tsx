import React from 'react';
import { itemUnitLine, type QuoteViewItem } from '@/lib/quoteView';

/** Linha "2 kg × R$ 15,00" + bullets de detalhes de um item. */
export function ItemExtras({
  item,
  money,
  tone = 'light',
}: {
  item: QuoteViewItem;
  money: (cents: number) => string;
  tone?: 'light' | 'dark';
}) {
  const line = itemUnitLine(item, money);
  const details = item.details ?? [];
  if (!line && details.length === 0) return null;

  const muted = tone === 'dark' ? 'text-white/45 print:text-black/55' : 'text-black/50';

  return (
    <>
      {line && <p className={`mt-1.5 font-grotesque text-xs ${muted}`}>{line}</p>}
      {details.length > 0 && (
        <ul className={`mt-2 space-y-1 text-xs ${muted}`}>
          {details.map((d, i) => (
            <li key={i} className="flex gap-2">
              <span className="shrink-0">·</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
