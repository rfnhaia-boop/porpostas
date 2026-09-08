import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const AUTH_PATHS = ['/login', '/signup'];
// Páginas públicas sem guard (marketing, jurídico, tela de consentimento do Google, logos enviadas, etc.)
const PUBLIC_PATHS = ['/landing', '/privacidade', '/termos', '/uploads'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }
  const isAuthPage = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const hasSession = Boolean(getSessionCookie(req));

  if (!hasSession && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Fora do guard do dono: rotas de API (fazem seu próprio 401), assets do Next,
  // a proposta pública /p/<token> e o Portal do Cliente /portal (auth própria via client_session).
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|p/|portal).*)'],
};
