# Havi no Fechô — mapa de possibilidades

*O que o Havi pode fazer em cada parte do sistema. Nada aqui está implementado além da Fase 1 (criar serviço). Serve pra você decidir o que vale e em que ordem.*

**Regra que vale pra tudo:** o Havi **rascunha / propõe**, você (ou o cliente) **confirma**. Ele nunca grava sozinho. As ferramentas de escrita chamam os endpoints que já existem — a validação e o `companyId` da sessão continuam num lugar só.

---

## 1. Dono — antes de enviar (catálogo, clientes, orçamento)

| Você fala | Havi faz | Guardrail |
|---|---|---|
| "gestão de tráfego, mensal, R$ 1.500" | rascunha o **serviço** ✅ *(feito)* | rascunho → você salva |
| *(cola um texto / fala)* "eu vendo site, social media e tráfego, cada um assim…" | rascunha **vários serviços** de uma vez | idem |
| "cadastra o cliente: Padaria Trigo, contato Marina, marina@…" | rascunha o **cliente** | idem |
| "monta um orçamento pra Padaria Trigo com site + gestão, projeto fechado, 50/50" | pré-monta o **quoteDraft** (cliente + itens do catálogo + modelo comercial) e abre o preview | nunca envia; você revisa e envia |
| "qual serviço eu uso pra quem quer 'aparecer no Google'?" | sugere itens do catálogo que encaixam | leitura, sem escrita |

---

## 2. Dono — depois de aprovado (andamento, entregas, cobrança)

| Você fala | Havi faz | Guardrail |
|---|---|---|
| "registra setembro do projeto da Padaria: entreguei o logo e 3 artes, link tal" | rascunha o **andamento do mês** (resumo + entregas com link) | rascunho → você publica |
| "marca o bloco 'implantação' como feito, link X" | marca a **etapa/bloco** como concluída | confirma |
| "quem tá me devendo?" / "o que vence essa semana?" | lê os **pagamentos** e te dá a lista (em aberto, atrasado, a vencer) | só leitura |
| "manda o lembrete de pagamento pro fulano" | dispara o **lembrete** daquela cobrança (mesmo caminho do cron) | confirma antes |
| "esse projeto acabou, gera a proposta de continuação" | **clona como rascunho** a proposta de continuação | não envia |
| "escreve o resumo de valor pra imprimir pro cliente" | monta o texto do **relatório de encerramento** | você revisa |

---

## 3. Dono — dashboard / decisão

| Você fala | Havi faz |
|---|---|
| "como tá o mês?" | resume os números do painel em linguagem (fechado, a receber, atrasado, conversão) e aponta o que precisa de atenção |
| "qual cliente rende mais?" / "que serviço vende mais?" | responde a partir dos rankings que o painel já calcula |
| "por que caiu o faturamento?" | cruza propostas enviadas × aprovadas × prazos e dá uma hipótese |

*Tudo leitura — o Havi vira uma camada de conversa em cima da inteligência que já existe no Dashboard.*

---

## 4. Dono — disparos (e-mail / WhatsApp)

| Você fala | Havi faz | Guardrail |
|---|---|---|
| "deixa a mensagem de cobrança mais firme, sem ser grosso" | reescreve o **template** de WhatsApp/e-mail (mantendo as variáveis `{{…}}`) | rascunho → você salva o template |
| "escreve uma mensagem pro cliente X sobre o atraso da entrega" | monta a mensagem já com os dados daquele projeto | você copia/envia |

---

## 5. Cliente — no portal (concierge, **não** editor)

O portal tem login próprio (do cliente). Aqui o Havi é **atendimento**, não operador: ele **lê a proposta/projeto do cliente e redige textos**, mas **nunca muda valores, itens ou status**.

| O cliente fala | Havi faz | Guardrail |
|---|---|---|
| "o que tá incluído nesse valor?" / "o que NÃO tá incluído?" | responde a partir do conteúdo da proposta dele | só a proposta dele; nada de outros clientes ou da agência |
| "quando vence o primeiro pagamento?" | responde do calendário de cobranças | leitura |
| "quero pedir pra mudar o prazo pra 30 dias" | redige o **pedido de alteração** (o "solicitar alteração" que já existe) com o texto formatado; o cliente confirma o envio | não altera a proposta — só manda o pedido pro dono |
| "posso pagar dia 15?" *(quando o vencimento é "cliente escolhe")* | ajuda a escolher a **data do 1º vencimento** no aceite | dentro da janela permitida |
| "como tá meu projeto?" | resume o andamento e as entregas do mês | leitura do projeto dele |
| "quero deixar uma avaliação" | ajuda a redigir a **avaliação mensal** | o cliente confirma |

**O que o Havi do cliente NÃO faz:** mexer em preço, item, desconto, prazo contratual, status; ver qualquer dado que não seja da proposta/projeto daquele cliente; falar de política comercial da agência.

---

## 6. Transversal (vale em qualquer tela)

- **Voz em tudo** — o botão de microfone (Whisper) em qualquer chat do Havi. Você fala, ele monta.
- **Busca por conversa** — "acha a proposta da padaria", "abre o projeto do João".
- **Lembrete** — "me lembra de cobrar o fulano dia 10" → cria uma notificação/entrada de agenda.

---

## Ordem sugerida pra construir

| Fase | Entrega | Nota |
|---|---|---|
| **1** ✅ | Criar serviço conversando | feito |
| **2** | Ditado por voz ligado em tudo + ler texto colado → cliente/serviços | Whisper já está na chave |
| **3** | Montar orçamento pelo Havi (pré-monta o quoteDraft) | reusa o catálogo |
| **4** | Pós-aprovado: registrar andamento + "o que está pendente" + disparar lembrete | maior valor no dia a dia |
| **5** | Dashboard conversacional ("como tá o mês?") | rápido — é só ler o que o painel já calcula |
| **6** | Havi no portal do cliente (concierge, leitura + redigir pedidos) | precisa da camada de guardrail do cliente |
| **7** | Disparos: reescrever templates; encerramento/continuação | polimento |

---

## Decisões pra você

1. Alguma dessas você **corta** de cara (não quer)?
2. Depois da fase 2 (voz + colar texto), vamos por **orçamento** (fase 3) ou pula pro **pós-aprovado** (fase 4)?
3. Havi no **portal do cliente** — topa que ele responda o cliente, ou por enquanto Havi é só pra você (dono)?
