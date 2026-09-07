import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const secretKey = process.env.JWT_SECRET || 'nex-quotes-super-secret-key-for-clients-2026';
const key = new TextEncoder().encode(secretKey);

// A identidade do Portal do Cliente é o E-MAIL (não um cadastro específico).
// Assim a mesma pessoa que fechou com o dono por empresas/cadastros diferentes
// entra uma vez e vê tudo. A sessão só guarda o e-mail.

export interface ClientSession {
  email: string;
}

export async function encrypt(payload: Record<string, unknown>): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key);
}

export async function decrypt(input: string): Promise<Record<string, unknown>> {
  const { payload } = await jwtVerify(input, key, { algorithms: ['HS256'] });
  return payload as Record<string, unknown>;
}

export async function loginClientByEmail(email: string): Promise<void> {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias
  const session = await encrypt({ email: email.trim().toLowerCase() });
  (await cookies()).set('client_session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function logoutClient(): Promise<void> {
  (await cookies()).set('client_session', '', { expires: new Date(0), path: '/' });
}

export async function getClientSession(): Promise<ClientSession | null> {
  const raw = (await cookies()).get('client_session')?.value;
  if (!raw) return null;
  try {
    const payload = await decrypt(raw);
    if (typeof payload.email === 'string' && payload.email) {
      return { email: payload.email.toLowerCase() };
    }
    // Compat: sessão antiga que guardava clientId — resolve pro e-mail dele.
    if (typeof payload.clientId === 'string') {
      const c = await prisma.client.findUnique({
        where: { id: payload.clientId },
        select: { email: true },
      });
      if (c?.email) return { email: c.email.toLowerCase() };
    }
    return null;
  } catch {
    return null;
  }
}

/** True se algum cadastro de cliente com esse e-mail é dono da proposta. */
export async function clientEmailOwnsProposal(email: string, proposalId: string): Promise<boolean> {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: { client: { select: { email: true } } },
  });
  return Boolean(proposal?.client?.email && proposal.client.email.toLowerCase() === email.toLowerCase());
}
