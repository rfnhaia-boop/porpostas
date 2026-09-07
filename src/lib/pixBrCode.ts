// Gera o "BR Code" (payload EMV do PIX) pra copia-e-cola / QR code.
// Referência: Manual do BR Code do Banco Central (arranjo PIX).
// Sem dependência externa — só a montagem dos campos ID-tamanho-valor + CRC16.

export type PixKeyType = "cpf" | "cnpj" | "email" | "phone" | "random" | "";

export interface PixConfig {
  key: string;
  name: string; // nome do recebedor
  city: string; // cidade do recebedor
}

export interface BuildPixParams extends PixConfig {
  amountCents?: number; // valor fixo em centavos (opcional)
  txid?: string; // identificador da cobrança (opcional; default "***")
}

// Campo EMV: id (2) + tamanho (2, com zero à esquerda) + valor.
function field(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

// Remove acento, deixa maiúsculo e só o que o BR Code aceita com folga.
function sanitize(text: string, max: number): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .trim()
    .slice(0, max);
}

// CRC16-CCITT (FALSE): poly 0x1021, init 0xFFFF. Calculado sobre a string toda
// já com "6304" no fim; resultado em 4 hex maiúsculos.
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Adivinha o tipo da chave pelo formato — usado quando a proposta tem um PIX
// sobrescrito (só a chave, sem o tipo).
export function detectPixKeyType(key: string): PixKeyType {
  const raw = (key || "").trim();
  if (!raw) return "";
  if (raw.includes("@")) return "email";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) return "random";
  // Telefone quase sempre vem com "+" ou pontuação; chave CPF/CNPJ costuma vir só dígitos.
  if (raw.startsWith("+") || /[()\-\s]/.test(raw)) return "phone";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11) return "cpf";
  if (digits.length === 14) return "cnpj";
  if (digits.length >= 10 && digits.length <= 13) return "phone";
  return "random";
}

// Normaliza a chave conforme o tipo (telefone vira +55DDDNUMERO, etc).
export function normalizePixKey(key: string, type: PixKeyType): string {
  const raw = (key || "").trim();
  if (!raw) return "";
  switch (type) {
    case "cpf":
    case "cnpj":
      return raw.replace(/\D/g, "");
    case "phone": {
      const digits = raw.replace(/\D/g, "");
      if (digits.startsWith("55")) return `+${digits}`;
      return `+55${digits}`;
    }
    case "email":
      return raw.toLowerCase();
    case "random":
    default:
      return raw;
  }
}

// true se dá pra gerar um BR Code válido com essa config.
export function pixConfigReady(cfg: Partial<PixConfig> | null | undefined): cfg is PixConfig {
  return !!cfg && !!cfg.key?.trim() && !!cfg.name?.trim() && !!cfg.city?.trim();
}

export function buildPixBrCode({ key, name, city, amountCents, txid }: BuildPixParams): string {
  const merchantAccount = field("00", "br.gov.bcb.pix") + field("01", key.trim());

  const cleanTxid = (txid || "***").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const additionalData = field("05", cleanTxid);

  let payload =
    field("00", "01") + // Payload Format Indicator
    field("01", "11") + // static / reutilizável
    field("26", merchantAccount) +
    field("52", "0000") + // Merchant Category Code
    field("53", "986"); // moeda: BRL

  if (typeof amountCents === "number" && amountCents > 0) {
    payload += field("54", (amountCents / 100).toFixed(2));
  }

  payload +=
    field("58", "BR") +
    field("59", sanitize(name, 25) || "RECEBEDOR") +
    field("60", sanitize(city, 15) || "BRASIL") +
    field("62", additionalData);

  payload += "6304";
  return payload + crc16(payload);
}
