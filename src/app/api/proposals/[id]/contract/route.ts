import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';
import { readUploadedFile } from '@/lib/fileUpload';
import { mailProjectStarted } from '@/lib/mailer';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const proposal = await prisma.proposal.findFirst({ where: { id, companyId } });
  if (!proposal) return Response.json({ error: 'Proposta não encontrada.' }, { status: 404 });

  const result = await readUploadedFile(request);
  if ('error' in result) return Response.json({ error: result.error }, { status: 400 });

  // Trava de contrato: anexar o contrato assinado numa proposta aceita é o que
  // dá o start — vira "em execução" e o cronômetro/prazos começam a contar agora.
  const startsExecution = proposal.requiresSignedContract && proposal.status === 'approved';

  await prisma.proposal.update({
    where: { id },
    data: {
      contractFileName: result.fileName,
      contractMimeType: result.mimeType,
      contractSize: result.size,
      contractData: new Uint8Array(result.data),
      contractUploadedAt: new Date(),
      ...(startsExecution ? { status: 'in_progress', startedAt: new Date() } : {}),
    },
  });

  if (startsExecution) void mailProjectStarted(id);

  return Response.json({ ok: true, fileName: result.fileName, size: result.size, started: startsExecution });
}

export async function GET(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const proposal = await prisma.proposal.findFirst({
    where: { id, companyId },
    select: { contractData: true, contractFileName: true, contractMimeType: true },
  });
  if (!proposal?.contractData) return Response.json({ error: 'Sem contrato anexado.' }, { status: 404 });
  return new Response(new Uint8Array(proposal.contractData), {
    headers: {
      'Content-Type': proposal.contractMimeType || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${proposal.contractFileName || 'contrato'}"`,
    },
  });
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const proposal = await prisma.proposal.findFirst({ where: { id, companyId } });
  if (!proposal) return Response.json({ error: 'Proposta não encontrada.' }, { status: 404 });
  await prisma.proposal.update({
    where: { id },
    data: {
      contractFileName: null,
      contractMimeType: null,
      contractSize: null,
      contractData: null,
      contractUploadedAt: null,
    },
  });
  return new Response(null, { status: 204 });
}
