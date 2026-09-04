import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';

export async function GET() {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.notification.count({ where: { companyId, readAt: null } }),
  ]);

  return Response.json({ items, unread });
}

// Marca notificações como lidas. Body { ids?: string[] } — sem ids, marca todas.
export async function PATCH(request: NextRequest) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const ids: unknown = body?.ids;

  await prisma.notification.updateMany({
    where: {
      companyId,
      readAt: null,
      ...(Array.isArray(ids) && ids.length > 0 ? { id: { in: ids.filter((x) => typeof x === 'string') } } : {}),
    },
    data: { readAt: new Date() },
  });

  return Response.json({ ok: true });
}
