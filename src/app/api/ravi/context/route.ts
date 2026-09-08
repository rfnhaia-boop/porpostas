import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompany } from '@/lib/company';

// Contexto da empresa que o Havi usa em toda conversa.
// GET: lê o atual. PUT: salva/edita (o dono confirma o rascunho da conversa de descoberta).
export async function GET() {
  const company = await getCurrentCompany();
  if (!company) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  return Response.json({
    context: company.haviContext ?? '',
    contextAt: company.haviContextAt ? company.haviContextAt.toISOString() : null,
  });
}

export async function PUT(request: NextRequest) {
  const company = await getCurrentCompany();
  if (!company) return Response.json({ error: 'Não autenticado.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const context = typeof body?.context === 'string' ? body.context.trim().slice(0, 4000) : null;
  if (context === null) return Response.json({ error: 'Envio inválido.' }, { status: 400 });

  const log =
    typeof body?.log === 'string' && body.log.length <= 20000 ? body.log : undefined;

  const updated = await prisma.company.update({
    where: { id: company.id },
    data: {
      haviContext: context,
      haviContextAt: context ? new Date() : null,
      ...(log !== undefined ? { haviOnboardingLog: log } : {}),
    },
  });

  return Response.json({
    context: updated.haviContext,
    contextAt: updated.haviContextAt ? updated.haviContextAt.toISOString() : null,
  });
}
