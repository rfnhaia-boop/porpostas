import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlockCookieName, unlockCookieValue } from '@/lib/proposalUnlock';
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

  // Esse aparelho já tinha liberado antes? Então não gasta vaga nova.
  const cookieValue = unlockCookieValue(token, proposal.accessPhrase);
  const alreadyUnlocked = request.cookies.get(unlockCookieName(token))?.value === cookieValue;

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
  res.headers.append(
    'Set-Cookie',
    // Path amplo (não o token exato) porque a URL visível pode ter um slug do
    // cliente na frente (/p/ana-ferreira-<token>) — quem isola por proposta é
    // o nome do cookie, que já inclui o token.
    `${unlockCookieName(token)}=${cookieValue}; Path=/p; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 45}`,
  );
  return res;
}
