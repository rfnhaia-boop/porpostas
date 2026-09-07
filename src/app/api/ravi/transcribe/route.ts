import { NextRequest } from 'next/server';
import { getCurrentCompanyId } from '@/lib/company';
import { raviEnabled } from '@/lib/ravi/groq';

// Ditado de voz pro Ravi: áudio → texto (Groq Whisper).
const GROQ_TRANSCRIBE = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MODEL = 'whisper-large-v3-turbo';
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(req: NextRequest) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  if (!raviEnabled()) return Response.json({ error: 'Ravi indisponível.' }, { status: 503 });

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get('audio');
    if (f instanceof File) file = f;
  } catch {
    return Response.json({ error: 'Envio inválido.' }, { status: 400 });
  }
  if (!file) return Response.json({ error: 'Sem áudio.' }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: 'Áudio muito longo.' }, { status: 400 });

  try {
    const out = new FormData();
    out.append('file', file, 'fala.webm');
    out.append('model', MODEL);
    out.append('language', 'pt');
    out.append('response_format', 'json');
    out.append('temperature', '0');

    const res = await fetch(GROQ_TRANSCRIBE, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: out,
    });
    if (!res.ok) {
      console.error('[ravi] whisper', res.status, (await res.text().catch(() => '')).slice(0, 300));
      return Response.json({ error: 'Não consegui transcrever. Tenta de novo?' }, { status: 502 });
    }
    const json = await res.json();
    return Response.json({ text: typeof json?.text === 'string' ? json.text.trim() : '' });
  } catch (err) {
    console.error('[ravi] transcribe:', err);
    return Response.json({ error: 'Falha na transcrição.' }, { status: 500 });
  }
}
