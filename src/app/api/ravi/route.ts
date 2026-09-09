import { NextRequest } from 'next/server';
import { getCurrentCompany } from '@/lib/company';
import { groqChat, raviEnabled, type ChatMessage } from '@/lib/ravi/groq';
import { RAVI_TOOLS, runRaviTools } from '@/lib/ravi/tools';
import { raviServiceSystem } from '@/lib/ravi/systemPrompt';

export async function GET() {
  return Response.json({ enabled: raviEnabled() });
}

const MAX_MSGS = 30;
const MAX_LEN = 4000;

export async function POST(req: NextRequest) {
  const company = await getCurrentCompany();
  if (!company) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  if (!raviEnabled()) return Response.json({ error: 'Ravi indisponível no momento.' }, { status: 503 });

  const system = raviServiceSystem(company.haviContext);

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

  // Loop de ferramentas: o modelo pode rascunhar em várias rodadas (ex.: 1 cliente + N serviços de um contrato).
  const convo: ChatMessage[] = [...messages];
  const drafts: ReturnType<typeof runRaviTools> = [];
  let finalContent: string | null = null;

  for (let round = 0; round < 3; round++) {
    const { content, toolCalls, rawToolCalls, ok } = await groqChat(system, convo, RAVI_TOOLS);
    // Se deu erro/limite no meio do loop mas já temos rascunhos, para e entrega o que tem.
    if (!ok) {
      if (drafts.length) break;
      finalContent = content;
      break;
    }
    finalContent = content;
    if (!toolCalls.length) break;

    drafts.push(...runRaviTools(toolCalls));
    convo.push({ role: 'assistant', content: content ?? '', tool_calls: rawToolCalls });
    for (const c of toolCalls) {
      convo.push({ role: 'tool', tool_call_id: c.id, name: c.name, content: 'rascunho preparado' });
    }
  }

  let reply =
    finalContent?.trim() ||
    (drafts.length
      ? drafts.length === 1
        ? 'Preparei o rascunho abaixo — confere e salva.'
        : `Preparei ${drafts.length} rascunhos — confere e salva. Se faltou algum item, me fala.`
      : 'Pode me contar um pouco mais?');

  // O modelo termina com "OPÇÕES: a | b | c" quando a resposta é um conjunto pequeno.
  // Vira botões no app; a linha sai do texto.
  let options: string[] = [];
  const m = reply.match(/(?:^|\n)\s*OP[ÇC][ÕO]ES\s*:\s*(.+?)\s*$/i);
  if (m) {
    options = m[1]
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);
    reply = reply.slice(0, m.index).trim() || reply.replace(m[0], '').trim();
  }

  return Response.json({ reply, options, drafts });
}
