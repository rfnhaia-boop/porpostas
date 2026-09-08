import { commercialRevision } from '@/lib/commercialServer';
import { parseCommercial } from '@/lib/commercial';
import { CommercialProposal } from './CommercialProposal';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicProposal } from '@/lib/publicProposal';
import { extractToken } from '@/lib/slug';
import { unlockCookieName, unlockCookieValue } from '@/lib/proposalUnlock';
import { DEFAULT_PAYMENT_TERMS, type QuoteView } from '@/lib/quoteView';
import { TemplateRenderer } from '@/components/templates/TemplateRenderer';
import { AccessGate } from './AccessGate';
import { AccessLocked } from './AccessLocked';
import { ClientResponse, PrintButton } from './ClientResponse';
import { ViewPing } from './ViewPing';

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token: rawToken } = await params;
  const token = extractToken(rawToken);
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
  const { token: rawToken } = await params;
  const token = extractToken(rawToken);
  const proposal = await getPublicProposal(token);
  if (!proposal) notFound();

  const { company, client, items } = proposal;

  // Código de acesso: se a proposta tem um e o cookie não confere, mostra o
  // portão — ou a tela de "já capturada" quando o limite de vagas estourou.
  if (proposal.accessPhrase) {
    const provided = (await cookies()).get(unlockCookieName(token))?.value;
    if (provided !== unlockCookieValue(token, proposal.accessPhrase)) {
      if (proposal.accessCount >= proposal.maxAccesses) {
        return <AccessLocked company={{ name: company.name, logoUrl: company.logoUrl }} />;
      }
      return (
        <AccessGate
          token={token}
          company={{ name: company.name, logoUrl: company.logoUrl }}
          clientName={client?.name ?? null}
        />
      );
    }
  }

  // Modelo comercial corrompido não pode derrubar a proposta inteira (500) —
  // degrada pra proposta sem modelo comercial.
  let parsedCommercial: QuoteView['commercial'] = null;
  try {
    parsedCommercial = parseCommercial(proposal.commercial);
  } catch (err) {
    console.error('[p/token] commercial inválido:', err);
  }

  const q: QuoteView = {
    commercial: parsedCommercial,
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
    items: [...items].sort((a, b) => a.order - b.order).map((it) => ({
      billingType: it.billingType, optional: it.optional, selected: it.selected, packageId: it.packageId,
      id: it.id,
      name: it.name,
      description: it.description,
      details: it.details ?? [],
      unitLabel: it.unitLabel ?? 'un',
      quantity: it.quantity ?? 1,
      unitPrice: it.unitPrice ?? it.price,
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
      {q.commercial ? <CommercialProposal initial={q} template={proposal.template} token={token} status={proposal.status} note={proposal.responseNote} revision={commercialRevision(proposal)} /> : <>
      <TemplateRenderer template={proposal.template} q={q} />

      <ClientResponse
        token={token}
        initialStatus={proposal.status as 'draft' | 'sent' | 'approved' | 'declined' | 'changes_requested'}
        initialNote={proposal.responseNote}
      />
      </>}
    </main>
  );
}
