import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";

// Carrega as propostas do cliente logado no portal. Identidade = e-mail, então
// junta as propostas de todos os cadastros de cliente com aquele e-mail
// (a mesma pessoa pode ter fechado com o dono por empresas diferentes).
export async function loadPortalProposals() {
  const session = await getClientSession();
  if (!session) return null;

  const clients = await prisma.client.findMany({
    where: { email: { equals: session.email, mode: "insensitive" } },
    include: {
      proposals: {
        where: { status: { in: ["approved", "in_progress", "delivered"] } },
        orderBy: { createdAt: "desc" },
        omit: { contractData: true },
        include: {
          company: {
            select: {
              name: true,
              pixKey: true,
              pixKeyType: true,
              pixReceiverName: true,
              pixReceiverCity: true,
            },
          },
          reviews: { orderBy: { month: "desc" } },
          progressUpdates: {
            orderBy: { month: "desc" },
            include: { deliveries: { orderBy: { createdAt: "asc" } } },
          },
          blocks: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
          payments: {
            orderBy: { createdAt: "asc" },
            omit: { receiptData: true },
            include: {
              entries: { orderBy: { createdAt: "asc" }, omit: { receiptData: true } },
            },
          },
        },
      },
    },
  });

  if (clients.length === 0) return null;

  return {
    firstName: (clients[0].name || "").split(" ")[0] || "Cliente",
    proposals: clients.flatMap((c) => c.proposals) as any[],
  };
}
