import { prisma } from '@/lib/prisma';

// Recalcula o status de um Payment (o "mês") a partir dos recibos (PaymentEntry):
//   sem recibo                       -> pending
//   tem recibo mas ainda não cobre   -> awaiting_verification
//   soma dos VERIFICADOS >= valor     -> paid
// O dono ainda pode forçar 'paid' manualmente no ExecutionModal (isso não
// mexe nos recibos; a próxima recalculada respeita se ele já marcou).
export async function recomputePaymentStatus(paymentId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      amount: true,
      status: true,
      entries: { select: { amount: true, status: true } },
    },
  });
  if (!payment) return;

  const verifiedTotal = payment.entries
    .filter((e) => e.status === 'verified')
    .reduce((sum, e) => sum + e.amount, 0);
  const hasReceiptPending = payment.entries.some((e) => e.status === 'awaiting_verification');

  let status: string;
  if (verifiedTotal >= payment.amount && payment.entries.length > 0) status = 'paid';
  else if (hasReceiptPending) status = 'awaiting_verification';
  else status = 'pending'; // sem recibo ainda (mesmo com parcelas "planejadas")

  // Não rebaixa um 'paid' que o dono já confirmou — nem pra 'pending' nem pra
  // 'awaiting_verification' se o cliente mexer nos recibos depois. Pra desfazer,
  // o dono usa o toggle explícito no painel.
  if (payment.status === 'paid' && status !== 'paid') return;

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status,
      paidAt: status === 'paid' ? new Date() : null,
    },
  });
}
