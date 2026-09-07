// Mensagens de WhatsApp prontas — o dono clica e o wa.me abre com o texto.
// Texto puro (sem HTML). Editável por empresa em Disparos → WhatsApp.

import { prisma } from './prisma';

export type WaKey = 'wa_proposal' | 'wa_payment_reminder' | 'wa_project_delivered' | 'wa_followup';

export interface WaTemplateDef {
  key: WaKey;
  label: string;
  vars: string[];
  body: string;
}

export const WHATSAPP_TEMPLATES: Record<WaKey, WaTemplateDef> = {
  wa_proposal: {
    key: 'wa_proposal',
    label: 'Enviar proposta',
    vars: ['cliente', 'empresa', 'proposta', 'link', 'palavraAcesso'],
    body:
      'Olá, {{cliente}}! Sua proposta da {{empresa}} está pronta. 🎯\n\n' +
      '1️⃣ Acesse: {{link}}\n' +
      '2️⃣ Palavra de acesso: {{palavraAcesso}}\n\n' +
      'É só colar a palavra de acesso quando abrir. Qualquer dúvida, me chama por aqui.',
  },
  wa_payment_reminder: {
    key: 'wa_payment_reminder',
    label: 'Lembrete de pagamento',
    vars: ['cliente', 'projeto', 'cobranca', 'valor', 'vencimento', 'link'],
    body:
      'Oi, {{cliente}}! Passando pra lembrar da cobrança {{cobranca}} do projeto {{projeto}} ' +
      '({{valor}}), que vence em {{vencimento}}.\n\n' +
      'Você paga e registra o comprovante direto no portal: {{link}}',
  },
  wa_project_delivered: {
    key: 'wa_project_delivered',
    label: 'Projeto entregue',
    vars: ['cliente', 'projeto', 'link'],
    body:
      '{{cliente}}, o projeto {{projeto}} está entregue! 🎉\n\n' +
      'No portal você vê o resumo de tudo que foi feito: {{link}}\n\n' +
      'Foi um prazer trabalhar com você — bora continuar?',
  },
  wa_followup: {
    key: 'wa_followup',
    label: 'Cobrar retorno da proposta',
    vars: ['cliente', 'proposta', 'link'],
    body:
      'Oi, {{cliente}}! Tudo bem? Passando pra saber se conseguiu dar uma olhada na proposta {{proposta}}. ' +
      'Fico à disposição pra ajustar o que precisar.\n\n{{link}}',
  },
};

function subst(text: string, vars: Record<string, string | undefined>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '');
}

export async function renderWhatsappTemplate(
  companyId: string,
  key: WaKey,
  vars: Record<string, string | undefined>,
): Promise<{ enabled: boolean; text: string }> {
  const def = WHATSAPP_TEMPLATES[key];
  let body = def.body;
  let enabled = true;
  try {
    const o = await prisma.whatsappTemplate.findUnique({
      where: { companyId_key: { companyId, key } },
    });
    if (o) {
      enabled = o.enabled;
      if (o.body.trim()) body = o.body;
    }
  } catch {
    /* usa padrão */
  }
  return { enabled, text: subst(body, vars).trim() };
}
