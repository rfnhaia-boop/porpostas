// Cliente mínimo do Groq (API compatível com OpenAI). Sem SDK — só fetch.
// Ravi usa isto pra conversar e chamar ferramentas.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.RAVI_MODEL || 'openai/gpt-oss-120b';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
}

export interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string; // JSON string
}

export interface GroqReply {
  content: string | null;
  toolCalls: ToolCall[];
}

export function raviEnabled(): boolean {
  return !!process.env.GROQ_API_KEY;
}

/** Uma rodada de conversa. Nunca lança — devolve erro no content. */
export async function groqChat(
  system: string,
  messages: ChatMessage[],
  tools?: ToolDef[],
): Promise<GroqReply> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return { content: 'O assistente está desligado (falta a chave do Groq).', toolCalls: [] };

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: system }, ...messages],
        temperature: 0.3,
        max_tokens: 900,
        ...(tools?.length
          ? {
              tools: tools.map((t) => ({
                type: 'function',
                function: { name: t.name, description: t.description, parameters: t.parameters },
              })),
              tool_choice: 'auto',
            }
          : {}),
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('[ravi] groq', res.status, txt.slice(0, 300));
      return { content: 'Tive um problema pra pensar agora. Tenta de novo?', toolCalls: [] };
    }

    const json = await res.json();
    const msg = json?.choices?.[0]?.message ?? {};
    const toolCalls: ToolCall[] = Array.isArray(msg.tool_calls)
      ? msg.tool_calls
          .filter((c: { type?: string }) => c?.type === 'function')
          .map((c: { id: string; function: { name: string; arguments: string } }) => ({
            id: c.id,
            name: c.function?.name,
            arguments: c.function?.arguments ?? '{}',
          }))
      : [];

    return { content: typeof msg.content === 'string' ? msg.content : null, toolCalls };
  } catch (err) {
    console.error('[ravi] falha:', err);
    return { content: 'Não consegui responder agora. Tenta de novo em um instante.', toolCalls: [] };
  }
}
