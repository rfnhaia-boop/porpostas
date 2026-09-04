// Link público personalizado: /p/<nome-do-cliente>-<token>
// O slug é só decoração — quem identifica a proposta de verdade é o token
// (sempre o último "segmento" depois do último hífen, e o token em si nunca
// tem hífen — ver lib/token.ts). Isso deixa o link plausível de compartilhar
// sem trocar como o resto do sistema já resolve a proposta pelo token puro.

const DIACRITICS = /[̀-ͯ]/g;

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(DIACRITICS, '') // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/** Monta o path público personalizado: /p/ana-ferreira-x7k9pq2mza (ou /p/<token> sem cliente). */
export function buildPublicPath(token: string, clientName?: string | null): string {
  const slug = clientName ? slugify(clientName) : '';
  return slug ? `/p/${slug}-${token}` : `/p/${token}`;
}

/** Extrai o token real de um param que pode vir com slug decorativo na frente. */
export function extractToken(param: string): string {
  const parts = param.split('-');
  return parts[parts.length - 1] || param;
}
