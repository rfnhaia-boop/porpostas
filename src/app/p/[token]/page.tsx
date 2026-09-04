import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicProposal } from '@/lib/publicProposal';
import { unlockCookieName, unlockCookieValue } from '@/lib/proposalUnlock';
import { DEFAULT_PAYMENT_TERMS, type QuoteView } from '@/lib/quoteView';
import { TemplateRenderer } from '@/components/templates/TemplateRenderer';
import { AccessGate } from './AccessGate';
import { ClientResponse, PrintButton } from './ClientResponse';
import { ViewPing } from './ViewPing';

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const proposal = await getPublicProposal(token);
  const base: Metadata = { robots: { index: false, follow: false } };
  if (!proposal) return { ...base, title: 'Proposta' };
  const who = proposal.client?.name ? ` para ${proposal.client.name}` : '';
  const title = `${proposal.company.name} — Proposta${who}`;
  const description = `Proposta comercial ${proposal.proposalNumber}. Abra para revisar e responder.`;
  return {
    ...base,
    title,
    description,
    openGraph: { title, description, type: 'website' },
  };
}

export default async function PublicProposalPage({ params }: Props) {
  const { token } = await params;
  const proposal = await getPublicProposal(token);
  if (!proposal) notFound();

  const { company, client, items } = proposal;

  // Palavra-chave: se a proposta tem uma e o cookie não confere, mostra o portão.
  if (proposal.accessPhrase) {
    const provided = (await cookies()).get(unlockCookieName(token))?.value;
    if (provided !== unlockCookieValue(token, proposal.accessPhrase)) {
      return (
        <AccessGate
          token={token}
          company={{ name: company.name, logoUrl: company.logoUrl }}
          clientName={client?.name ?? null}
        />
      );
    }
  }

  const q: QuoteView = {
    company: {
      name: company.name,
      cnpj: company.cnpj,
      logoUrl: company.logoUrl,
      email: company.email,
      phone: company.phone,
    },
    client: client
      ? {
          name: client.name,
          company: client.orgName,
          document: client.document,
          email: client.email,
        }
      : null,
    proposalNumber: proposal.proposalNumber,
    validityDays: proposal.validityDays,
    timeline: proposal.timeline,
    paymentTerms: proposal.paymentTerms || DEFAULT_PAYMENT_TERMS,
    notes: proposal.notes,
    items: items.map((it) => ({
      id: it.id,
      name: it.name,
      description: it.description,
      price: it.price,
    })),
    total: items.reduce((sum, it) => sum + it.price, 0),
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <ViewPing token={token} />

      <div className="no-print sticky top-0 z-50 flex items-center justify-between border-b border-black/10 bg-white/85 px-5 py-3 shadow-sm backdrop-blur-xl">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#237153]">
            {company.name}
          </p>
          <p className="text-sm font-semibold text-[#14251f]">
            Proposta {proposal.proposalNumber}
            {client?.name ? ` · ${client.name}` : ''}
          </p>
        </div>
        <PrintButton />
      </div>

      {/* Mesmo template escolhido no preview */}
      <TemplateRenderer template={proposal.template} q={q} />

      <ClientResponse
        token={token}
        initialStatus={proposal.status as 'draft' | 'sent' | 'approved' | 'declined' | 'changes_requested'}
        initialNote={proposal.responseNote}
      />
    </main>
  );
}
