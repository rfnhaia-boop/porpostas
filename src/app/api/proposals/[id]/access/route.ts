import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';

type Ctx = { params: Promise<{ id: string }> };

// Zera a contagem de acessos do link — o dono "libera de novo" pra reenviar.
export async function POST(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });

  const existing = await prisma.proposal.findFirst({ where: { id, companyId } });
  if (!existing) return Response.json({ error: 'Proposta não encontrada.' }, { status: 404 });

  await prisma.proposal.update({ where: { id }, data: { accessCount: 0 } });
  return Response.json({ ok: true });
}
