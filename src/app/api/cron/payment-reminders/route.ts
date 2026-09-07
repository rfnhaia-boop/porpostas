import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mailPaymentReminder } from '@/lib/mailer';

// Rodar 1x por dia (cron na VPS):
//   curl -s -H "Authorization: Bearer $CRON_SECRET" https://.../api/cron/payment-reminders
// Manda o lembrete de vencimento pra cada cobrança em aberto que entra na
// janela dos próximos 3 dias e ainda não foi lembrada.
const WINDOW_DAYS = 3;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') || '';
  const qs = req.nextUrl.searchParams.get('secret') || '';
  return header === `Bearer ${secret}` || qs === secret;
}

async function run(req: NextRequest) {
  if (!authorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = new Date(from);
  to.setDate(to.getDate() + WINDOW_DAYS + 1);

  const due = await prisma.payment.findMany({
    where: {
      status: { not: 'paid' },
      reminderSentAt: null,
      dueDate: { gte: from, lt: to },
    },
    select: { id: true },
    take: 200,
  });

  let sent = 0;
  for (const p of due) {
    await mailPaymentReminder(p.id);
    await prisma.payment.update({ where: { id: p.id }, data: { reminderSentAt: new Date() } });
    sent += 1;
  }

  return Response.json({ ok: true, checked: due.length, sent });
}

export const GET = run;
export const POST = run;
