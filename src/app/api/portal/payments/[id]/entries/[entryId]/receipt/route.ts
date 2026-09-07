import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/clientAuth";
import { recomputePaymentStatus } from "@/lib/paymentStatus";
import { mailPaymentSubmitted } from "@/lib/mailer";

type Ctx = { params: Promise<{ id: string; entryId: string }> };

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

// O cliente anexa o comprovante numa parcela já registrada -> vai pra conferência.
export async function POST(req: Request, { params }: Ctx) {
  const session = await getClientSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, entryId } = await params;

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: "Envie como multipart/form-data." }, { status: 400 });
    }
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Anexe o comprovante." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Arquivo maior que 10MB." }, { status: 400 });
    }
    if (file.type && !ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Use PDF, PNG, JPG ou WEBP." }, { status: 400 });
    }

    const entry = await prisma.paymentEntry.findUnique({
      where: { id: entryId },
      include: { payment: { include: { proposal: { select: { client: { select: { email: true } } } } } } },
    });
    const ownerEmail = entry?.payment.proposal.client?.email?.toLowerCase();
    if (!entry || entry.paymentId !== id || ownerEmail !== session.email) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (entry.status === "verified") {
      return NextResponse.json({ error: "Parcela já conferida." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await prisma.paymentEntry.update({
      where: { id: entryId },
      data: {
        receiptFileName: file.name || "comprovante",
        receiptMimeType: file.type || "application/octet-stream",
        receiptSize: file.size,
        receiptData: new Uint8Array(buffer),
        status: "awaiting_verification",
      },
    });
    await recomputePaymentStatus(id);
    void mailPaymentSubmitted(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao enviar o comprovante.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// O cliente revê um recibo que enviou.
export async function GET(_req: Request, { params }: Ctx) {
  const session = await getClientSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, entryId } = await params;
  const entry = await prisma.paymentEntry.findUnique({
    where: { id: entryId },
    select: {
      paymentId: true,
      receiptData: true,
      receiptFileName: true,
      receiptMimeType: true,
      payment: { select: { proposal: { select: { client: { select: { email: true } } } } } },
    },
  });
  const ownerEmail = entry?.payment.proposal.client?.email?.toLowerCase();
  if (!entry || entry.paymentId !== id || ownerEmail !== session.email || !entry.receiptData) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new Response(new Uint8Array(entry.receiptData), {
    headers: {
      "Content-Type": entry.receiptMimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${entry.receiptFileName || "recibo"}"`,
    },
  });
}
