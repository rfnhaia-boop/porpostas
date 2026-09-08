import { NextRequest } from 'next/server';
import { getCurrentCompanyId } from '@/lib/company';
import { raviEnabled } from '@/lib/ravi/groq';
import { extractDocText } from '@/lib/ravi/readDoc';

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB

export async function POST(req: NextRequest) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  if (!raviEnabled()) return Response.json({ error: 'Havi indisponível.' }, { status: 503 });

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get('file');
    if (f instanceof File) file = f;
  } catch {
    return Response.json({ error: 'Envio inválido.' }, { status: 400 });
  }
  if (!file) return Response.json({ error: 'Nenhum arquivo.' }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: 'Arquivo acima de 12 MB.' }, { status: 400 });

  try {
    const doc = await extractDocText(file);
    if (doc.kind === 'unknown') {
      return Response.json({ error: 'Formato não suportado. Use PDF, DOCX ou TXT.' }, { status: 415 });
    }
    if (!doc.text || doc.text.length < 20) {
      return Response.json({
        text: '',
        note: 'Não achei texto nesse arquivo — se for um PDF digitalizado (imagem), me conta o que tem nele ou cola o texto.',
        fileName: file.name,
      });
    }
    return Response.json({ text: doc.text, truncated: doc.truncated, fileName: file.name });
  } catch (err) {
    console.error('[havi] read-doc:', err);
    return Response.json({ error: 'Não consegui ler o arquivo.' }, { status: 500 });
  }
}
