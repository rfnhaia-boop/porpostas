import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/clientAuth";
import { recomputePaymentStatus } from "@/lib/paymentStatus";

type Ctx = { params: Promise<{ id: string; entryId: string }> };

const METHODS = ["pix", "boleto", "transferencia", "dinheiro", "cartao", "outro"];

async function loadOwnedEntry(entryId: string, paymentId: string, email: string) {
  const entry = await prisma.paymentEntry.findUnique({
    where: { id: entryId },
    include: { payment: { include: { proposal: { select: { client: { select: { email: true } } } } } } },
  });
  const ownerEmail = entry?.payment.proposal.client?.email?.toLowerCase();
  if (!entry || entry.paymentId !== paymentId || !ownerEmail || ownerEmail !== email) return null;
  return entry;
}

// O cliente edita uma parcela que registrou — valor / forma / data. Só enquanto
// não foi conferida pelo dono.
export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getClientSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, entryId } = await params;
  const entry = await loadOwnedEntry(entryId, id, session.email);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (entry.status === "verified") {
    return NextResponse.json({ error: "Parcela já conferida." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (body.amount !== undefined) {
    const amount = Math.round(Number(body.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
    }
    data.amount = amount;
  }
  if (typeof body.method === "string") {
    data.method = METHODS.includes(body.method.toLowerCase()) ? body.method.toLowerCase() : "outro";
  }
  if (typeof body.paidOn === "string" && body.paidOn.trim()) {
    const d = new Date(body.paidOn.trim());
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Data inválida." }, { status: 400 });
    }
    data.paidOn = d;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada pra atualizar." }, { status: 400 });
  }

  await prisma.paymentEntry.update({ where: { id: entryId }, data });
  await recomputePaymentStatus(id);
  return NextResponse.json({ success: true });
}

// O cliente remove um recibo que enviou — só se ainda não foi conferido.
export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getClientSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, entryId } = await params;
  const entry = await prisma.paymentEntry.findUnique({
    where: { id: entryId },
    include: { payment: { include: { proposal: { select: { client: { select: { email: true } } } } } } },
  });
  const ownerEmail = entry?.payment.proposal.client?.email?.toLowerCase();
  if (!entry || entry.paymentId !== id || !ownerEmail || ownerEmail !== session.email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (entry.status === "verified") {
    return NextResponse.json({ error: "Recibo já conferido — fale com o responsável." }, { status: 400 });
  }

  await prisma.paymentEntry.delete({ where: { id: entryId } });
  await recomputePaymentStatus(id);
  return new NextResponse(null, { status: 204 });
}
