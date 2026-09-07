import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/clientAuth";

// O cliente baixa/visualiza o contrato anexado da própria proposta.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getClientSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const proposal = await prisma.proposal.findUnique({
    where: { id },
    select: {
      contractData: true,
      contractFileName: true,
      contractMimeType: true,
      client: { select: { email: true } },
    },
  });

  if (!proposal || proposal.client?.email?.toLowerCase() !== session.email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!proposal.contractData) {
    return NextResponse.json({ error: "Sem contrato anexado." }, { status: 404 });
  }

  return new Response(new Uint8Array(proposal.contractData), {
    headers: {
      "Content-Type": proposal.contractMimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${proposal.contractFileName || "contrato"}"`,
    },
  });
}
