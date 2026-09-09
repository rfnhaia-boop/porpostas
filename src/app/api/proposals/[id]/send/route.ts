import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';
import { mailProposalSent } from '@/lib/mailer';
import { isEmail } from '@/lib/email';

type Ctx = { params: Promise<{ id: string }> };

// Dispara (ou re-dispara) o e-mail da proposta PRO CLIENTE — com link, código de
// acesso e a mensagem padrão. Chamado pelo botão "Enviar" e pelo "E-mail" do
// modal de compartilhar.
export async function POST(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });

  const proposal = await prisma.proposal.findFirst({
    where: { id, companyId },
    select: { id: true, status: true, client: { select: { email: true } } },
  });
  if (!proposal) return Response.json({ error: 'Proposta não encontrada.' }, { status: 404 });

  const to = proposal.client?.email ?? '';
  if (!isEmail(to)) {
    return Response.json(
      { error: 'O cliente desta proposta não tem e-mail cadastrado.' },
      { status: 400 },
    );
  }

  // Se ainda era rascunho, marca como enviada.
  if (proposal.status === 'draft') {
    await prisma.proposal.update({ where: { id }, data: { status: 'sent' } });
  }

  const ok = await mailProposalSent(id);
  if (!ok) {
    return Response.json(
      { error: 'Não consegui enviar o e-mail agora. Confira o e-mail do cliente e tente de novo.' },
      { status: 502 },
    );
  }
  return Response.json({ ok: true, to });
}
