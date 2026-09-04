import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicProposal } from '@/lib/publicProposal';
import { formatBRL as money } from '@/lib/money';
import { ClientResponse, PrintButton } from './ClientResponse';
import { ViewPing } from './ViewPing';

export const metadata: Metadata = {
  title: 'Proposta',
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

export default async function PublicProposalPage({ params }: Props) {
  const { token } = await params;
  const proposal = await getPublicProposal(token);
  if (!proposal) notFound();

  const { company, client, items } = proposal;
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const paymentTerms = proposal.paymentTerms || '50% na aprovação e 50% na entrega';

  return (
    <main className="public-quote min-h-screen bg-[#e9eeea] px-4 py-8 text-[#14251f] md:px-8 md:py-14">
      <ViewPing token={token} />
      <div className="no-print mx-auto mb-5 flex max-w-5xl items-center justify-between rounded-2xl border border-black/10 bg-white/75 px-5 py-3 shadow-sm backdrop-blur-xl">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#237153]">Área segura do cliente</p>
          <p className="text-sm font-semibold">Orçamento {proposal.proposalNumber}</p>
        </div>
        <PrintButton />
      </div>

      <article className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-[#fffefa] shadow-[0_30px_90px_rgba(16,47,37,.16)] print:rounded-none print:shadow-none">
        <header className="grid gap-12 bg-[#153c2f] p-8 text-white md:grid-cols-[1fr_auto] md:p-14">
          <div>
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[.3em] text-[#9ee2bd]">Proposta de valor</p>
            <h1 className="max-w-xl font-serif text-5xl leading-[.95] tracking-[-.04em] md:text-7xl">
              Uma entrega<br />bem combinada.
            </h1>
          </div>
          <div className="self-end md:text-right">
            <p className="text-xl font-black uppercase">{company.name}</p>
            {company.cnpj && <p className="mt-2 text-sm text-white/75">{company.cnpj}</p>}
            {company.email && <p className="text-sm text-white/75">{company.email}</p>}
          </div>
        </header>

        <section className="grid gap-8 border-b border-black/10 p-8 md:grid-cols-[1fr_auto] md:p-14">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.22em] text-black/60">Preparado para</p>
            <h2 className="mt-2 text-3xl font-bold">{client?.name ?? '—'}</h2>
            <p className="mt-1 text-black/70">{client?.orgName || client?.document || ''}</p>
          </div>
          <div className="grid grid-cols-3 gap-8 text-sm">
            <p>
              <span className="block text-[9px] font-bold uppercase tracking-[.18em] text-black/40">Validade</span>
              {proposal.validityDays}
            </p>
            <p>
              <span className="block text-[9px] font-bold uppercase tracking-[.18em] text-black/40">Prazo</span>
              {proposal.timeline}
            </p>
            <p>
              <span className="block text-[9px] font-bold uppercase tracking-[.18em] text-black/40">Pagamento</span>
              {paymentTerms}
            </p>
          </div>
        </section>

        <section className="p-8 md:p-14">
          <div className="mb-2 grid grid-cols-[1fr_auto] border-b border-black/20 pb-3 text-[9px] font-bold uppercase tracking-[.2em] text-black/60">
            <span>Escopo</span>
            <span>Investimento</span>
          </div>
          {items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-[1fr_auto] gap-6 border-b border-black/10 py-6">
              <div>
                <p className="mb-1 text-xs font-bold text-[#176044]">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="text-xl font-bold">{item.name}</h3>
                {item.description && (
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-black/70">{item.description}</p>
                )}
              </div>
              <strong className="text-lg">{money(item.price)}</strong>
            </div>
          ))}
          <div className="mt-10 grid gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[.2em] text-black/40">Condições</p>
              <p className="max-w-xl whitespace-pre-wrap text-sm leading-6 text-black/55">{proposal.notes}</p>
            </div>
            <div className="rounded-2xl bg-[#e5eee8] px-7 py-6 text-right">
              <p className="text-[9px] font-bold uppercase tracking-[.2em] text-black/40">Total</p>
              <strong className="text-4xl tracking-tight text-[#153c2f]">{money(total)}</strong>
            </div>
          </div>
        </section>

        <ClientResponse
          token={token}
          initialStatus={proposal.status as 'draft' | 'sent' | 'approved' | 'declined'}
          initialNote={proposal.responseNote}
        />
      </article>
    </main>
  );
}
