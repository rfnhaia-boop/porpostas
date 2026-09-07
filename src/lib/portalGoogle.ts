// OAuth do Google pro Portal do Cliente — sistema de login separado do dono
// (que usa Better Auth). Reaproveita o mesmo Client ID/Secret do .env, só
// muda o redirect URI (precisa estar cadastrado no Google Cloud Console).

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
): Promise<{ access_token: string; id_token?: string }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) throw new Error('Falha ao trocar código com o Google.');
  return res.json();
}

export async function fetchGoogleProfile(
  accessToken: string,
): Promise<{ email: string; name?: string; email_verified?: boolean }> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Falha ao buscar perfil do Google.');
  return res.json();
}
