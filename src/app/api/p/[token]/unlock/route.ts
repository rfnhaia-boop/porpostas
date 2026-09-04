import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlockCookieName, unlockCookieValue } from '@/lib/proposalUnlock';
import { extractToken } from '@/lib/slug';

type Ctx = { params: Promise<{ token: string }> };

// Público: valida a palavra-chave e libera o acesso (cookie) à proposta.
export async function POST(request: NextRequest, { params }: Ctx) {
  const { token: rawToken } = await params;
  const token = extractToken(rawToken);
  const body = await request.json().catch(() => null);
  const phrase = typeof body?.phrase === 'string' ? body.phrase.trim() : '';

  const proposal = await prisma.proposal.findUnique({
    where: { publicToken: token },
    select: { accessPhrase: true },
  });
  if (!proposal) return Response.json({ error: 'Proposta não encontrada.' }, { status: 404 });
  if (!proposal.accessPhrase) return Response.json({ ok: true }); // link sem trava

  if (phrase.toLowerCase() !== proposal.accessPhrase.trim().toLowerCase()) {
    return Response.json({ error: 'Palavra-chave incorreta.' }, { status: 401 });
  }

  const res = Response.json({ ok: true });
  res.headers.append(
    'Set-Cookie',
    // Path amplo (não o token exato) porque a URL visível pode ter um slug do
    // cliente na frente (/p/ana-ferreira-<token>) — quem isola por proposta é
    // o nome do cookie, que já inclui o token.
    `${unlockCookieName(token)}=${unlockCookieValue(token, proposal.accessPhrase)}; Path=/p; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 45}`,
  );
  return res;
}
