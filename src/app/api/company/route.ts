import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getCurrentCompany } from '@/lib/company';
import { isEmail } from '@/lib/email';
import { mailVerifyCompanyEmail } from '@/lib/mailer';

export async function GET() {
  const company = await getCurrentCompany();
  if (!company) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const { emailVerifyToken: _t, ...safe } = company;
  void _t;
  return Response.json(safe);
}

export async function PATCH(request: NextRequest) {
  const company = await getCurrentCompany();
  if (!company) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const body = await request.json();
  const data: Record<string, string | boolean> = {};
  for (const key of [
    'name',
    'cnpj',
    'logoUrl',
    'email',
    'phone',
    'pixKey',
    'pixReceiverName',
    'pixReceiverCity',
  ] as const) {
    if (typeof body[key] === 'string') data[key] = body[key].trim();
  }
  if (typeof body.pixKeyType === 'string') {
    const t = body.pixKeyType.trim();
    data.pixKeyType = ['cpf', 'cnpj', 'email', 'phone', 'random'].includes(t) ? t : '';
  }

  // Trocou o e-mail? Precisa confirmar de novo — gera token e dispara o e-mail.
  let verifyEmailTarget: string | null = null;
  if (typeof data.email === 'string' && data.email !== (company.email ?? '')) {
    data.emailVerified = false;
    if (isEmail(data.email)) {
      data.emailVerifyToken = randomBytes(24).toString('hex');
      verifyEmailTarget = data.email;
    } else {
      data.emailVerifyToken = '';
    }
  }

  const updated = await prisma.company.update({ where: { id: company.id }, data });

  if (verifyEmailTarget && updated.emailVerifyToken) {
    void mailVerifyCompanyEmail(verifyEmailTarget, updated.emailVerifyToken, updated.name || 'sua empresa');
  }

  const { emailVerifyToken: _t, ...safe } = updated;
  void _t;
  return Response.json(safe);
}
