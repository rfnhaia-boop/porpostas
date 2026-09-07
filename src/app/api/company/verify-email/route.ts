import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getCurrentCompany } from '@/lib/company';
import { appUrl, isEmail } from '@/lib/email';
import { mailVerifyCompanyEmail } from '@/lib/mailer';

// POST (autenticado): reenvia o e-mail de confirmação pro e-mail atual da empresa.
export async function POST() {
  const company = await getCurrentCompany();
  if (!company) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  if (!isEmail(company.email)) {
    return Response.json({ error: 'Preencha um e-mail válido primeiro.' }, { status: 400 });
  }
  const token = randomBytes(24).toString('hex');
  await prisma.company.update({
    where: { id: company.id },
    data: { emailVerified: false, emailVerifyToken: token },
  });
  void mailVerifyCompanyEmail(company.email, token, company.name || 'sua empresa');
  return Response.json({ ok: true });
}

// Público: o link que vai no e-mail de confirmação. O token é a credencial.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim();
  if (!token) return Response.redirect(appUrl('/settings?email=erro'));

  const company = await prisma.company.findFirst({
    where: { emailVerifyToken: token },
    select: { id: true },
  });
  if (!company) return Response.redirect(appUrl('/settings?email=erro'));

  await prisma.company.update({
    where: { id: company.id },
    data: { emailVerified: true, emailVerifyToken: '' },
  });
  return Response.redirect(appUrl('/settings?email=confirmado'));
}
