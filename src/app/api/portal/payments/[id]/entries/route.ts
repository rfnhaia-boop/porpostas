import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/clientAuth";
import { recomputePaymentStatus } from "@/lib/paymentStatus";
import { mailPaymentSubmitted } from "@/lib/mailer";

const METHODS = ["pix", "boleto", "transferencia", "dinheiro", "cartao", "outro"];
const MAX_PER_MONTH = 4;

type RowInput = { amount?: unknown; method?: unknown; paidOn?: unknown };

// O cliente registra em quantas vezes vai pagar o mês (1 a 4) e o valor/forma de
// cada uma. Cria as parcelas como "planned" (sem recibo ainda). Ele anexa o
// comprovante depois, uma por uma. Pode salvar esse formato como padrão.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getClientSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const rows: RowInput[] = Array.isArray(body?.entries) ? body.entries : [];
    const saveAsPattern = body?.saveAsPattern === true;

    if (rows.length < 1 || rows.length > MAX_PER_MONTH) {
      return NextResponse.json({ error: `Escolha de 1 a ${MAX_PER_MONTH} pagamentos.` }, { status: 400 });
    }

    const parsed = rows.map((r) => {
      const amount = Math.round(Number(r.amount));
      const method = METHODS.includes(String(r.method).toLowerCase())
        ? String(r.method).toLowerCase()
        : "outro";
      const paidOnRaw = typeof r.paidOn === "string" && r.paidOn.trim() ? r.paidOn.trim() : null;
      const paidOn = paidOnRaw ? new Date(paidOnRaw) : new Date();
      return { amount, method, paidOn };
    });
    if (parsed.some((p) => !Number.isFinite(p.amount) || p.amount <= 0)) {
      return NextResponse.json({ error: "Informe um valor válido em cada linha." }, { status: 400 });
    }
    if (parsed.some((p) => Number.isNaN(p.paidOn.getTime()))) {
      return NextResponse.json({ error: "Data inválida." }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { proposal: { select: { id: true, client: { select: { email: true } } } } },
    });
    const ownerEmail = payment?.proposal.client?.email?.toLowerCase();
    if (!payment || !ownerEmail || ownerEmail !== session.email) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (payment.status === "paid") {
      return NextResponse.json({ error: "Este mês já está quitado." }, { status: 400 });
    }

    await prisma.paymentEntry.createMany({
      data: parsed.map((p) => ({
        paymentId: id,
        amount: p.amount,
        method: p.method,
        paidOn: p.paidOn,
        status: "planned",
      })),
    });

    if (saveAsPattern) {
      await prisma.proposal.update({
        where: { id: payment.proposal.id },
        data: { paymentPattern: parsed.map((p) => ({ amount: p.amount, method: p.method })) },
      });
    }

    await recomputePaymentStatus(id);
    void mailPaymentSubmitted(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao registrar.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// "Refazer o registro" — apaga todas as parcelas do mês que ainda não foram
// conferidas, pra o cliente montar de novo. Se alguma já foi conferida, bloqueia.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getClientSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      proposal: { select: { client: { select: { email: true } } } },
      entries: { select: { id: true, status: true } },
    },
  });
  const ownerEmail = payment?.proposal.client?.email?.toLowerCase();
  if (!payment || !ownerEmail || ownerEmail !== session.email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (payment.entries.some((e) => e.status === "verified")) {
    return NextResponse.json({ error: "Já tem parcela conferida — fale com o responsável." }, { status: 400 });
  }

  await prisma.paymentEntry.deleteMany({ where: { paymentId: id } });
  await recomputePaymentStatus(id);
  return new NextResponse(null, { status: 204 });
}
