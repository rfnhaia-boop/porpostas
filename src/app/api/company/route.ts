import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompany } from '@/lib/company';

export async function GET() {
  const company = await getCurrentCompany();
  if (!company) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  return Response.json(company);
}

export async function PATCH(request: NextRequest) {
  const company = await getCurrentCompany();
  if (!company) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const body = await request.json();
  const data: Record<string, string> = {};
  for (const key of ['name', 'cnpj', 'logoUrl', 'email', 'phone'] as const) {
    if (typeof body[key] === 'string') data[key] = body[key];
  }
  const updated = await prisma.company.update({ where: { id: company.id }, data });
  return Response.json(updated);
}
