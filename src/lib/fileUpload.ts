// Leitura de upload multipart (contrato / comprovante de pagamento).

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

export type UploadedFile = {
  fileName: string;
  mimeType: string;
  size: number;
  data: Buffer;
};

export async function readUploadedFile(
  request: Request,
): Promise<UploadedFile | { error: string }> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return { error: 'Envie o arquivo como multipart/form-data.' };
  }
  const file = form.get('file');
  if (!(file instanceof File)) return { error: 'Nenhum arquivo enviado.' };
  if (file.size === 0) return { error: 'Arquivo vazio.' };
  if (file.size > MAX_SIZE) return { error: 'Arquivo maior que 10MB.' };
  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    return { error: 'Tipo de arquivo não aceito (use PDF, PNG, JPG ou WEBP).' };
  }
  const data = Buffer.from(await file.arrayBuffer());
  return {
    fileName: (file.name || 'arquivo').replace(/[\r\n]/g, ' ').trim().slice(0, 200) || 'arquivo',
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    data,
  };
}

/**
 * Monta um header Content-Disposition seguro. O nome do arquivo vem de upload do
 * usuário — sem sanitizar, um nome com aspas ou CR/LF permite injeção de header.
 */
export function contentDisposition(name: string | null, fallback: string, disposition: 'inline' | 'attachment' = 'inline'): string {
  const raw = (name || fallback).replace(/[\r\n]/g, ' ').trim() || fallback;
  const ascii = raw.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_').slice(0, 180);
  const utf8 = encodeURIComponent(raw).slice(0, 300);
  return `${disposition}; filename="${ascii}"; filename*=UTF-8''${utf8}`;
}
