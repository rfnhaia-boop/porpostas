import { createHash } from 'crypto';

// v2: cookie agora é Path=/ (antes era Path=/p, e não chegava em /api/p/.../respond,
// travando o aceite). O nome mudou pra forçar quem já tinha o cookie antigo a
// passar pela tela de código de novo e receber o cookie no path certo.
/** Cookie que libera a proposta protegida por palavra-chave (por token). */
export const unlockCookieName = (token: string) => `nexq2_unlock_${token}`;

/** Nome antigo (Path=/p) — só pra reconhecer aparelhos que já tinham liberado e não cobrar vaga de novo. */
export const legacyUnlockCookieName = (token: string) => `nexq_unlock_${token}`;

export const unlockCookieValue = (token: string, phrase: string) =>
  createHash('sha256').update(`${token}:${phrase.trim().toLowerCase()}`).digest('hex');
