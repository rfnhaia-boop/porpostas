import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginClientByEmail } from '@/lib/clientAuth';
import { exchangeGoogleCode, fetchGoogleProfile } from '@/lib/portalGoogle';
import { extractToken } from '@/lib/slug';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state') || '';

  if (!code) {
    return NextResponse.redirect(new URL('/portal/login?error=google_cancelled', req.url));
  }

  try {
    const redirectUri = `${req.nextUrl.origin}/api/portal/auth/google/callback`;
    const tokens = await exchangeGoogleCode(code, redirectUri);
    const profile = await fetchGoogleProfile(tokens.access_token);
    if (!profile.email) throw new Error('Google não retornou e-mail.');
    const email = profile.email.trim().toLowerCase();

    // Vindo da tela de "Sucesso!" (aceitar proposta) — vincula esse Google
    // ao cliente da proposta, sem precisar criar senha.
    if (state.startsWith('setup:')) {
      const proposalToken = extractToken(state.slice('setup:'.length));
      const proposal = await prisma.proposal.findUnique({ where: { publicToken: proposalToken } });
      if (!proposal || !proposal.clientId) {
        return NextResponse.redirect(new URL('/portal/login?error=invalid_proposal', req.url));
      }
      await prisma.client.update({ where: { id: proposal.clientId }, data: { email } });
      await loginClientByEmail(email);
      return NextResponse.redirect(new URL('/portal', req.url));
    }

    // Login normal — basta existir algum cadastro de cliente com esse e-mail.
    const client = await prisma.client.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (!client) {
      return NextResponse.redirect(new URL('/portal/login?error=not_found', req.url));
    }
    await loginClientByEmail(email);
    return NextResponse.redirect(new URL('/portal', req.url));
  } catch {
    return NextResponse.redirect(new URL('/portal/login?error=google_failed', req.url));
  }
}
