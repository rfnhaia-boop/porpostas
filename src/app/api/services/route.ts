import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';
import { parseCatalogFields } from '@/lib/catalog';

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
  const fields = parseCatalogFields(body);
  const service = await prisma.service.create({
    data: {
      companyId,
      billingType: (fields.billingType as string) ?? 'once',
      name: (fields.name as string) || body.name,
      description: (fields.description as string) ?? '',
      kind: (fields.kind as string) ?? 'service',
      unitLabel: (fields.unitLabel as string) ?? 'projeto',
      price: (fields.price as number) ?? 0,
      details: (fields.details as string[]) ?? [],
      defaultStages: (fields.defaultStages as string[]) ?? [],
      defaultTimeline: (fields.defaultTimeline as string) ?? '',
      minCommitment: (fields.minCommitment as string) ?? '',
    },
  });
  return Response.json(service, { status: 201 });
}
