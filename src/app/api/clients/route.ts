import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';

export async function GET() {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const clients = await prisma.client.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
  });
  return Response.json(clients);
}

export async function POST(request: NextRequest) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const body = await request.json();
  if (!body?.name || typeof body.name !== 'string') {
    return Response.json({ error: 'Nome é obrigatório.' }, { status: 400 });
  }
  const client = await prisma.client.create({
    data: {
      companyId,
      name: body.name,
      orgName: typeof body.orgName === 'string' ? body.orgName : '',
      document: typeof body.document === 'string' ? body.document : '',
      email: typeof body.email === 'string' ? body.email : '',
    },
  });
  return Response.json(client, { status: 201 });
}
