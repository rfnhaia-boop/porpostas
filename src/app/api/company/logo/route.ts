import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';

// Tipos aceitos. SVG fica de fora de propósito (pode carregar script).
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

  const ext = EXT[file.type];
  if (!ext) return Response.json({ error: 'Use PNG, JPG ou WEBP.' }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: 'A imagem passa de 1 MB.' }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  const name = `logo-${companyId}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  await writeFile(path.join(dir, name), buf);

  const logoUrl = `/uploads/${name}`;
  await prisma.company.update({ where: { id: companyId }, data: { logoUrl } });

  return Response.json({ logoUrl });
}
