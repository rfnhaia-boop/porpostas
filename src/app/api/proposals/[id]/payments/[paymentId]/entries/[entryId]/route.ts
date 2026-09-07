import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCompanyId } from "@/lib/company";
import { recomputePaymentStatus } from "@/lib/paymentStatus";
import { mailPaymentConfirmed } from "@/lib/mailer";

type Ctx = { params: Promise<{ id: string; paymentId: string; entryId: string }> };

async function findEntry(entryId: string, paymentId: string, proposalId: string, companyId: string) {
  const entry = await prisma.paymentEntry.findFirst({
    where: {
      id: entryId,
      paymentId,
      payment: { proposalId, companyId },
    },
  });
  return entry;
}

// O dono confere um recibo do cliente: verified (bate) ou rejected (não bate).
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id, paymentId, entryId } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: "Não autenticado." }, { status: 401 });

  const entry = await findEntry(entryId, paymentId, id, companyId);
  if (!entry) return Response.json({ error: "Recibo não encontrado." }, { status: 404 });

  const body = await request.json();
  const next = body?.status === "verified" ? "verified" : body?.status === "rejected" ? "rejected" : null;
  if (!next) return Response.json({ error: "Status inválido." }, { status: 400 });

  await prisma.paymentEntry.update({ where: { id: entryId }, data: { status: next } });
  await recomputePaymentStatus(paymentId);
  if (next === 'verified') void mailPaymentConfirmed(paymentId);
  return Response.json({ ok: true, status: next });
}

// GET: o dono vê o recibo.
export async function GET(_request: NextRequest, { params }: Ctx) {
  const { id, paymentId, entryId } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: "Não autenticado." }, { status: 401 });

  const entry = await prisma.paymentEntry.findFirst({
    where: { id: entryId, paymentId, payment: { proposalId: id, companyId } },
    select: { receiptData: true, receiptFileName: true, receiptMimeType: true },
  });
  if (!entry?.receiptData) return Response.json({ error: "Sem recibo." }, { status: 404 });

  return new Response(new Uint8Array(entry.receiptData), {
    headers: {
      "Content-Type": entry.receiptMimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${entry.receiptFileName || "recibo"}"`,
    },
  });
}
