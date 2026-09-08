import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';

// A logo da empresa é guardada NO BANCO (não no filesystem) — assim não some em
// redeploy nem depende de storage externo. Servida publicamente por ?c=<companyId>
// (aparece em proposta pública e e-mails, que não têm sessão).

const EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
const MAX_BYTES = 1024 * 1024; // 1 MB

export async function POST(req: NextRequest) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get('file');
    if (f instanceof File) file = f;
  } catch {
    return Response.json({ error: 'Envio inválido.' }, { status: 400 });
  }
  if (!file) return Response.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
  if (!EXT[file.type]) return Response.json({ error: 'Use PNG, JPG ou WEBP.' }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: 'A imagem passa de 1 MB.' }, { status: 400 });

  const data = Buffer.from(await file.arrayBuffer());
  const v = crypto.createHash('sha1').update(data).digest('hex').slice(0, 10);
  const logoUrl = `/api/company/logo?c=${companyId}&v=${v}`;

  await prisma.company.update({
    where: { id: companyId },
    data: { logoData: data, logoContentType: file.type, logoUrl },
  });

  return Response.json({ logoUrl });
}

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('c');
  if (!companyId) return new Response('missing c', { status: 400 });

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { logoData: true, logoContentType: true },
  });
  if (!company?.logoData) return new Response('sem logo', { status: 404 });

  return new Response(new Uint8Array(company.logoData), {
    headers: {
      'Content-Type': company.logoContentType || 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

export async function DELETE() {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  await prisma.company.update({
    where: { id: companyId },
    data: { logoData: null, logoContentType: '', logoUrl: '' },
  });
  return new Response(null, { status: 204 });
}
