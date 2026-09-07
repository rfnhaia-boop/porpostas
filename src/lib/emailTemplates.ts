// Modelos padrão dos e-mails automáticos. A empresa pode sobrescrever assunto/
// título/corpo/ligado em EmailTemplate (Configurações → E-mails automáticos).
// A estrutura (botão, tabela de dados) fica no código — o dono edita só o texto.

import { prisma } from './prisma';

export type EmailKey =
  | 'proposal_sent'
  | 'payment_submitted'
  | 'payment_confirmed'
  | 'project_update'
  | 'project_delivered'
  | 'payment_reminder'
  | 'renewal_interest'
  | 'welcome';

export interface EmailTemplateDef {
  key: EmailKey;
  label: string;
  audience: 'cliente' | 'dono';
  vars: string[];
  subject: string;
  title: string;
  body: string;
}

export const EMAIL_TEMPLATES: Record<EmailKey, EmailTemplateDef> = {
  proposal_sent: {
    key: 'proposal_sent',
    label: 'Proposta enviada',
    audience: 'cliente',
    vars: ['cliente', 'empresa', 'proposta', 'valor', 'palavraAcesso'],
    subject: 'Proposta {{empresa}} chegou',
    title: 'Proposta {{empresa}} chegou',
    body: 'A {{empresa}} preparou a proposta {{proposta}} para você.\n\nAbra o link abaixo, revise com calma e registre sua resposta.',
  },
  payment_submitted: {
    key: 'payment_submitted',
    label: 'Cliente registrou pagamento',
    audience: 'dono',
    vars: ['cliente', 'projeto', 'cobranca', 'valor'],
    subject: '{{cliente}} registrou um pagamento',
    title: 'Novo pagamento pra conferir',
    body: '{{cliente}} registrou um pagamento no projeto {{projeto}}. Confira o comprovante no painel.',
  },
  payment_confirmed: {
    key: 'payment_confirmed',
    label: 'Pagamento confirmado',
    audience: 'cliente',
    vars: ['empresa', 'projeto', 'cobranca', 'valor'],
    subject: '{{empresa}} · pagamento confirmado ({{cobranca}})',
    title: 'Recebemos seu pagamento',
    body: 'A {{empresa}} confirmou o pagamento de {{valor}} ({{cobranca}}) do projeto {{projeto}}. Obrigado!',
  },
  project_update: {
    key: 'project_update',
    label: 'Novidade no projeto',
    audience: 'cliente',
    vars: ['empresa', 'projeto', 'oQue'],
    subject: '{{empresa}} · novidade no projeto {{projeto}}',
    title: 'Seu projeto teve uma atualização',
    body: 'A {{empresa}} atualizou o andamento do projeto {{projeto}}: {{oQue}}.\n\nVeja tudo no seu portal.',
  },
  project_delivered: {
    key: 'project_delivered',
    label: 'Projeto entregue',
    audience: 'cliente',
    vars: ['cliente', 'empresa', 'projeto'],
    subject: '{{empresa}} · projeto {{projeto}} concluído',
    title: 'Projeto concluído!',
    body: '{{cliente}}, foi um prazer trabalhar com você. O projeto {{projeto}} foi entregue pela {{empresa}}.\n\nNo portal você encontra o resumo de tudo que foi feito.',
  },
  payment_reminder: {
    key: 'payment_reminder',
    label: 'Lembrete de vencimento',
    audience: 'cliente',
    vars: ['empresa', 'projeto', 'cobranca', 'valor', 'vencimento', 'dias'],
    subject: '{{empresa}} · {{cobranca}} vence em {{dias}}',
    title: 'Sua próxima parcela está chegando',
    body: 'Passando pra lembrar: a cobrança {{cobranca}} do projeto {{projeto}} ({{valor}}) vence em {{vencimento}}.\n\nVocê pode pagar e registrar o comprovante direto no portal.',
  },
  renewal_interest: {
    key: 'renewal_interest',
    label: 'Cliente quer continuar',
    audience: 'dono',
    vars: ['cliente', 'projeto'],
    subject: '{{cliente}} quer continuar o projeto',
    title: 'Interesse em continuar',
    body: '{{cliente}} sinalizou no portal que quer continuar/renovar o projeto {{projeto}}.',
  },
  welcome: {
    key: 'welcome',
    label: 'Boas-vindas (cadastro)',
    audience: 'dono',
    vars: ['nome'],
    subject: 'Bem-vindo à NEX',
    title: 'Sua conta está pronta',
    body: 'Olá, {{nome}}! Sua conta na NEX foi criada. A partir de agora você monta propostas, acompanha a execução e recebe pagamentos num lugar só.\n\nComece cadastrando seus serviços e seu primeiro cliente.',
  },
};

function subst(text: string, vars: Record<string, string | undefined>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '');
}

export interface RenderedEmail {
  enabled: boolean;
  subject: string;
  title: string;
  bodyParagraphs: string[];
}

/**
 * Resolve o template (override da empresa ou padrão), aplica as variáveis e
 * devolve as partes prontas. Se `enabled` for false, o mailer nem envia.
 */
export async function renderEmailTemplate(
  companyId: string,
  key: EmailKey,
  vars: Record<string, string | undefined>,
): Promise<RenderedEmail> {
  const def = EMAIL_TEMPLATES[key];
  let subject = def.subject;
  let title = def.title;
  let body = def.body;
  let enabled = true;

  try {
    const override = await prisma.emailTemplate.findUnique({
      where: { companyId_key: { companyId, key } },
    });
    if (override) {
      enabled = override.enabled;
      if (override.subject.trim()) subject = override.subject;
      if (override.title.trim()) title = override.title;
      if (override.body.trim()) body = override.body;
    }
  } catch {
    /* sem override — usa o padrão */
  }

  return {
    enabled,
    subject: subst(subject, vars).trim(),
    title: subst(title, vars).trim(),
    bodyParagraphs: subst(body, vars)
      .split(/\n{2,}/)
      .map((p) => p.replace(/\n/g, '<br>').trim())
      .filter(Boolean),
  };
}
