import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';
import { cleanTitle, sanitizeMessages } from '@/lib/ravi/conversation';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const conv = await prisma.haviConversation.findFirst({
    where: { id, companyId },
    select: { id: true, title: true, messages: true, updatedAt: true },
  });
  if (!conv) return Response.json({ error: 'Conversa não encontrada.' }, { status: 404 });
  return Response.json({
    id: conv.id,
    title: conv.title,
    messages: Array.isArray(conv.messages) ? conv.messages : [],
    updatedAt: conv.updatedAt.toISOString(),
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const existing = await prisma.haviConversation.findFirst({ where: { id, companyId }, select: { id: true } });
  if (!existing) return Response.json({ error: 'Conversa não encontrada.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const data: { title?: string; messages?: Prisma.InputJsonValue } = {};
  if (typeof body?.title === 'string') data.title = cleanTitle(body.title);
  if (Array.isArray(body?.messages)) data.messages = sanitizeMessages(body.messages) as Prisma.InputJsonValue;
  if (!Object.keys(data).length) return Response.json({ error: 'Nada pra atualizar.' }, { status: 400 });

  const updated = await prisma.haviConversation.update({
    where: { id },
    data,
    select: { id: true, title: true, updatedAt: true },
  });
  return Response.json({ ...updated, updatedAt: updated.updatedAt.toISOString() });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const existing = await prisma.haviConversation.findFirst({ where: { id, companyId }, select: { id: true } });
  if (!existing) return Response.json({ error: 'Conversa não encontrada.' }, { status: 404 });
  await prisma.haviConversation.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
