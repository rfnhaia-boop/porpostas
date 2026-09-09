'use client';
import { useState } from 'react';
import type { QuoteView } from '@/lib/quoteView';
import { TemplateRenderer } from '@/components/templates/TemplateRenderer';
import { CommercialChoices } from '@/components/CommercialChoices';
import { ClientResponse } from './ClientResponse';

export function CommercialProposal({ initial, template, token, status, note, revision }: { initial: QuoteView; template: string; token: string; status: string; note: string | null; revision: string }) {
  const [q, setQ] = useState(initial);
  const locked = ['approved', 'in_progress', 'delivered'].includes(status);
  return <><div className="p-4 sm:p-8"><CommercialChoices q={q} disabled={locked} onChange={(commercial, ids) => setQ({ ...q, commercial, items: q.items.map(i => ({ ...i, selected: i.optional ? ids.includes(i.id) : true })) })}/></div><TemplateRenderer q={q} template={template}/><ClientResponse token={token} initialStatus={status as 'draft' | 'sent' | 'approved' | 'declined' | 'changes_requested'} initialNote={note} locked={locked} selection={{ selectedPackage: q.commercial?.selectedPackage ?? '', optionalIds: q.items.filter(i => i.optional && i.selected).map(i => i.id), revision }}/></>;
}
