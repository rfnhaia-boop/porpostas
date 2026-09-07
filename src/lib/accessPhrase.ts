// Código de acesso curto e fácil de ditar/digitar. Sem 0/O/1/I/L pra não confundir.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function pick(n: number): string {
  let out = '';
  const g = globalThis.crypto;
  if (g?.getRandomValues) {
    const buf = new Uint32Array(n);
    g.getRandomValues(buf);
    for (let i = 0; i < n; i++) out += ALPHABET[buf[i] % ALPHABET.length];
  } else {
    for (let i = 0; i < n; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/** Ex.: "NEX-4X7Q". Roda no server e no browser. */
export function generateAccessPhrase(): string {
  return `NEX-${pick(4)}`;
}
