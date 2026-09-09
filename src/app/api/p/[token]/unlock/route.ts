import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlockCookieName, legacyUnlockCookieName, unlockCookieValue } from '@/lib/proposalUnlock';
import { extractToken } from '@/lib/slug';

type Ctx = { params: Promise<{ token: string }> };

// Público: valida o código de acesso e libera a proposta (cookie), respeitando
// o limite de "vagas" (maxAccesses). Cada aparelho novo que abre gasta 1 vaga.
export async function POST(request: NextRequest, { params }: Ctx) {
  const { token: rawToken } = await params;
  const token = extractToken(rawToken);
  const body = await request.json().catch(() => null);
  const phrase = typeof body?.phrase === 'string' ? body.phrase.trim() : '';

  const proposal = await prisma.proposal.findUnique({
    where: { publicToken: token },
    select: { accessPhrase: true, maxAccesses: true, accessCount: true },
  });
  if (!proposal) return Response.json({ error: 'Proposta não encontrada.' }, { status: 404 });
  if (!proposal.accessPhrase) return Response.json({ ok: true }); // link sem trava

  if (phrase.toLowerCase() !== proposal.accessPhrase.trim().toLowerCase()) {
    return Response.json({ error: 'Palavra de acesso incorreta.' }, { status: 401 });
  }

  // Esse aparelho já tinha liberado antes (cookie novo OU o antigo Path=/p)?
  // Então não gasta vaga nova — só reemite o cookie no path certo.
  const cookieValue = unlockCookieValue(token, proposal.accessPhrase);
  const alreadyUnlocked =
    request.cookies.get(unlockCookieName(token))?.value === cookieValue ||
    request.cookies.get(legacyUnlockCookieName(token))?.value === cookieValue;

  if (!alreadyUnlocked) {
    if (proposal.accessCount >= proposal.maxAccesses) {
      return Response.json(
        { error: 'Esta proposta já foi aberta pelo limite de pessoas.', locked: true },
        { status: 403 },
      );
    }
    await prisma.proposal.update({
      where: { publicToken: token },
      data: { accessCount: { increment: 1 } },
    });
  }

  const res = Response.json({ ok: true });
  // Path=/ porque o cookie precisa chegar tanto na página (/p/...) quanto na API
  // de resposta (/api/p/.../respond). Com Path=/p a proposta abria mas o aceite
  // dava "informe o código de acesso". A isolação por proposta é feita pelo NOME
  // do cookie, que já inclui o token.
  res.headers.append(
    'Set-Cookie',
    `${unlockCookieName(token)}=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 45}`,
  );
  // Expira o cookie antigo (Path=/p) pra não ficar 45 dias sobrando.
  res.headers.append('Set-Cookie', `${legacyUnlockCookieName(token)}=; Path=/p; Max-Age=0`);
  return res;
}
