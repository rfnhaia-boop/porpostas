import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';
import { EMAIL_TEMPLATES } from '@/lib/emailTemplates';

type Ctx = { params: Promise<{ key: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const { key } = await params;
  if (!(key in EMAIL_TEMPLATES)) return Response.json({ error: 'E-mail inválido.' }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const data: { subject?: string; title?: string; body?: string; enabled?: boolean } = {};
  if (typeof body.subject === 'string') data.subject = body.subject.slice(0, 300);
  if (typeof body.title === 'string') data.title = body.title.slice(0, 300);
  if (typeof body.body === 'string') data.body = body.body.slice(0, 4000);
  if (typeof body.enabled === 'boolean') data.enabled = body.enabled;

  const saved = await prisma.emailTemplate.upsert({
    where: { companyId_key: { companyId, key } },
    create: { companyId, key, ...data },
    update: data,
  });
  return Response.json(saved);
}

// Volta pro padrão do código (apaga o override).
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const { key } = await params;
  await prisma.emailTemplate.deleteMany({ where: { companyId, key } });
  return new Response(null, { status: 204 });
}
