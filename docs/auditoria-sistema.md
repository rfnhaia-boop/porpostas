# Auditoria do sistema — Fechô

Camada executiva. O detalhe técnico linha-a-linha está em [`auditoria-codigo.md`](./auditoria-codigo.md).
Feito com: subagente lendo o código todo + passada ao vivo no navegador (desktop 1035px, tablet, mobile 375px).

---

## 1. Lógica principal do sistema (mapa)

**Dono** monta no painel `(app)`:
- `clients` / `services` (catálogo) — guardados no Zustand `usePlatformStore` + API.
- `quotes/new` (wizard 2 passos: cliente → `CommercialEditor` + "início do projeto" + itens) → `quotes/preview` (escolhe template, salva/envia). A proposta só é criada no banco no **preview** (`api.proposals.create`).
- Estados da proposta: `draft → sent → approved → in_progress → delivered` (+ `declined`, `changes_requested`).

**Cliente** recebe o link público `/p/<token>` (o token é a credencial; `accessPhrase` opcional):
- Lê a proposta (template ou `CommercialProposal` interativo), responde em `/api/p/<token>/respond`.
- Ao aprovar → `/p/<token>/success` cria a conta do portal (e-mail+senha ou Google) → `/portal`.

**Portal do cliente** (`client_session` JWT):
- Cockpit: gate de contrato, andamento (blocos + diário), cronograma financeiro (registra pagamento → anexa comprovante → "em análise" → dono confirma), avaliação mensal.

**Dono acompanha** em `/approved` e `/approved/[id]` (+ `ExecutionModal` = contrato e cobrança). `/dispatches` edita os textos dos e-mails automáticos. `/settings` = dados da empresa, logo, PIX.

**Trava de contrato** (feito hoje): se ligada na proposta, o aceite **não** inicia a execução — o dono anexar o contrato assinado é o que dá o start.

---

## 2. Bugs — o que precisa arrumar

### 🔴 CRÍTICO — segurança / perda de dado (precisa da tua decisão antes de eu mexer)

| # | Onde | Problema | Fix proposto |
|---|---|---|---|
| C1 | `src/lib/auth.ts:41-52` | **Sequestro de empresa no cadastro.** Todo signup novo "adota" a 1ª `Company` sem usuários. Qualquer empresa sem dono (seed, dono removido) é assumida inteira — clientes, propostas, contratos, PIX — pelo próximo cadastro do mundo. | Todo signup cria uma `Company` nova e vazia. Nunca adotar empresa existente. (migração: checar se hoje tem empresa órfã no banco) |
| C2 | `api/portal/auth/google/callback/route.ts:24-32` | **Sequestro do portal do cliente.** Com o link público, qualquer um loga com qualquer conta Google e o callback faz `client.update({ email })` — rouba o cadastro do cliente (contratos, pagamentos, todas as propostas). Sem checar `accessPhrase` nem aceite. | Exigir que a proposta esteja `approved` **e** (se tiver) `accessPhrase` já validada; nunca sobrescrever `client.email` — vincular por conta, não reescrever. |
| C3 | `api/p/[token]/setup-account/route.ts:22-43` | Mesmo sequestro via e-mail/senha. Sobrescreve `client.email`/`passwordHash` sem validar posse nem tamanho de senha. **+ `console.log` vazando o token em produção** (linhas 20,21,26). | Mesmas travas do C2 + validar `password.length >= 8`. **Os `console.log` eu removo já (baixo risco).** |
| C4 | `settings/page.tsx` + `api/company/logo/route.ts:35-38` | Logo da empresa gravado no filesystem local (`public/uploads/`). Some em redeploy / não funciona serverless. A marca do cliente do teu cliente desaparece. | Guardar no banco como blob (igual contrato e recibo já são), ou storage externo. |

### 🟠 ALTO — corrijo agora (baixo risco)

