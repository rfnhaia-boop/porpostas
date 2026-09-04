import { prisma } from './prisma';

/** Busca uma proposta pelo token público. Sem auth — o token é a credencial. */
export async function getPublicProposal(token: string) {
  return prisma.proposal.findUnique({
    where: { publicToken: token },
    include: {
      items: true,
      client: true,
      company: { select: { name: true, cnpj: true, email: true, phone: true, logoUrl: true } },
    },
  });
}

export type PublicProposal = NonNullable<Awaited<ReturnType<typeof getPublicProposal>>>;
