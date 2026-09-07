import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM || 'Fechô <onboarding@resend.dev>';
const APP_URL = (process.env.APP_URL || 'http://localhost:3001').replace(/\/$/, '');

export function appUrl(path = ''): string {
  return `${APP_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function isEmail(v: unknown): v is string {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

interface ShellOpts {
  /** Nome da empresa (agência) — vira o cabeçalho quando não há logo, e o rodapé. */
  brand?: string;
  /** URL absoluta da logo da agência — aparece no topo do e-mail. */
  logoUrl?: string;
  /** Texto de prévia (aparece na lista da caixa de entrada, antes de abrir). */
  preheader?: string;
}

interface SendArgs extends ShellOpts {
  to: string;
  subject: string;
  html: string;
  /** Versão em texto puro. Sem ela o e-mail vira só-HTML — pesa contra entrega. */
  text?: string;
  replyTo?: string | null;
}

/** Deriva um texto puro razoável a partir do HTML, se nenhum for passado. */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<(?:br|\/p|\/h[1-6]|\/tr|\/li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&middot;/g, '·')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Envia um e-mail. Nunca lança — devolve true se realmente saiu. */
export async function sendEmail(args: SendArgs): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  if (!isEmail(args.to)) return false;
  try {
    const resend = new Resend(key);
    const html = shell(args.html, { brand: args.brand, logoUrl: args.logoUrl, preheader: args.preheader });
    const text = (args.text && args.text.trim()) || htmlToText(args.html);
    // List-Unsubscribe: exigido pelo Gmail/Yahoo pra remetentes em volume; um
    // mailto basta e melhora a reputação. Reply-To real também ajuda.
    const unsub = args.replyTo && isEmail(args.replyTo) ? args.replyTo.trim() : undefined;
    const { error } = await resend.emails.send({
      from: FROM,
      to: args.to.trim(),
      subject: args.subject,
      html,
      text,
      ...(args.replyTo && isEmail(args.replyTo) ? { replyTo: args.replyTo.trim() } : {}),
      ...(unsub
        ? { headers: { 'List-Unsubscribe': `<mailto:${unsub}?subject=unsubscribe>` } }
        : {}),
    });
    if (error) {
      console.error('[email] resend:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] falha:', err);
    return false;
  }
}

// --- montagem de HTML -------------------------------------------------------

const ORANGE = '#FF6A00';
const INK = '#18181b';
const BODY = '#3f3f46';
const MUTED = '#a1a1aa';
const LINE = '#ececee';

export function button(label: string, href: string): string {
  // Célula de tabela + <a> em bloco: rende igual em Gmail, Apple Mail e Outlook.
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 6px">
    <tr><td style="border-radius:999px;background:${ORANGE}">
      <a href="${href}" style="display:inline-block;padding:13px 30px;font-size:13px;font-weight:700;letter-spacing:.03em;color:#ffffff;text-decoration:none;border-radius:999px">${label}</a>
    </td></tr>
  </table>`;
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BODY}">${text}</p>`;
}

export function heading(text: string): string {
  return `<h1 style="margin:0 0 14px;font-size:21px;line-height:1.3;font-weight:800;color:${INK}">${text}</h1>`;
}

/** Bloco "rótulo: valor" para resumos. */
export function facts(rows: [string, string][]): string {
  const body = rows
    .map(
      ([k, v], i) =>
        `<tr>
          <td style="padding:11px 0;font-size:11px;text-transform:uppercase;letter-spacing:.09em;color:${MUTED};${i ? `border-top:1px solid ${LINE};` : ''}white-space:nowrap;vertical-align:top">${k}</td>
          <td style="padding:11px 0 11px 16px;font-size:14px;font-weight:700;color:${INK};text-align:right;${i ? `border-top:1px solid ${LINE};` : ''}">${v}</td>
        </tr>`,
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:4px 0 20px;background:#fafafa;border:1px solid ${LINE};border-radius:12px">
    <tr><td style="padding:4px 18px"><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${body}</table></td></tr>
  </table>`;
}

function shell(inner: string, opts: ShellOpts = {}): string {
  const brand = (opts.brand || '').trim();
  const logo = (opts.logoUrl || '').trim();
  const pre = (opts.preheader || '').trim();

  // Cabeçalho = a marca de quem usa a NEX: logo se tiver, senão o nome; NEX só como assinatura no rodapé.
  const header = /^https?:\/\//i.test(logo)
    ? `<img src="${logo}" alt="${escapeHtml(brand || 'Logo')}" height="34" style="display:block;height:34px;max-height:34px;width:auto;border:0;outline:none">`
    : `<span style="font-size:18px;font-weight:800;letter-spacing:.03em;color:${INK}">${escapeHtml(brand || 'Proposta')}</span>`;

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#f4f4f5">
  ${pre ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${pre}&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
        <tr><td style="background:#ffffff;border:1px solid #e4e4e7;border-bottom:0;border-radius:16px 16px 0 0;padding:22px 30px">
          ${header}
        </td></tr>
        <tr><td style="height:3px;background:${ORANGE};font-size:0;line-height:0">&nbsp;</td></tr>
        <tr><td style="background:#ffffff;border:1px solid #e4e4e7;border-top:0;border-radius:0 0 16px 16px;padding:32px 30px">
          ${inner}
        </td></tr>
        <tr><td style="padding:18px 12px 0;text-align:center">
          <p style="margin:0 0 3px;color:${MUTED};font-size:11px;line-height:1.6">
            ${brand ? `${escapeHtml(brand)} &middot; este e-mail foi enviado automaticamente` : 'Este e-mail foi enviado automaticamente'}
          </p>
          <p style="margin:0;color:#c4c4c8;font-size:10px;line-height:1.6">com tecnologia NEX</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}
