import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';
import { cleanTitle, sanitizeMessages } from '@/lib/ravi/conversation';

// Histórico de conversas do Havi (cadastro conversado). Escopo por empresa.

export async function GET() {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const rows = await prisma.haviConversation.findMany({
    where: { companyId },
    orderBy: { updatedAt: 'desc' },
    take: 40,
    select: { id: true, title: true, updatedAt: true },
  });
  return Response.json(rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() })));
}

export async function POST(req: NextRequest) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const messages = sanitizeMessages(body?.messages);
  const created = await prisma.haviConversation.create({
    data: { companyId, title: cleanTitle(body?.title), messages: messages as unknown as Prisma.InputJsonValue },
    select: { id: true, title: true, updatedAt: true },
  });
  return Response.json({ ...created, updatedAt: created.updatedAt.toISOString() }, { status: 201 });
}

