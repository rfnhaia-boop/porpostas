import { randomInt } from 'crypto';

// Só letras e números — sem "-" nem "_" (o nanoid padrão do Prisma inclui os
// dois, o que gerava links feios/quebráveis tipo /p/-gzyw2B_tZZB).
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** Gera um token curto e seguro pra link público (`/p/<token>`). */
export function generatePublicToken(length = 12): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}
