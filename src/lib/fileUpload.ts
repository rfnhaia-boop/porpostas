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
    fileName: file.name || 'arquivo',
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    data,
  };
}
