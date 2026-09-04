import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';

export async function GET() {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const services = await prisma.service.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
  });
  return Response.json(services);
}

export async function POST(request: NextRequest) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const body = await request.json();
  if (!body?.name || typeof body.name !== 'string') {
    return Response.json({ error: 'Nome é obrigatório.' }, { status: 400 });
  }
  const price = Number(body.price);
  const service = await prisma.service.create({
    data: {
      companyId,
      name: body.name,
      description: typeof body.description === 'string' ? body.description : '',
      price: Number.isFinite(price) ? price : 0,
    },
  });
  return Response.json(service, { status: 201 });
}
