import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientSession, clientEmailOwnsProposal } from "@/lib/clientAuth";

const MONTH_RE = /^\d{4}-\d{2}$/;

// O cliente envia (ou atualiza) a avaliação de um mês da proposta.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getClientSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    if (!(await clientEmailOwnsProposal(session.email, id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const month = typeof body?.month === "string" && MONTH_RE.test(body.month) ? body.month : null;
    const rating = Math.round(Number(body?.rating));
    const comment = typeof body?.comment === "string" ? body.comment.trim().slice(0, 2000) : "";

    if (!month) return NextResponse.json({ error: "Mês inválido." }, { status: 400 });
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Dê uma nota de 1 a 5." }, { status: 400 });
    }
    // A avaliação é do ciclo/mês da cobrança — o cliente faz assim que fecha o
    // pagamento, o que pode ser antes do vencimento. Só barra ano claramente inválido.
    const year = Number(month.slice(0, 4));
    if (year < 2020 || year > new Date().getFullYear() + 5) {
      return NextResponse.json({ error: "Mês inválido." }, { status: 400 });
    }

    await prisma.monthlyReview.upsert({
      where: { proposalId_month: { proposalId: id, month } },
      create: { proposalId: id, month, rating, comment },
      update: { rating, comment },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao enviar a avaliação.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
