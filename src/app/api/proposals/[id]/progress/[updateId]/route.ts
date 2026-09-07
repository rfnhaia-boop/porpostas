import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';
import { mailProjectUpdate } from '@/lib/mailer';

type Ctx = { params: Promise<{ id: string; updateId: string }> };

async function loadOwned(id: string, updateId: string) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return null;
  const update = await prisma.progressUpdate.findFirst({
    where: { id: updateId, proposalId: id, proposal: { companyId } },
    select: { id: true },
  });
  return update;
}

// Edita o resumo do mês e/ou substitui a lista de entregas.
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id, updateId } = await params;
  if (!(await loadOwned(id, updateId)))
    return Response.json({ error: 'Não encontrado.' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const data: { summary?: string } = {};
  if (typeof body?.summary === 'string') data.summary = body.summary.slice(0, 5000);

  const deliveries = Array.isArray(body?.deliveries)
    ? body.deliveries
        .map((d: unknown) => {
          const o = (d ?? {}) as { title?: unknown; url?: unknown };
          return {
            title: typeof o.title === 'string' ? o.title.trim().slice(0, 200) : '',
            url: typeof o.url === 'string' ? o.url.trim().slice(0, 2000) : '',
          };
        })
        .filter((d: { title: string; url: string }) => d.title || d.url)
        .slice(0, 30)
    : null;

  // Quantas entregas existiam antes — pra avisar o cliente só quando entra uma nova.
  const before = await prisma.delivery.count({ where: { progressUpdateId: updateId } });

  const result = await prisma.$transaction(async (tx) => {
    if (Object.keys(data).length) {
      await tx.progressUpdate.update({ where: { id: updateId }, data });
    }
    if (deliveries) {
      await tx.delivery.deleteMany({ where: { progressUpdateId: updateId } });
      if (deliveries.length) {
        await tx.delivery.createMany({
          data: deliveries.map((d: { title: string; url: string }) => ({
            ...d,
            progressUpdateId: updateId,
          })),
        });
      }
    }
    return tx.progressUpdate.findUnique({
      where: { id: updateId },
      include: { deliveries: { orderBy: { createdAt: 'asc' } } },
    });
  });

  // Avisa o cliente só quando entrou uma entrega nova (não a cada blur de texto).
  if (deliveries && deliveries.length > before) {
    void mailProjectUpdate(id, 'novas entregas foram adicionadas');
  }

  return Response.json(result);
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const { id, updateId } = await params;
  if (!(await loadOwned(id, updateId)))
    return Response.json({ error: 'Não encontrado.' }, { status: 404 });

  await prisma.progressUpdate.delete({ where: { id: updateId } });
  return new Response(null, { status: 204 });
}
