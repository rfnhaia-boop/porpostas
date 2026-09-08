// Extrai texto de um documento enviado pro Havi (PDF de texto, DOCX ou TXT).
// PDF digitalizado (imagem) não tem texto — devolve vazio, o Havi trata isso.

export interface ExtractedDoc {
  text: string;
  kind: 'pdf' | 'docx' | 'txt' | 'unknown';
  truncated: boolean;
}

const MAX_CHARS = 9000; // TPM apertado no plano free do Groq

export async function extractDocText(file: File): Promise<ExtractedDoc> {
  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());

  if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
    const { extractText, getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: true });
    return finish(String(text || ''), 'pdf');
  }

  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    const mammoth = await import('mammoth');
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return finish(value || '', 'docx');
  }

  if (file.type.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md')) {
    return finish(buf.toString('utf8'), 'txt');
  }

  return { text: '', kind: 'unknown', truncated: false };
}

function finish(raw: string, kind: ExtractedDoc['kind']): ExtractedDoc {
  const clean = raw.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return { text: clean.slice(0, MAX_CHARS), kind, truncated: clean.length > MAX_CHARS };
}