| # | Onde | Problema |
|---|---|---|
| A1 | `proxy.ts:6` | `/landing` bloqueada pra quem não tá logado — a página de marketing só abre pra quem já tem conta. Adicionar a `PUBLIC_PATHS`. |
| A2 | `p/[token]/CommercialProposal.tsx:11` | `key={JSON.stringify([...])}` remonta o formulário de resposta a cada clique em adicional/pacote → **apaga a observação digitada, desmarca "li e concordo", zera a data escolhida**. Tirar o `key`. |
| A3 | `store/usePlatformStore.ts:190-202` | `hydrate()` sem caminho de erro: se qualquer chamada falha, `hydrated` nunca vira `true` e Dashboard/Clientes/Serviços/Configurações ficam em "Carregando…" **pra sempre**. Adicionar flag de erro + retry. |
| A4 | 3 telas | Excluir **cliente / serviço / proposta** sem `confirm()` — um toque apaga em cascata. Adicionar confirmação. (Plano de cobrança e recibo do cliente ficam pra próxima — arquivos co-editados.) |
| A5 | `p/[token]/page.tsx:63` | `parseCommercial` faz `throw` no server render → proposta com `commercial` corrompido derruba a página inteira (500). Envolver em try/catch e degradar. |

### 🟡 MÉDIO — corrijo agora os baratos, resto listado

- **i18n plural:** "1 Serviços Incluídos" / "1 ITENS" (deveria singular). `proposals/page.tsx`, `CommercialEditor`.
- **Fuso horário** (transversal): mistura `timeZone:'UTC'` com formatação local trocadas. Cobrança que vence **hoje** aparece "1d atrás" no Dashboard e entra em "atrasado" (`analytics.ts:90-91,202-203`). `approved/[id]` formata `respondedAt`/`paidAt` em UTC (dia errado à noite). → padronizar: data pura = UTC, timestamp = local.
- **`parseCents` ambíguo** (`CockpitClientView.tsx:54`): cliente digita `1.500` → R$ 15,00; digita `1500.50` → R$ 1.500,50. Erro de valor em dinheiro. → máscara de moeda decente.
- **Editar/clonar proposta perde campos comerciais dos itens** (`proposals/page.tsx:114`, `approved/[id]/page.tsx:72`): falta `billingType/optional/selected/packageId/order` → adicionais viram obrigatórios, pacote some.
- **`quotes/preview` cria proposta duplicada** em 2 cliques rápidos (`previewClientView` sem guarda).
- **`api.proposals.update` não aceita `clientId`** → trocar o cliente ao editar não persiste.
- **Debounce de `/settings` perde a última edição** se trocar de página antes de 600ms.
- **`/settings` `dirty.current` nunca volta a `false`** → tela não re-sincroniza com o banco.
- **`dispatches`: não valida `{{variável}}`** contra as permitidas — var errada vai crua pro e-mail.
- **Estado local de prop sem re-sync** (`useState(prop)` sem `key`): `EmailTemplatesSettings`, `AvaliacaoView`, `MonthReviewBlock`, `ExecutionModal.PixBox`.
- **`fetch` sem timeout** em toda a `api.ts` → botão trava pra sempre se a requisição pendura.
- **`ExecutionModal`: marcar pago manual é rebaixado** se o cliente anexa recibo depois (`paymentStatus.ts:31` só protege `pending→paid`).
- **Nome de arquivo de contrato sem sanitizar** no `Content-Disposition` (header injection, risco baixo).
- **`crypto.randomUUID()` sem guarda** (`CommercialEditor.tsx:186`) → quebra em Safari antigo / contexto inseguro.

### 🟢 BAIXO
~55 itens em `auditoria-codigo.md` (keys por índice, `catch(err:any)` vazando "Failed to fetch", falta "esqueci a senha", data hardcoded em termos/privacidade, e-mail de contato divergente `new.flow.sys` vs `new.company.sys`, etc).

---

## 3. Responsivo — o que quebra

