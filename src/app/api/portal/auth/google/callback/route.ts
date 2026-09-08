import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginClientByEmail } from '@/lib/clientAuth';
import { checkPortalClaim } from '@/lib/portalClaim';
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
    if (!profile.email || profile.email_verified === false) throw new Error('Google não retornou e-mail verificado.');
    const email = profile.email.trim().toLowerCase();

    // Vindo da tela de "Sucesso!" (aceitar proposta) — vincula esse Google ao
    // cliente da proposta. Passa pela mesma trava anti-sequestro do setup por senha.
    if (state.startsWith('setup:')) {
      const proposalToken = extractToken(state.slice('setup:'.length));
      const gate = await checkPortalClaim(proposalToken, email);
      if (!gate.ok) {
        const q = gate.status === 409 ? 'already_linked' : gate.status === 403 ? 'not_allowed' : 'invalid_proposal';
        return NextResponse.redirect(new URL(`/portal/login?error=${q}`, req.url));
      }
      await prisma.client.update({
        where: { id: gate.client.id },
        data: { email, portalClaimedAt: gate.client.portalClaimedAt ?? new Date() },
      });
      await loginClientByEmail(email);
      return NextResponse.redirect(new URL('/portal', req.url));
    }

    // Login normal — só entra quem já configurou o acesso ao portal com esse e-mail.
    const client = await prisma.client.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, portalClaimedAt: { not: null } },
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
