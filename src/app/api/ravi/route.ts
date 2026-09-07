import { NextRequest } from 'next/server';
import { getCurrentCompanyId } from '@/lib/company';
import { groqChat, raviEnabled, type ChatMessage } from '@/lib/ravi/groq';
import { RAVI_TOOLS, runRaviTool } from '@/lib/ravi/tools';
import { RAVI_SERVICE_SYSTEM } from '@/lib/ravi/systemPrompt';

export async function GET() {
  return Response.json({ enabled: raviEnabled() });
}

const MAX_MSGS = 30;
const MAX_LEN = 4000;

export async function POST(req: NextRequest) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  if (!raviEnabled()) return Response.json({ error: 'Ravi indisponível no momento.' }, { status: 503 });

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

  const { content, toolCalls } = await groqChat(RAVI_SERVICE_SYSTEM, messages, RAVI_TOOLS);

  const drafted = toolCalls.map(runRaviTool).find((r) => r.draft)?.draft ?? null;

  return Response.json({
    reply:
      content?.trim() ||
      (drafted ? 'Preparei o rascunho abaixo — confere e salva.' : 'Pode me contar um pouco mais?'),
    draft: drafted,
  });
}