| Tela | Larg. | Problema |
|---|---|---|
| **Dashboard** | 375 | `OnboardingChecklist`: 1º item quebra 1 palavra por linha, botão CTA espreme o texto pra ~40px. Blocos "Saúde dos pagamentos" e cards de stat com `grid-cols-2` **fixo** (nunca vira 1 coluna). Números `whitespace-nowrap` de 7 dígitos transbordam. |
| **/services** | ~1000–1200 | Botões do header (CRIAR COM O HAVI / NOVO SERVIÇO / NOVO PRODUTO) não fazem wrap e não cabem → scrollbar horizontal na página. Mobile ok. |
| **/settings** | desktop/tablet | Layout 2 colunas: títulos da coluna esquerda **cortados** ("DADOS INSTITUCIO…", "MOTOR DE SINCRONIZAÇ…"), valores dos campos cortados (CNPJ, telefone, e-mail, chave PIX), seção PIX sai do card + muito preto vazio. Mobile (1 coluna) ok. |
| **/quotes/new passo 2** | desktop | 5 cards de modelo comercial em row sem wrap → títulos cortados ("Implantaç…", "comparat…", "Orçament…"). Textarea "ENTREGÁVEIS" com **fundo branco** no tema escuro. Erro de validação aparece longe do campo. |
| **/services** form | telas baixas | Modal de edição sem `max-h`/scroll interno → botão salvar abaixo da dobra. Preço em fonte 60px + "R$" ao lado estoura a linha em 320px. |
| **/havi** | mobile | `h-[calc(100dvh-0px)]` ignora a MobileBar (~49px) → composer some atrás da barra do browser. |
| **/p/[token]** | 320 | Barra sticky do topo sem `truncate`. Templates com `max-w-[21cm]` / `min-h-[29.7cm]` → scroll vertical vazio. `TemplateDetalhado`: em <sm os itens da tabela empilham **sem cabeçalho de coluna**. |
| **Portal cockpit** | mobile mid | Blur em cascata (`backdrop-blur-[8px]` + `blur(40px)` por card) trava o scroll. `EntryRow`: 3 botões + status quebram em 2 linhas apertadas. |

---

## 4. Páginas que valem um redesign — prompts prontos pro Gemini

### 4.1 — `/settings` (Configurações) — prioridade alta

> Redesenhe a página de Configurações de um SaaS B2B (tema escuro, acento laranja `#FF6A00`, estética "glass" discreta). É um formulário de identidade da empresa: Razão social / nome fantasia, CNPJ/CPF, Telefone/WhatsApp, E-mail corporativo (com status "confirmado / não confirmado" + botão reenviar), Logo (campo URL + upload de imagem até 1MB com preview), e um bloco PIX (tipo da chave [select: CPF/CNPJ/e-mail/telefone/aleatória], chave, nome do recebedor, cidade do recebedor, + preview do QR Code PIX).
> Problemas do layout atual a resolver: (1) layout de 2 colunas em que os títulos e os valores dos campos ficam **cortados** em telas de 1000–1400px; (2) campos "expansivos" com fonte gigante (24–32px) que fazem 12 campos ocuparem 3 telas; (3) nenhum botão "Salvar" claro nem feedback de "salvo" por campo; (4) muito peso visual (glow, blur pesado) num form simples.
> Requisitos: 1 coluna de conteúdo com largura máx. legível (~640px), campos em tamanho normal, agrupados em seções com card discreto ("Dados da empresa", "Marca", "Recebimento PIX"). Cada seção salva sozinha com indicador sutil de estado (salvando / salvo). Preview do QR ao lado dos campos do PIX. Responsivo 320→1440. Entregar HTML + Tailwind, sem libs.

### 4.2 — `Dashboard` (`/`) — prioridade alta

> Redesenhe o Dashboard de um SaaS de propostas comerciais (tema escuro, acento laranja `#FF6A00`). Hoje são ~9 blocos empilhados com o **mesmo peso visual** (todos `card glass rounded-3xl p-6`), sem hierarquia, e o bloco "Precisa de atenção" (propostas paradas, cobranças atrasadas) fica no rodapé.
> Dados disponíveis: total de clientes, serviços, propostas geradas, aguardando resposta (com R$ em negociação), aprovadas (com R$ fechado), contratos fechados/mês (6 meses), faturamento recebido/mês (6 meses), saúde dos pagamentos (a receber no prazo / atrasado / recebido no mês / aguardando conferência), próximos recebimentos (lista), satisfação média (nota /5), melhores clientes, serviços que mais vendem, taxa de conversão, ticket médio, tempo médio de resposta e de execução, e alertas ("precisa de atenção").
> Requisitos: (1) uma faixa de 4 KPIs no topo (os números que o dono olha todo dia); (2) os alertas logo abaixo dos KPIs, não no fim; (3) o resto em grid com pesos diferentes (gráficos maiores, listas menores); (4) mobile: tudo 1 coluna, KPIs em 2×2, nenhum número transbordando; (5) gráficos de barra com rótulo de valor visível (não só no hover). HTML + Tailwind, sem libs de gráfico (barras em div).

### 4.3 — `/quotes/new` passo 2 (editor comercial) — prioridade média

