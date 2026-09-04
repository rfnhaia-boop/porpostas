import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlockCookieName, unlockCookieValue } from '@/lib/proposalUnlock';

type Ctx = { params: Promise<{ token: string }> };

// Público: valida a palavra-chave e libera o acesso (cookie) à proposta.
export async function POST(request: NextRequest, { params }: Ctx) {
  const { token } = await params;
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
    `${unlockCookieName(token)}=${unlockCookieValue(token, proposal.accessPhrase)}; Path=/p/${token}; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 45}`,
  );
  return res;
}
