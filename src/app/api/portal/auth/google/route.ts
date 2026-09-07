import { NextRequest, NextResponse } from 'next/server';
import { buildGoogleAuthUrl, googleConfigured } from '@/lib/portalGoogle';

// GET /api/portal/auth/google?token=<proposalToken opcional>
// Sem token: login normal do cliente que já tem conta.
// Com token: veio da tela "Sucesso!" (setup-account) — vincula esse Google
// ao cliente da proposta em vez de criar senha.
export async function GET(req: NextRequest) {
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL('/portal/login?error=google_not_configured', req.url));
  }
  const token = req.nextUrl.searchParams.get('token') || '';
  const redirectUri = `${req.nextUrl.origin}/api/portal/auth/google/callback`;
  const state = token ? `setup:${token}` : 'login';
  return NextResponse.redirect(buildGoogleAuthUrl(redirectUri, state));
}