> Redesenhe o passo 2 do wizard "Novo Orçamento" de um SaaS (tema escuro, acento `#FF6A00`). Contém, em sequência: (a) escolher o **modelo comercial** entre 5 opções (Projeto fechado / Serviço mensal / Implantação + mensalidade / Pacotes comparativos / Orçamento por itens) — cada uma com título + 1 linha de descrição; (b) config de vencimento (modo: data fixa / fim do mês / cliente escolhe; + data; + parcelas); (c) 2 textareas "O que não está incluído" e "Revisões e alterações de escopo"; (d) bloco "Início do projeto" (2 opções radio); (e) lista de serviços do catálogo pra adicionar, cada um com quantidade; (f) totais (valor único / mensalidade / total no período).
> Problemas a resolver: os 5 cards de modelo ficam numa row sem wrap e os títulos **cortam**; as textareas têm fundo branco no tema escuro; o erro de validação aparece longe do campo; é uma rolagem longa sem navegação; não dá pra ver o total enquanto monta.
> Requisitos: os 5 modelos em grid que colapsa (1/2/3 colunas), título nunca cortado; inputs e textareas com o tema escuro; um resumo de total **sticky** (rodapé ou lateral) sempre visível; erros de validação inline no campo. Responsivo 320→1440. HTML + Tailwind.

### 4.4 — `/proposals` (Histórico) — prioridade média

> Redesenhe a lista "Histórico de Propostas" de um SaaS (tema escuro, `#FF6A00`). Cada proposta tem: número, título, cliente (pode estar "removido"), data, status (rascunho/enviada/aprovada/entregue/recusada/mudança pedida), valor, "visualizada há Xd", nº de serviços.
> Problemas: hoje **clicar no card inteiro = "enviar proposta"** (gesto perigoso e não óbvio, ao lado de ícones minúsculos de editar e excluir); não há filtro/busca/ordenação; alturas de card desiguais; exclusão sem confirmação.
> Requisitos: cabeçalho com busca + filtro por status + ordenação; card com **menu de ações explícito** (Abrir / Editar / Copiar link / Enviar / Excluir) em vez de card-clicável; badge de status legível; alturas uniformes; mobile 1 coluna. HTML + Tailwind.

### 4.5 — Portal do cliente: `MonthCard` (cronograma financeiro) — prioridade média

> Redesenhe o card de um mês de cobrança no portal do cliente de um SaaS (tema escuro, `#FF6A00`, visual "glass"). Um mês pode estar em vários estados: em aberto (sem nada) / cliente registrando pagamento (escolhe 1–4 parcelas → linhas de valor+forma+data) / com comprovantes anexados "em análise" / quitado / valor das parcelas não bate com o valor do mês. Também tem um bloco de avaliação do mês (estrelas + comentário) que aparece quando quitado.
> Problema: a lógica de qual sub-bloco mostrar é confusa e o cliente pode ficar sem um CTA claro num estado intermediário; quando as parcelas não somam o valor do mês, o aviso é vermelho mas não tem botão pra ajustar ali.
> Requisitos: um estado visual por vez, sempre com 1 CTA primário claro ("Registrar pagamento" / "Anexar comprovante" / "Ajustar parcelas" / "Avaliar o mês"); o aviso de valor divergente com o botão de ajuste embutido; mobile-first (a maioria abre no celular). HTML + Tailwind.

### 4.6 — Outras (prompts menores, se quiser)
- **`/services` form**: unificar os dois "idiomas" de input (campos sleek com borda inferior × campos laranja de 60px); modal com `max-h-[90vh] overflow-y-auto`.
- **`/p/[token]` `ClientResponse`**: tirar (ou tornar dispensável e rodar 1x só) o "guia" que borra o card por 4s e pisca uma mãozinha; hoje reinicia a cada clique.
- **Templates** (`TemplateDetalhado` e afins): no mobile, cada item da tabela precisa mostrar o rótulo da coluna (Item / Qtd / Subtotal); revisar `max-w-[21cm]`/`min-h-[29.7cm]` que geram scroll vazio.

---

## 5. Ordem sugerida

1. **C1–C4** (segurança) — decidir o modelo com você, depois eu implemento + testo.
2. **A1–A5** — corrijo já (baixo risco), testo, subo.
3. Fuso horário + `parseCents` + editar/clonar proposta — lote médio.
4. Redesign das telas (4.1 e 4.2 primeiro) — você roda no Gemini, eu integro.
5. Faxina dos 🟢 baixos aos poucos.
