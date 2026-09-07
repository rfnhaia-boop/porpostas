import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';
import { WHATSAPP_TEMPLATES } from '@/lib/whatsappTemplates';

type Ctx = { params: Promise<{ key: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const { key } = await params;
  if (!(key in WHATSAPP_TEMPLATES)) return Response.json({ error: 'Mensagem inválida.' }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const data: { body?: string; enabled?: boolean } = {};
  if (typeof body.body === 'string') data.body = body.body.slice(0, 4000);
  if (typeof body.enabled === 'boolean') data.enabled = body.enabled;

  const saved = await prisma.whatsappTemplate.upsert({
    where: { companyId_key: { companyId, key } },
    create: { companyId, key, ...data },
    update: data,
  });
  return Response.json(saved);
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const { key } = await params;
  await prisma.whatsappTemplate.deleteMany({ where: { companyId, key } });
  return new Response(null, { status: 204 });
}
