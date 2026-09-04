import { createHash } from 'crypto';

/** Cookie que libera a proposta protegida por palavra-chave (por token). */
export const unlockCookieName = (token: string) => `nexq_unlock_${token}`;

export const unlockCookieValue = (token: string, phrase: string) =>
  createHash('sha256').update(`${token}:${phrase.trim().toLowerCase()}`).digest('hex');
