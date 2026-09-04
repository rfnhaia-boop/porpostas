import { headers } from 'next/headers';
import { auth } from './auth';
import { prisma } from './prisma';

type SessionUser = {
  id: string;
  email: string;
  name: string;
  companyId: string | null;
};

/** Usuário da sessão atual, ou null se não autenticado. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const u = session.user as { id: string; email: string; name: string; companyId?: string | null };
  return { id: u.id, email: u.email, name: u.name, companyId: u.companyId ?? null };
}

/** companyId do tenant atual, ou null se não autenticado. */
export async function getCurrentCompanyId(): Promise<string | null> {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.companyId) return user.companyId;
  // fallback defensivo: relê do banco
  const row = await prisma.user.findUnique({ where: { id: user.id }, select: { companyId: true } });
  return row?.companyId ?? null;
}

/** Company do tenant atual, ou null. */
export async function getCurrentCompany() {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return null;
  return prisma.company.findUnique({ where: { id: companyId } });
}
