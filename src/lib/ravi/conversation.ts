// Helpers do histórico de conversas do Havi.

export function cleanTitle(raw: unknown): string {
  const t = typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ') : '';
  return (t || 'Nova conversa').slice(0, 80);
}

/** Guarda só o essencial de cada mensagem (sem campos internos gigantes). */
export function sanitizeMessages(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: typeof m.content === 'string' ? m.content.slice(0, 6000) : '',
      ...(typeof m.raw === 'string' ? { raw: m.raw.slice(0, 8000) } : {}),
      ...(Array.isArray(m.drafts) ? { drafts: m.drafts.slice(0, 20) } : {}),
      ...(Array.isArray(m.options) ? { options: m.options.slice(0, 6) } : {}),
    }))
    .slice(-60);
}

/** Título automático a partir da 1ª mensagem do usuário. */
export function autoTitleFrom(messages: { role: string; content?: string; raw?: string }[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  const src = (firstUser?.content || firstUser?.raw || '').trim().replace(/\s+/g, ' ');
  if (!src) return 'Nova conversa';
  return src.length > 48 ? src.slice(0, 47) + '…' : src;
}
