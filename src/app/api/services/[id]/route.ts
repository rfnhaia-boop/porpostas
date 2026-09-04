import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const existing = await prisma.service.findFirst({ where: { id, companyId } });
  if (!existing) return Response.json({ error: 'Serviço não encontrado.' }, { status: 404 });

  const body = await request.json();
  const data: Record<string, string | number> = {};
  if (typeof body.name === 'string') data.name = body.name;
  if (typeof body.description === 'string') data.description = body.description;
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (Number.isFinite(price)) data.price = price;
  }
  const updated = await prisma.service.update({ where: { id }, data });
  return Response.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const existing = await prisma.service.findFirst({ where: { id, companyId } });
  if (!existing) return Response.json({ error: 'Serviço não encontrado.' }, { status: 404 });

  await prisma.service.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
