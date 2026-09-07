// Monta a mensagem pronta pro dono mandar pro cliente (WhatsApp / e-mail / copiar).

export function buildSendMessage(opts: {
  companyName: string;
  clientName?: string | null;
  url: string;
  phrase: string;
  maxAccesses: number;
}): string {
  const { companyName, clientName, url, phrase, maxAccesses } = opts;
  const first = clientName?.trim().split(/\s+/)[0];
  const hi = first ? `Olá, ${first}!` : 'Olá!';
  const seats =
    maxAccesses <= 1
      ? 'só você consegue abrir'
      : `no máximo ${maxAccesses} pessoas conseguem abrir`;

  return [
    `${hi} Sua proposta da ${companyName} está pronta. 🎯`,
    '',
    `1️⃣ Acesse: ${url}`,
    `2️⃣ Palavra de acesso: ${phrase}`,
    '',
    `Ao abrir, cole a palavra de acesso pra confirmar que é você. Por segurança, o link é restrito — ${seats}.`,
  ].join('\n');
}

export function buildEmailSubject(companyName: string, proposalNumber: string): string {
  return `Proposta ${proposalNumber} — ${companyName}`;
}
