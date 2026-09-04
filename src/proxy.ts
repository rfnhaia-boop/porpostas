import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const AUTH_PATHS = ['/login', '/signup'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
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
  // Fora: rotas de API (fazem seu próprio 401), assets do Next, e a proposta pública /p/<token>.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|p/).*)'],
};
