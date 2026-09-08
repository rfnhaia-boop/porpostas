import { NextRequest } from 'next/server';
import { getCurrentCompanyId } from '@/lib/company';
import { groqChat, raviEnabled, type ChatMessage } from '@/lib/ravi/groq';
import {
  RAVI_ONBOARDING_SYSTEM,
  RAVI_ONBOARDING_TOOLS,
  toContextDraft,
  buildContextText,
} from '@/lib/ravi/onboardingPrompt';

const MAX_MSGS = 24;
const MAX_LEN = 4000;

// Conversa de descoberta da empresa. Não grava nada — devolve o rascunho do perfil
// pra tela; quem confirma é o dono (PUT /api/ravi/context).
export async function POST(req: NextRequest) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  if (!raviEnabled()) return Response.json({ error: 'Havi indisponível no momento.' }, { status: 503 });

  const body = await req.json().catch(() => null);
  const raw = Array.isArray(body?.messages) ? body.messages : null;
  if (!raw) return Response.json({ error: 'Envio inválido.' }, { status: 400 });

  const messages: ChatMessage[] = raw
    .slice(-MAX_MSGS)
    .filter(
      (m: unknown): m is { role: string; content: string } =>
        !!m &&
        typeof (m as { content?: unknown }).content === 'string' &&
        ((m as { role?: unknown }).role === 'user' || (m as { role?: unknown }).role === 'assistant'),
    )
    .map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content.slice(0, MAX_LEN),
    }));

  if (!messages.length) return Response.json({ error: 'Sem mensagem.' }, { status: 400 });

  const { content, toolCalls, ok } = await groqChat(
    RAVI_ONBOARDING_SYSTEM,
    messages,
    RAVI_ONBOARDING_TOOLS,
  );

  const draft = toContextDraft(toolCalls);
  const reply =
    content?.trim() ||
    (draft
      ? 'Montei um perfil da sua empresa aqui embaixo — confere, ajusta o que quiser e salva.'
      : ok
        ? 'Me conta um pouco mais.'
        : 'Tive um problema pra pensar agora. Tenta de novo?');

  return Response.json({
    reply,
    contextDraft: draft
      ? { resumo: draft.resumo, nomeEmpresa: draft.nomeEmpresa, tomDeVoz: draft.tomDeVoz, text: buildContextText(draft) }
      : null,
  });
}
