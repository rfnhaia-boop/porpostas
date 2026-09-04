import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const existing = await prisma.client.findFirst({ where: { id, companyId } });
  if (!existing) return Response.json({ error: 'Cliente não encontrado.' }, { status: 404 });

  const body = await request.json();
  const data: Record<string, string> = {};
  for (const key of ['name', 'orgName', 'document', 'email'] as const) {
    if (typeof body[key] === 'string') data[key] = body[key];
  }
  const updated = await prisma.client.update({ where: { id }, data });
  return Response.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const existing = await prisma.client.findFirst({ where: { id, companyId } });
  if (!existing) return Response.json({ error: 'Cliente não encontrado.' }, { status: 404 });

  await prisma.client.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
