import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { unlockCookieName, unlockCookieValue } from '@/lib/proposalUnlock';

// Gate compartilhado entre os dois caminhos de "configurar acesso ao portal"
// (senha em /api/p/[token]/setup-account e Google em /api/portal/auth/google/callback).
//
// Impede que quem só tem o link público:
//  - configure acesso antes de a proposta ser aceita;
//  - configure acesso sem a palavra-chave, quando a proposta tem uma;
//  - reaponte um acesso já configurado pra outra identidade (sequestro do cliente real).

const ACCEPTED = ['approved', 'in_progress', 'delivered'];

export type ClaimCheck =
  | { ok: true; client: { id: string; email: string; portalClaimedAt: Date | null } }
  | { ok: false; status: number; error: string };

/**
 * @param token       publicToken da proposta (já sem o slug)
 * @param identityEmail e-mail (verificado, no caso do Google) que vai virar a identidade do portal
 */
export async function checkPortalClaim(token: string, identityEmail: string): Promise<ClaimCheck> {
  const email = identityEmail.trim().toLowerCase();
  const proposal = await prisma.proposal.findUnique({
    where: { publicToken: token },
    select: {
      status: true,
      accessPhrase: true,
      clientId: true,
      client: { select: { id: true, email: true, portalClaimedAt: true } },
    },
  });

  if (!proposal || !proposal.clientId || !proposal.client) {
    return { ok: false, status: 404, error: 'Proposta inválida ou sem cliente vinculado.' };
  }
  if (!ACCEPTED.includes(proposal.status)) {
    return { ok: false, status: 403, error: 'A proposta ainda não foi aceita.' };
  }
  if (proposal.accessPhrase) {
    const provided = (await cookies()).get(unlockCookieName(token))?.value;
    if (provided !== unlockCookieValue(token, proposal.accessPhrase)) {
      return { ok: false, status: 403, error: 'Abra a proposta com o código de acesso antes de configurar o portal.' };
    }
  }

  const claimedEmail = (proposal.client.email || '').trim().toLowerCase();
  if (proposal.client.portalClaimedAt && claimedEmail && claimedEmail !== email) {
    return { ok: false, status: 409, error: 'Esta proposta já tem um acesso ao portal configurado.' };
  }

  return { ok: true, client: proposal.client };
}
