# Auditoria de código — Fechô

Auditoria estática (read-only) do app Next.js 16 em `src/`. Cobre as páginas do painel do dono `(app)`, autenticação `(auth)`, proposta pública `p/[token]`, portal do cliente `portal/`, páginas de marketing e os módulos compartilhados (`lib/`, `store/`, `components/`).

Convenção de severidade: **Alta** = crash, perda de dado, furo de isolamento ou dinheiro errado em produção; **Média** = quebra de fluxo, estado corrompido, race recuperável; **Baixa** = detalhe de UX/robustez.

---

## Bugs críticos

Lista consolidada do que trava, perde dado ou fura o isolamento entre empresas. Ordenada por gravidade.

1. **Sequestro de tenant no cadastro do dono** — `src/lib/auth.ts:41-52`. O hook `databaseHooks.user.create.before` faz todo novo usuário "adotar" a primeira `Company` sem usuários (`where: { users: { none: {} } }`). Qualquer empresa que fique sem nenhum usuário (dono removido, empresa de seed, empresa criada e abandonada) é assumida **inteira** — clientes, propostas, contratos, chave PIX — pelo próximo cadastro aleatório do mundo. É o pior tipo de furo multi-tenant: silencioso e retroativo.

2. **Sequestro do Portal do Cliente pelo callback do Google** — `src/app/api/portal/auth/google/callback/route.ts:24-32`. No ramo `state.startsWith('setup:')` (link montado pela tela `/p/[token]/success`), **qualquer pessoa que tenha o link público** abre `/api/portal/auth/google?token=<token>`, autentica com **uma conta Google qualquer** e o callback roda `prisma.client.update({ where: { id: proposal.clientId }, data: { email } })`: sobrescreve o e-mail do cadastro do cliente com o do atacante e cria a sessão dele. Ele passa a ver contrato, histórico de pagamentos, recibos e **todas as propostas** daquele cadastro de cliente — e o cliente real perde o acesso. Não há verificação de `accessPhrase`, nem de que a proposta foi aceita, nem de posse.

3. **Mesmo sequestro pelo `setup-account`** — `src/app/api/p/[token]/setup-account/route.ts:22-43`. `POST { email, password }` sobrescreve `client.email` e `client.passwordHash` sem validar posse, sem `accessPhrase`, sem exigir que a proposta esteja `approved`. Além disso deixa `console.log("[DEBUG] rawToken:", ...)` / `"[DEBUG] extracted token:"` / `"[DEBUG] proposal found:"` (linhas 20, 21, 26) — vaza o token da proposta nos logs de produção.

4. **`/p/[token]/success` sem nenhuma verificação** — `src/app/p/[token]/success/page.tsx` inteiro. Página client-side pura; não confere sessão nem `status === 'approved'`. É o veículo de entrega dos itens 2 e 3: um terceiro com o link cria "a conta do cliente" antes mesmo de existir aceite.

5. **`ClientResponse` remonta e apaga a resposta do cliente** — `src/app/p/[token]/CommercialProposal.tsx:11`. `<ClientResponse key={JSON.stringify([q.commercial?.selectedPackage, ...optionalIds])} .../>` força **remonte completo** do formulário toda vez que o cliente marca/desmarca um adicional ou troca de pacote: perde a observação já digitada, desmarca "Li e concordo", zera a data de 1º vencimento escolhida (`dueDate`) e reinicia o guia animado de ~10s. O cliente pode acabar aprovando sem a data/observação que tinha preenchido.

6. **Total do orçamento pode ser gravado errado quando `commercialSchedule` divide parcela** — não é bug (a distribuição de centavos em `src/lib/commercial.ts:139-140` fecha exata). Mantido aqui só como item verificado e **descartado**.

7. **Fuso horário derruba "a receber" para "atrasado" no dia do vencimento** — `src/lib/analytics.ts:90-91` e `202-203`. `pay.dueDate` é data pura gravada como meia-noite UTC; `new Date(pay.dueDate)` vira `...T00:00Z`, que em BRT (UTC−3) é 21:00 do dia anterior. Comparado com `today` local, uma cobrança que vence **hoje** já aparece como vencida ("1d atrás") no Dashboard, e entra em `health.overdue`/`overdueCount`. Afeta números que o dono usa pra cobrar cliente. (Média, mas com impacto financeiro visível — daí constar aqui.)

---

## `src/proxy.ts` — guarda de rotas

### Lógica principal
- Middleware (`proxy`) roda para tudo que **não** casa `api|_next/static|_next/image|favicon.ico|p/|portal` (linha 28).
- `PUBLIC_PATHS = ['/privacidade', '/termos', '/uploads']` passa direto.
- `AUTH_PATHS = ['/login', '/signup']`: sem sessão → só essas; com sessão → redireciona pra `/`.
- Sessão detectada por `getSessionCookie(req)` do Better Auth (não valida assinatura, só presença do cookie).

### Bugs
- **`/landing` fica inacessível deslogado** — `src/proxy.ts:6,28`. `/landing` não está em `PUBLIC_PATHS` nem é excluído pelo `matcher`; visitante anônimo é redirecionado pra `/login`. A página de marketing (cujo público-alvo é justamente quem ainda não tem conta) está morta. **Alta** (quebra a porta de entrada do produto).
- **Guard só olha presença de cookie** — `src/proxy.ts:14`. `getSessionCookie` não verifica validade; um cookie `better-auth.session_token` qualquer engana o middleware. As rotas de API revalidam de verdade (`getCurrentCompanyId`), então o risco real é baixo, mas o `redirect(hasSession && isAuthPage → '/')` pode prender o usuário num loop se o cookie existe mas está expirado. **Baixa**.
- **`portal` excluído do matcher por prefixo cru** — `src/proxy.ts:28` usa `portal` sem barra: `/portalqualquercoisa` também escaparia do guard. Hoje não existe rota assim, mas é frágil. **Baixa**.

### Responsivo / UX
- N/A (sem UI).

---

## `src/app/(app)/page.tsx` — Dashboard

### Lógica principal
- Client component. Lê `clients`/`savedServices` do `usePlatformStore` (Zustand, hidratado por `StoreHydrator`) e `useQuery(['proposals'])` + `useQuery(['services'])`.
- Deriva ~15 métricas puras de `lib/analytics.ts`: `closedByMonth`, `revenueByMonth`, `paymentHealth`, `statusBreakdown`, `topClients`, `topServices`, `upcomingBills`, `satisfaction`, `avgTicket`, `staleProposals`, `analyzeServiceTimelines`, conversão, tempos médios.
- Renderiza cards de stats, 2 `MiniBarChart`, `StatusDonut`, `HBarList` (melhores clientes / serviços), bloco "Saúde dos pagamentos", "Próximos recebimentos", "Satisfação", e alertas ("Precisa de atenção").
- `OnboardingChecklist` no topo (localStorage `fecho-onboarding-hidden`).

### Bugs
- **Fuso: vencimento de hoje conta como atraso** — `src/lib/analytics.ts:90-91`, `202-203`. Ver crítico #7. `due < today` e `Math.round((due - today)/86_400_000)` ficam ~0,875 dia deslocados; "vence hoje" vira "1d atrás" e infla `overdue`/`overdueCount`.
- **`revenueByMonth` usa fuso local pra bucketizar `paidAt`** — `src/lib/analytics.ts:52-54` + `monthKey` (linha 14, `d.getMonth()` local). Pagamento confirmado perto da virada de mês em UTC pode cair no mês errado do gráfico. **Baixa**.
- **`stats.map((stat, i) => ... key={i})`** — `src/app/(app)/page.tsx:128`. `key` por índice; lista é estática, então inofensivo, mas é o padrão que se repete no arquivo. **Baixa**.
- **`sum(status)` recalcula em todo render sem `useMemo`** — `src/app/(app)/page.tsx:80-81` e todas as chamadas de analytics (94-107). Com muitas propostas cada render refaz tudo; sem virtualização e sem memo. **Baixa** (perf).
- **`compactBRL` divide por 100 e formata "k"/"M" sem tratar negativo** — `src/app/(app)/page.tsx:60-65`. Receita nunca é negativa aqui, ok, mas é frágil se algum dia entrar estorno.
- **Sem estado de erro nas queries** — `useQuery(['proposals'])` sem `isError`/`error`; se `/api/proposals` responde 401 (ex.: `companyId` nulo em signup recém-criado), o dashboard mostra tudo zerado e "Nenhuma proposta ainda" em vez de sinalizar falha de sessão. **Média**.

### Responsivo
- Grades colapsam bem (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- **Números grandes em `whitespace-nowrap`** — linhas 174, 183, 197: `text-lg sm:text-xl font-black ... whitespace-nowrap` dentro de card de 2 colunas (`grid-cols-2` fixo, linha 169). Em 320–360px, `R$ 1.234.567,89` transborda a coluna e pode empurrar scroll horizontal. O grid deveria virar 1 coluna abaixo de ~380px.
- `Icon size={64}` nos cards de stat com `opacity-20` — ok, mas some atrás do número em telas muito estreitas.
- Bloco "Saúde dos Pagamentos": `grid-cols-2` **fixo** (linha 169) nunca vira 1 coluna → 4 métricas apertadas no mobile.

### UX/UI a melhorar
- O Dashboard tem ~9 blocos empilhados sem hierarquia visual; tudo com o mesmo peso de `liquid-glass p-6 rounded-3xl`. Vale uma faixa de KPIs no topo (3–4 números) e o resto colapsável/abaixo da dobra.
- "Precisa de atenção" só aparece no fim da página — deveria estar perto do topo.
- `MiniBarChart`/`StatusDonut`/`HBarList` não têm tooltip nem eixo; um gráfico sem rótulo de valor obriga o `title` no hover (não funciona em toque).

---

## `src/app/(app)/havi/page.tsx` — Havi (assistente de catálogo)

### Lógica principal
- `useQuery(['company'])`. `hasContext = !!company?.haviContext`.
- Botão no topo abre `RaviOnboardingChat` (modal). Corpo é o `RaviServiceChat variant="page"` — chat que fala com `/api/ravi`, `/api/ravi/read-doc` (PDF/DOCX), `/api/ravi/transcribe` (áudio via MediaRecorder).
- Ao fechar o chat: `router.push('/')`.
- `RaviServiceChat` monta rascunhos de serviço/cliente e só persiste via `addSavedService`/`addClient` do store quando o usuário confirma no card.

### Bugs
- **`h-[calc(100dvh-0px)]` ignora a `MobileBar`** — `src/app/(app)/havi/page.tsx:18`. O layout `(app)` injeta uma `MobileBar` `sticky` de ~49px acima do conteúdo (`AppChrome`). No mobile o chat fica `100dvh` e estoura a viewport; o composer no rodapé some atrás da barra de navegação do browser. Deveria ser `h-[calc(100dvh-49px)]` ou `flex-1 min-h-0`.
- **`onClose` do chat sempre navega pra `/`** — `src/app/(app)/havi/page.tsx:43`. `RaviServiceChat` em `variant="page"` não tem botão de fechar visível fazendo sentido (é a página inteira), mas o header dele tem um `X` que dispara `router.push('/')` — sai da página inteira sem aviso, perdendo a conversa. **Média**.
- **Sem tratamento de `isError` na query de company** — se falha, `hasContext` fica `false` e o banner "O Havi ainda não conhece sua empresa" aparece mesmo que já tenha contexto. **Baixa**.
- **`RaviServiceChat`: `push` usa `messages` do closure** — `src/components/ravi/RaviServiceChat.tsx:104-108`. `const shown = [...messages, ...]` dentro de `push` async; se o usuário mandar 2 mensagens rápidas, a segunda parte de um `messages` desatualizado e perde a primeira. Deveria usar `setMessages(m => ...)`. **Média**.
- **Gravação de voz: `stopTimerRef` de 120s não limpa em unmount se estado `recording` travar** — `src/components/ravi/RaviServiceChat.tsx:254,263-269`. O cleanup chama `stopRec()`, ok; mas `MediaRecorder` sem suporte a `audio/webm` (Safari) cai no `catch` genérico "Não consegui acessar o microfone" mesmo com permissão concedida. **Baixa**.

### Responsivo
- Cards `STARTERS` em `grid-cols-2` fixo (linha 328) — em 320px os títulos "Ler um contrato" quebram feio; `desc` só aparece `sm:block`.
- Bolhas `max-w-[85%]` ok; blocos de código/`"""` colados no prompt do arquivo não têm `overflow-x`.
- Composer: os botões (anexar, mic, enviar) somam ~5 alvos de toque numa linha — em 320px ficam colados; `h-10 w-10` está no limite dos 40px.

### UX/UI a melhorar
- A página é "um chat em tela cheia" dentro de um app que tem sidebar — a moldura `liquid-glass` do chat compete visualmente com a do app. Poderia ocupar a área de conteúdo sem borda própria.
- O botão de contexto da empresa e o chat não conversam: depois de configurar o contexto, nada no chat indica que ele "aprendeu".

---

## `src/app/(app)/clients/page.tsx` — Clientes

### Lógica principal
- Store: `clients`, `addClient`, `removeClient`, `hydrated`.
- Form inline (`isAdding`) com 4 `InputExpansivo`. `handleSave` valida só `newClient.name`.
- Grid de cards; cada um com botão de lixeira.

### Bugs
- **Excluir cliente sem confirmação** — `src/app/(app)/clients/page.tsx:94`. `onClick={() => removeClient(client.id)}` remove na hora (otimista no store, `api.clients.remove`). Um toque acidental apaga o cliente. O store faz rollback só se a API **falhar**; se a API deletar em cascata propostas/pagamentos, o dado se foi. **Alta**.
- **`removeClient` otimista sem checar vínculo** — `src/store/usePlatformStore.ts:228-235`. Some da UI antes da resposta; se o backend recusa (cliente com proposta), só volta depois de um `hydrate()` completo — piscada e perda do scroll. **Média**.
- **`newClient` tipado como `Partial<Client>`** mas `Client` no store tem `company` (não `orgName`); o form usa `newClient.company` — ok, coerente. Sem bug, mas `document`/`email` entram sem validação (e-mail malformado é aceito). **Baixa**.
- **Sem estado de erro de hidratação** — se `hydrate()` falha, fica "Carregando..." pra sempre (`!hydrated`). **Média** (padrão repetido em todas as páginas do store).

### Responsivo
- Grid `md:grid-cols-2 lg:grid-cols-3` ok. `break-words` nos textos ok.
- Botão de lixeira `absolute top-6 right-6` sobre `h3 ... pr-8` — em nome longo de 2 linhas o `pr-8` pode não bastar e o texto passa por baixo do ícone.
- Form: `grid md:grid-cols-2` — no mobile 1 coluna, ok.

### UX/UI a melhorar
- Card de cliente só mostra Doc e Email; nenhuma métrica (nº de propostas, valor fechado, última interação). É uma listinha, não um CRM.
- Não há edição inline de cliente na página (só `api.clients.update` existe) — só criar e excluir.

---

## `src/app/(app)/services/page.tsx` — Catálogo (serviços/produtos)

### Lógica principal
- Store: `savedServices`, `addSavedService`, `updateSavedService`, `removeSavedService`, `hydrated`.
- `editingId: string | null | 'new'`. `openNew(kind)` / `openEdit(s)` preenchem `form`. `handleSave` converte `priceReais` → `toCents`, quebra `details`/`defaultStages` por linha.
- Botão "Criar com o Havi" abre `RaviServiceChat` modal.

### Bugs
- **Excluir serviço sem confirmação** — `src/app/(app)/services/page.tsx:357`. `onClick={(e) => { e.stopPropagation(); removeSavedService(s.id); }}`. Idem clientes. **Alta**.
- **`priceReais` guardado como `String(toReais(s.price))`** — `src/app/(app)/services/page.tsx:68`. `toReais(150000)` = `1500`, `String` = `"1500"`; ok. Mas `toReais(150050)` = `1500.5` → `"1500.5"` no input `type="number"` — o usuário vê `1500.5` em vez de `1500,50`. Cosmético mas confunde. **Baixa**.
- **`toCents` aceita vírgula OU ponto, mas o input é `type="number"`** — `src/lib/money.ts:12-15` faz `reais.replace(',', '.')`; um `<input type="number">` no locale pt-BR pode nem deixar digitar vírgula, e se deixar, `Number("1500,50")` já falhou antes do replace? Não — `toCents` recebe string e faz replace primeiro, ok. Mas `e.target.value` de `type="number"` com vírgula vem `""` em alguns browsers. **Média** (valor pode virar 0 silenciosamente).
- **`updateSavedService` descarta `quantity` mas não `billingType` inconsistente** — ok, sem bug.
- **`readOnly={isProduct}` no campo de unidade, mas `onChange` ainda dispara** — `src/app/(app)/services/page.tsx:271-278`: `onChange={e => !isProduct && setForm(...)}` — guarda dupla, ok.
- **Card do serviço: clique no card abre edição, clique na lixeira faz `stopPropagation`** — ok, mas não há confirmação nem "desfazer".

### Responsivo
- `hugeInput` = `text-5xl md:text-6xl` no campo de preço: em 320px, `R$ 0,00` com fonte 48px + o `<span>R$</span>` de `text-3xl` ao lado estoura a linha; o wrapper é `flex items-center gap-4` sem `flex-wrap`.
- Modal de edição: `rounded-[2.5rem] p-8 sm:p-12` sem `max-h`/scroll interno — o formulário é longo (toggles + 2 inputs enormes + 2 textareas + botões); em telas baixas (~700px) o botão "Adicionar ao Catálogo" fica abaixo da dobra e a página inteira rola, mas o modal não tem `overflow-y-auto` próprio (`AnimatePresence` > `motion.div` sem `max-h-[90vh]`). **Média** (task: modal mais alto que a viewport sem scroll interno).
- Toggle Serviço/Produto e chips de unidade: `flex flex-wrap` ok; chips `px-5 py-2` alvo de toque ok.
- Grid de cards `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` ok.

### UX/UI a melhorar
- O formulário mistura dois idiomas de input: campos "sleek" com borda inferior e campos "huge" laranja gigantes. O preço em 60px domina a tela e empurra tudo.
- Não há preview de como o serviço aparece na proposta.

---

## `src/app/(app)/proposals/page.tsx` — Histórico de propostas

### Lógica principal
- `useQuery(['proposals'], api.proposals.list, { refetchOnWindowFocus: true })`.
- `remove` = `useMutation(api.proposals.remove)` → invalida `['proposals']`.
- Card: clique no card abre `SendProposalModal`; ícones internos (`stopPropagation`) para: abrir `ExecutionModal` (se status executável), editar (`loadProposalIntoDraft` → `/quotes/preview`), excluir.
- `ResendRow` (copiar link / WhatsApp / e-mail) só quando `status !== 'draft'`.

### Bugs
- **Excluir proposta sem confirmação** — `src/app/(app)/proposals/page.tsx:189`. `onClick={() => remove.mutate(proposal.id)}`. Apaga proposta + itens + pagamentos + diário em cascata. Sem `confirm()`, sem undo. **Alta**.
- **`editProposal` monta `items` sem `order`, `billingType`, `optional`, `selected`, `packageId`** — `src/app/(app)/proposals/page.tsx:114-121`. Passa só `name/description/details/unitLabel/quantity/unitPrice`. Ao editar uma proposta com adicionais opcionais ou modelo `packages`, tudo isso é perdido: os itens voltam como obrigatórios e sem pacote. `loadProposalIntoDraft` no store até lê esses campos (`it.billingType ?? 'once'`, `it.optional`...), mas aqui eles nem são enviados. **Alta** (edição corrompe a proposta comercial).
- **Card inteiro clicável abre `SendProposalModal` mesmo para `draft`** — `src/app/(app)/proposals/page.tsx:160`. `onClick={() => setSendProposalId(proposal.id)}` sem checar `shareable`. Abrir "enviar" um rascunho sem link público gera modal quebrado/URL vazia. **Média**.
- **`ResendRow.copy` sem try/catch** — `src/app/(app)/proposals/page.tsx:44-48`. `navigator.clipboard.writeText` rejeita em contexto não-seguro/permissão negada → promessa não tratada, `setCopied(true)` nunca roda e nada avisa o usuário. **Baixa**.
- **`timeAgo` recalcula a cada render sem "tick"** — inofensivo, mas os valores ("há 3 min") congelam até o próximo re-render.
- **`STATUS_LABEL[proposal.status] ?? STATUS_LABEL.draft`** — bom fallback. Sem bug.

### Responsivo
- Grid `md:grid-cols-2 xl:grid-cols-3` ok. `line-clamp-2`/`break-words` nos títulos ok.
- Linha de ícones de ação (`ClipboardList`, `Pencil`, `Trash2`) `gap-2` — 3 alvos de ~16px muito juntos no canto; difícil acertar no toque sem abrir o card.
- `ResendRow`: 3 ícones + texto "Copiar link" em `flex gap-4` — ok no mobile.

### UX/UI a melhorar
- "Clicar no card = enviar" é um gesto não óbvio e perigoso ao lado de "clicar no lápis = editar" e "lixeira = apagar". Merece um menu de ações explícito.
- Sem filtro/busca/ordenação — lista corrida de todos os status juntos.

---

## `src/app/(app)/quotes/new/page.tsx` — Novo orçamento (wizard 2 passos)

### Lógica principal
- Passo 1: escolher cliente (`updateQuoteDraft({ clientId })`). Passo 2: `CommercialEditor` + escolha "início do projeto" (`requiresSignedContract`) + adicionar serviços do catálogo.
- `useEffect([])`: se `?fresh=1`, `resetQuoteDraft()` + `history.replaceState('/quotes/new')`.
- `toggleService` ajusta `billingType` do item conforme `commercial.model`. `setItemQty` força `qty > 0 ? qty : 1`.
- Botão "Gerar" chama `validateCommercial(...)` (se houver `commercial`) e navega pra `/quotes/preview`.

### Bugs
- **`step` não é persistido; F5 no passo 2 volta pro passo 1** com o cliente já escolhido, mas o `useState<1|2>(1)`. Recuperável, mas confunde. **Baixa**.
- **`useEffect([])` lê `window.location.search` uma vez** — `src/app/(app)/quotes/new/page.tsx:23-30`. Se o usuário navega de `/quotes/preview` de volta pra `/quotes/new?fresh=1` via link da Sidebar ("Orçamento"), o Next pode reusar a instância do componente sem remontar o efeito em alguns casos de client-nav → não reseta. Depende do roteador; o `key` do link não muda. **Média**.
- **`setItemQty` com `qty <= 0` cai pra 1 sem avisar** — `src/app/(app)/quotes/new/page.tsx:58-64`. Usuário digita "0" pra depois digitar "0,5" e o campo pula pra 1. `type="number" step="any"` permite fracionário, mas o clamp atrapalha a digitação. **Baixa**.
- **`validateCommercial` só roda no botão "Gerar", não no passo 2 ao vivo** — se `commercial.model === 'monthly'` e nenhum item é mensalidade, o erro só aparece ao tentar gerar; o `CommercialEditor` já deixou montar tudo errado. **Baixa** (UX).
- **`toggleService` aplica `service.defaultTimeline` só se `quoteDraft.timeline === '30 dias úteis'`** exato — `src/app/(app)/quotes/new/page.tsx:52-54`. Se o usuário mexeu no prazo pra "30 dias úteis " (com espaço) ou já era outro, nunca aplica. Frágil. **Baixa**.

### Responsivo
- Cards de cliente `md:grid-cols-2 lg:grid-cols-3` ok.
- Lista de serviços: linha com nome + preço `text-xl sm:text-2xl` à direita em `flex justify-between` — nome longo + `R$ 12.345,00` competindo; tem `min-w-0`/`break-words` no bloco de texto, ok.
- Input de quantidade `w-20` + labels ao redor em `flex ... gap-3` — em 320px a linha "Quantidade [input] unidade = R$ ..." quebra e o `= R$` some pra baixo.

### UX/UI a melhorar
- O passo 2 empilha 3 seções grandes (`CommercialEditor` gigante, bloco de contrato, lista de serviços) numa rolagem longa sem âncoras. O `CommercialEditor` sozinho tem `mb-24` e ~5 sub-blocos.
- Não dá pra ver o total enquanto monta (o total só no `CommercialEditor` lá embaixo, ou no preview).

---

## `src/app/(app)/quotes/preview/page.tsx` — Preview / envio da proposta

### Lógica principal
- Lê `quoteDraft`, `clients`, `companyInfo` do store. Monta `quoteView: QuoteView` a partir do draft.
- `saved` inicial vem de `quoteDraft.proposalId/publicToken` (edição de proposta existente).
- `persistProposal(status)`: se `saved`, `api.proposals.update`; senão `api.proposals.create` e grava `proposalId/publicToken` no draft.
- Header flutuante: trocar template, "visualizar como cliente" (`previewClientView` → cria rascunho + abre `/p/...`), abrir modal de ajustes, Salvar, Enviar (abre modal de compartilhamento), Imprimir.
- `CommercialChoices` no topo do render permite mudar pacote/adicionais e re-`updateQuoteDraft`.

### Bugs
- **Race de criação dupla de proposta** — `src/app/(app)/quotes/preview/page.tsx:126-150, 192-199`. `handleSaveProposal`, `handleSend` e `previewClientView` todos chamam `persistProposal('draft'|'sent')`. Enquanto `saved` ainda é `null`, dois cliques rápidos (ex.: "Visualizar como cliente" e depois "Salvar" antes do primeiro `create` resolver) disparam **dois `api.proposals.create`** → duas propostas, dois tokens. Só `handleSaveProposal`/`handleSend` têm guarda por `saveState`/`sendState`; `previewClientView` não tem nenhuma. **Média/Alta**.
- **`persistProposal` no modo edição não envia `clientId`** — `src/app/(app)/quotes/preview/page.tsx:102-117`. O `api.proposals.update` manda `commercial/proposalNumber/title/template/.../items/status` mas **não** `clientId`. Trocar o cliente ao editar não persiste. (E `api.proposals.update` nem aceita `clientId` no tipo.) **Média**.
- **`buildPayload().items` perde `order`** — `src/app/(app)/quotes/preview/page.tsx:88-96`. Envia `billingType/optional/selected/packageId/name/.../unitPrice` mas não `order`; o servidor (`normalizeProposalItems`) recria `order` pelo índice do array. Como o array vem de `quoteDraft.services` que foi ordenado no `loadProposalIntoDraft`, geralmente bate — mas qualquer reordenação no `CommercialEditor` (duplicar item) muda o índice e o `order` gravado. **Baixa**.
- **`installments` local (`useState(3)`) não conversa com `commercial.installments`** — `src/app/(app)/quotes/preview/page.tsx:20, 313-338`. O parcelador manual no modal só existe quando `!quoteDraft.commercial`; com modelo comercial, o campo some, ok. Sem bug, mas o `useState(3)` fica órfão.
- **`window.location.hostname === 'localhost'`** checagem de aviso — `src/app/(app)/quotes/preview/page.tsx:399`. Em deploy sob IP ou `127.0.0.1` o aviso não aparece; cosmético. **Baixa**.
- **`getShareUrl()` retorna `''` se `!saved`** e vários botões (`openEmail`, `openWhatsApp`, "Visualizar") usam esse valor — se o modal de compartilhamento abrir antes do `create` resolver (não deveria, `handleSend` faz `await persistProposal` antes de `setIsSharing(true)`), manda link vazio. Ok hoje. **Baixa**.
- **`quoteDraft.services.length === 0` → "Orçamento inválido."** — `src/app/(app)/quotes/preview/page.tsx:152-159`. Como o draft é persistido (`partialize`), F5 mantém; mas se o usuário limpou os serviços no editor e voltou, essa tela trava sem caminho claro além do link "Voltar". **Baixa**.

### Responsivo
- Header `xl:fixed` com `left-[calc(16rem+1.5rem)]` — abaixo de `xl` vira `relative m-4` e empilha (`flex-col xl:flex-row`); os ~8 botões de template + 5 de ação numa faixa `flex-wrap` ficam com 2–3 linhas no tablet. Aceitável mas pesado.
- Modal de ajustes: `max-w-2xl max-h-[90vh] overflow-y-auto` — **tem** scroll interno, ok.
- Modal de compartilhar: `max-w-2xl p-8`, sem `max-h`/scroll; conteúdo é curto, ok.
- O template renderizado tem largura fixa `max-w-[21cm]` — em mobile encolhe via `max-w-full`? Depende do template (ver seção Templates); vários têm `min-h-[29.7cm]` e paddings grandes.

### UX/UI a melhorar
- O header flutuante concentra 3 grupos de controle (voltar / templates / ações) numa cápsula só — no tablet vira um bloco de 3 linhas que tampa o topo da proposta (`xl:mt-20` compensa só no desktop).
- "Salvar" e "Enviar" têm o mesmo estilo (pill laranja outline); a ação destrutiva-ish (enviar = trava a proposta) não se diferencia.

---

## `src/app/(app)/approved/page.tsx` — Lista de aprovados

### Lógica principal
- `useQuery(['proposals'])`; filtra `status ∈ {approved,in_progress,delivered}`; ordena por `respondedAt || createdAt` desc.
- `awaitingContract(p)` → badge "Aguardando contrato".
- Card linka pra `/approved/[id]`. Mostra total e nº de meses no diário.

### Bugs
- **`.sort((a,b) => (b.respondedAt || b.createdAt).localeCompare(...))`** — `src/app/(app)/approved/page.tsx:28-30`. `respondedAt`/`createdAt` são ISO strings, `localeCompare` funciona; mas se `respondedAt` for `null` **e** `createdAt` também faltar (nunca deveria), `String.prototype.localeCompare` de `undefined` quebra. Robustez. **Baixa**.
- **`months = p.progressUpdates?.length ?? 0`** — depende de `/api/proposals` incluir `progressUpdates` (inclui, confirmado em `route.ts:17`). Ok.
- Sem bug relevante além disso.

### Responsivo
- Grid `md:grid-cols-2 xl:grid-cols-3` ok. `line-clamp-2`/`line-clamp-1` nos textos ok.
- `formatBRL(p.total)` em `text-xl sm:text-2xl` — número grande sem `break-words`, mas o card tem largura de coluna razoável; risco baixo em 320px com valores de 7 dígitos.

### UX/UI a melhorar
- Card não distingue visualmente "em execução" de "entregue" além de uma palavra pequena; poderia ter barra de progresso das etapas (`blocks`) que já vêm no payload.

---

## `src/app/(app)/approved/[id]/page.tsx` — Projeto aprovado (detalhe)

### Lógica principal
- `use(params)` → `id`. `useQuery(['proposals'])` e acha `proposal = proposals.find(p => p.id === id)` (deriva da lista pra refletir mutações do `ExecutionModal`). `useQuery(['services'])` pra sugerir etapas.
- `setStatus` mutation (`in_progress`/`delivered`) invalida `['proposals']` e `['proposal', id]`.
- `cloneAsRenewal`: `loadProposalIntoDraft` + zera `proposalId/publicToken`, novo número, título "— Continuação", `router.push('/quotes/preview')`.
- Renderiza gate de contrato, resumo de pagamentos, bloco de encerramento (se `delivered`), `ProjectBlocks`, `ProgressLog`, `ExecutionModal`.

### Bugs
- **`cloneAsRenewal` monta `items` sem `billingType/optional/selected/packageId/order`** — `src/app/(app)/approved/[id]/page.tsx:72-79`. Mesmo defeito do `editProposal` em `proposals/page.tsx`: clonar uma proposta comercial com adicionais/pacotes perde toda a estrutura comercial dos itens. **Alta**.
- **`proposal` pode ser `undefined` num intervalo** — `src/app/(app)/approved/[id]/page.tsx:43`. Enquanto `isLoading` cobre o primeiro load; mas em `refetchOnWindowFocus` se a proposta some da lista (ex.: foi excluída noutra aba), `proposal` vira `undefined` **sem** `isLoading`, e o código só trata `if (!proposal)` depois de `if (isLoading)` — ok, cai no "Proposta não encontrada". Aceitável. **Baixa**.
- **`useQuery(['proposal', id])` é invalidada mas nunca criada** — `src/app/(app)/approved/[id]/page.tsx:53` e `ProjectBlocks`/`ProgressLog` invalidam `['proposal', proposalId]`, mas essa query key não existe (a página usa `['proposals']`). Invalidação morta — inofensiva, mas indica intenção não cumprida (dados só atualizam porque `['proposals']` também é invalidada). **Baixa**.
- **`fmtDate` com `timeZone: 'UTC'`** — `src/app/(app)/approved/[id]/page.tsx:24-26`. Correto para datas puras (`dueDate`), **mas** `respondedAt`/`paidAt` são timestamps reais; formatá-los em UTC mostra o dia errado pra quem aceitou/pagou perto da meia-noite BRT. Linha 199 (`fmtDate(proposal.respondedAt)`) e 241 (`fmtDate(pay.paidAt)`). **Média**.
- **Botões "Iniciar execução" / "Marcar entregue" sem confirmação** — `src/app/(app)/approved/[id]/page.tsx:157-183`. Transições de status irreversíveis por design (`respond` route bloqueia voltar). Um clique. **Média**.

### Responsivo
- `max-w-5xl mx-auto` + `p-4 sm:p-6 lg:p-12` ok.
- Bloco de encerramento: `grid grid-cols-2 md:grid-cols-4` ok.
- Resumo de pagamentos: cada linha `flex items-center justify-between` com label + valor + status — em 320px "Mensalidade 1/12" + "R$ 1.234,56" + "Em aberto" numa linha só aperta; sem `flex-wrap`.

### UX/UI a melhorar
- Muita coisa empilhada (gate, pagamentos, encerramento, etapas, diário). Faltam abas ou âncoras.
- O CTA principal muda conforme status mas fica no meio de uma fileira de `flex-wrap` com botões secundários de mesmo tamanho.

---

## `src/app/(app)/approved/[id]/resumo/page.tsx` — Relatório do projeto (imprimível)

### Lógica principal
- `use(params)` → `id`. `company` do store; `useQuery(['proposals'])` → acha a proposta.
- `buildProjectSummary(proposal)` → `s` (entregas, meses, blocos, total pago, reviews, entregas por mês).
- Layout de relatório A4 com `print:` styles; botão "Imprimir / PDF" (`window.print()`).

### Bugs
- **`fmtDate` **sem** `timeZone: 'UTC'`** — `src/app/(app)/approved/[id]/resumo/page.tsx:13-15`. Aqui é o oposto do detalhe: `proposal.startedAt`/`deliveredAt` são timestamps reais (ok formatar local), mas se algum dia vierem datas puras, dá off-by-one. Inconsistência com o resto do app (que usa UTC). **Baixa**.
- **`new Date(Number(u.month.split('-')[0]), Number(u.month.split('-')[1]) - 1, 1)`** — `src/app/(app)/approved/[id]/resumo/page.tsx:194`. `u.month` é `"2026-09"`; se vier malformado (`""`), `Number(undefined)` = `NaN` → `Invalid Date` → `toLocaleDateString` retorna "Invalid Date". Sem guarda. **Baixa**.
- **`s.deliveries.map((d, i) => <a key={i} href={d.url}>`** — `key` por índice numa lista que pode reordenar entre renders (entregas vêm de vários meses concatenados em `buildProjectSummary`). Baixo risco. **Baixa**.
- **Depende de `company` do store estar hidratado** — `src/app/(app)/approved/[id]/resumo/page.tsx:19`. Se abrir a página direto (link novo) antes de `StoreHydrator` rodar, `company.name`/`email`/`phone` saem vazios no cabeçalho e no rodapé do relatório impresso. **Média**.

### Responsivo
- `max-w-3xl` + `print:max-w-none`. Grids `grid-cols-2 sm:grid-cols-4` ok.
- `MiniBarChart` sem wrapper `overflow-x` — em muitos meses as barras espremem.
- Números `text-5xl` na satisfação — em 320px, `flex flex-wrap items-center gap-4` segura.

### UX/UI a melhorar
- É um relatório sério embutido no tema escuro do app; o `print:` converte pra claro, mas na tela fica um documento formal dentro do visual "cyber". Ok pro propósito.

---

## `src/app/(app)/dispatches/page.tsx` — Motor de disparo (templates de e-mail/WhatsApp)

### Lógica principal
- `tab: 'email' | 'whatsapp'`. Renderiza `EmailTemplatesSettings` ou `WhatsappTemplatesSettings`.
- `EmailTemplatesSettings`: `useQuery(['emailTemplates'])`; cada `TemplateCard` tem estado local (`subject/title/body`), `dirty`, `save`/`reset` mutations.

### Bugs
- **`TemplateCard` inicializa estado local uma vez e não re-sincroniza** — `src/components/EmailTemplatesSettings.tsx:52-54`. `useState(row.subject)` etc. Depois de `save` → `invalidate` → refetch, se o servidor normalizar/rejeitar parte do texto, o card continua mostrando o que o usuário digitou (`dirty` fica `false` porque `row` mudou pra igual). Se dois cards de propriedades diferentes... ok. Cenário real de bug: `reset.mutate()` faz `setSubject(row.default.subject)` usando o `row` **anterior ao reset** (linha 66-70); se o default do servidor divergir do `row.default` embutido, diverge. **Baixa**.
- **Toggle `enabled` usa `row.enabled` (valor do servidor) direto no `checked`** — `src/components/EmailTemplatesSettings.tsx:100-102`. `onChange` dispara `save.mutate({ enabled })` e só reflete após refetch; sem estado otimista, o switch "não responde" por ~300ms. **Baixa**.
- **Sem `key` reset no `TemplateCard`** quando `rows` troca de identidade — se a lista for reordenada, o estado local vaza pro card errado. Hoje a lista é estável. **Baixa**.
- **`{{ variável }}` não é validada** — o usuário pode digitar `{{cliente_nome}}` (var inexistente) e salvar; a substituição no `mailer` provavelmente deixa o literal no e-mail enviado. Não dá pra confirmar sem ler `mailer.ts`, mas o form não valida contra `row.vars`. **Média**.

### Responsivo
- Tabs `flex flex-wrap gap-4` ok. Cards `rounded-3xl` colapsáveis ok.
- `sleekInput` `text-xl` nos campos de assunto/título — longos empurram, mas é `w-full border-b`, sem overflow.
- Variáveis permitidas: aparecem `hidden sm:block` no topo e `block sm:hidden` embaixo — ok.

### UX/UI a melhorar
- Não há preview do e-mail renderizado (só campos crus). Editar `body` às cegas.
- "Gatilho: {audience}" é vago — deveria dizer *quando* dispara ("quando o cliente abre a proposta").

---

## `src/app/(app)/settings/page.tsx` — Configurações da empresa

### Lógica principal
- `form: CompanyInfo` (cópia local de `companyInfo` do store). `handleChange` faz **debounce 600ms** acumulando `pending.current` e chama `updateCompanyInfo(patch)`.
- `dirty.current` trava o `useEffect([companyInfo])` que sincroniza `form` com o store.
- Upload de logo: `POST /api/company/logo` (multipart) → grava em `public/uploads/` no FS → `setForm({logoUrl})` + `updateCompanyInfo({logoUrl})`.
- Preview do PIX BR Code (`buildPixBrCode` + `normalizePixKey`) quando `pixReady`.

### Bugs
- **`dirty.current` nunca volta a `false`** — `src/app/(app)/settings/page.tsx:92-114`. Depois da 1ª edição, `dirty.current = true` pra sempre; o `useEffect([companyInfo])` (linha 91-93) nunca mais re-sincroniza `form` com o store. Se outra aba/refetch atualizar `companyInfo`, ou se o servidor `.trim()`ar um valor (`api/company/route.ts:33` faz `body[key].trim()`), a tela mostra o valor não-trimado até dar F5. **Média**.
- **Upload grava no filesystem local** — `src/app/api/company/logo/route.ts:35-38`. `public/uploads/logo-*.png`. Em deploy serverless (Vercel) o FS é efêmero/read-only → o `writeFile` lança ou o arquivo some no próximo deploy; o `<img>` no portal/e-mails do cliente quebra. Mesmo em VPS, `next build` não versiona `public/uploads`. **Alta** (dado do cliente — a marca dele — some).
- **Logo antigo vira órfão** — ao trocar ou remover (`handleChange('logoUrl','')`), o arquivo anterior nunca é apagado do disco. **Baixa**.
- **Dupla escrita no update de logo** — `src/app/(app)/settings/page.tsx:80-82`. A rota `/api/company/logo` já faz `prisma.company.update({ logoUrl })`; o cliente ainda chama `updateCompanyInfo({ logoUrl })` que faz `PATCH /api/company` de novo. Idempotente, mas desnecessário e conta como 2 writes. **Baixa**.
- **`EmailVerifyStatus` compara `form.email === companyInfo.email`** — `src/app/(app)/settings/page.tsx:217`. Enquanto o debounce não salvou, `companyInfo.email` é o antigo e `form.email` o novo → mostra "E-mail não confirmado" mesmo que ainda seja o mesmo e-mail (durante a digitação). Cosmético. **Baixa**.
- **Debounce perde o último patch se o componente desmontar antes dos 600ms** — trocar de página logo após digitar não faz flush do `timer.current`. **Média** (perda silenciosa de edição).
- **`pixKey` PATCH não normaliza no servidor** — `api/company/route.ts:23-34` só faz `.trim()` em `pixKey`; a normalização real (`normalizePixKey`) só acontece no preview client-side. O QR do portal (`resolvePix`/`buildPixBrCode`) precisa da chave crua correta. Se o usuário digita telefone como `(11) 99999-9999`, é isso que vai pro BR Code. **Média**.

### Responsivo
- `grid lg:grid-cols-12` com coluna esquerda `lg:col-span-4` e form `lg:col-span-8` — no mobile empilha, ok.
- `InputExpansivo` `text-2xl md:text-3xl` — labels/valores grandes; `w-full border-b`, sem overflow horizontal.
- Card de preview do PIX: `flex flex-col sm:flex-row items-center gap-6` ok; `PixQRCode size={160}` cabe.
- Coluna esquerda "Motor de Sincronização" é `hidden md:block` — some no mobile, ok.

### UX/UI a melhorar
- O painel "Status do DB" com bolinha verde pulsando e texto "Online/Conectando" é decoração que não informa nada acionável.
- Muito peso visual (glassmorphism, glows, `blur(60px)`) pra um formulário de cadastro; os campos "expansivos" gigantes fazem um form de 12 campos ocupar 3 telas.
- Sem botão "Salvar" explícito nem indicação clara de quando cada campo persistiu (só o rótulo "Salvando/Salvo/Online" no card lateral que some no mobile).

---

## `src/app/(auth)/login/page.tsx` e `signup/page.tsx`

### Lógica principal
- `signIn.email({ email, password })` / `signUp.email({ email, password, name })` do Better Auth client.
- Sucesso → `router.push('/')` + `router.refresh()`.
- `GoogleButton` (social login) acima do formulário.
- `signup` valida `password.length < 8` no cliente (bate com `auth.ts` `minPasswordLength: 8`).

### Bugs
- **`signup`: erro de validação client-side não reseta `loading` corretamente** — `src/app/(auth)/signup/page.tsx:20-23`. Se `password.length < 8`, faz `setError(...)` e `return` **antes** de `setLoading(true)` — ok, `loading` ainda é `false`. Sem bug aqui, na verdade. (Verificado e descartado.)
- **`login`: `signIn.email` sem `try/catch`** — `src/app/(auth)/login/page.tsx:21`. Se a promessa **rejeitar** (rede caiu) em vez de resolver com `{ error }`, a exceção não é tratada e `loading` fica travado em `true`. Better Auth normalmente resolve com `{error}`, mas não é garantido. **Baixa**.
- **`(auth)/layout.tsx` é sempre tema escuro fixo** (`bg-[#030303]`, textos `text-white`) — ignora `prefers-color-scheme`/toggle. Decisão de design, mas não há `ThemeToggle` aqui. **Baixa**.
- **Sem link pra `/landing`** nas telas de auth — junto com o bug do `proxy.ts` que bloqueia `/landing` deslogado, não há nenhum caminho anônimo pro material de marketing. **Média** (produto).
- **Signup não coleta nome da empresa** — `auth.ts:49` usa `user.name || 'Minha Empresa'` como nome da Company. O onboarding depois depende de o dono lembrar de trocar em Configurações.

### Responsivo
- `max-w-md` centralizado, `p-8 md:p-12`. Inputs `border-b-2` `text-xl`. Ok em mobile.
- Fundos com `blur-[150px]` e grid pattern — pesado mas `pointer-events-none`.

### UX/UI a melhorar
- Consistente e limpo. Só falta o caminho de volta pra home/marketing e um "esqueci a senha" (não há rota de recuperação visível).

---

## `src/app/p/[token]/page.tsx` — Proposta pública

### Lógica principal
- Server component. `extractToken(rawToken)` (tira o slug decorativo). `getPublicProposal(token)` (sem auth — token é a credencial). `notFound()` se não achar.
- Se `proposal.accessPhrase`: lê cookie `nexq_unlock_<token>`; se não bate → `AccessLocked` (se `accessCount >= maxAccesses`) ou `AccessGate`.
- Monta `QuoteView`. Se `commercial` → `<CommercialProposal>` (interativo: escolhe pacote/adicionais). Senão → `<TemplateRenderer>` + `<ClientResponse>`.
- `<ViewPing>` faz `POST /api/p/[token]/view` uma vez por sessão de browser (`sessionStorage`).
- `generateMetadata` com `robots: noindex`.

### Bugs
- **`items.reduce((sum, it) => sum + it.price, 0)` para o `total` do `QuoteView`** — `src/app/p/[token]/page.tsx:95`. Usa `it.price` (total da linha gravado). Mas quando há `commercial`, o `TemplateRenderer` recalcula tudo por dentro (`commercialTotals`) — então esse `total` só vale pro caminho não-comercial. Consistente. Sem bug, verificado.
- **`accessPhrase` checado só no server render; `/api/p/[token]/respond` e `/setup-account` re-checam de formas diferentes** — `respond` exige o cookie (`route.ts:40-41`), mas `setup-account` **não checa `accessPhrase` nenhuma**. Ver crítico #3. Inconsistência de contrato entre rotas do mesmo token.
- **`parseCommercial(proposal.commercial)` pode lançar** — `src/lib/commercial.ts:46-73` faz `throw new Error(...)` para modelo inválido. Aqui é chamado direto no render do server component (`page.tsx:63`) sem try/catch. Uma proposta com `commercial` corrompido (migração parcial, edição manual no banco) derruba a página inteira com erro 500 em vez de degradar. **Média**.
- **`[...items].sort((a, b) => a.order - b.order)`** — `page.tsx:84`. Se `order` for `null` (itens antigos), `null - null = 0`, ordem indefinida mas estável-ish. **Baixa**.
- **`ViewPing` dispara `notifyProposalEvent('proposal_viewed')` no primeiro POST** — o `sessionStorage` só evita repetição por aba; abrir em aba anônima / outro browser conta como nova "primeira visão"? Não — `firstView = !proposal.viewedAt` no servidor (`view/route.ts:26`), então a notificação só vai uma vez. Mas `viewCount` incrementa a cada sessão. Ok.
- **Bots de preview de link (WhatsApp, Slack) disparam o `ViewPing`?** — `ViewPing` é client-side (`useEffect`), então crawlers não executam. Ok.

### Responsivo
- Barra sticky do topo `flex items-center justify-between px-5 py-3` — em 320px "Proposta PRJ-0001 · Ana Ferreira" + botão Imprimir apertam; sem `truncate` no bloco de texto.
- O corpo é o template escolhido (ver Templates) — vários com `max-w-[21cm]`/`min-h-[29.7cm]` que forçam scroll.
- `<CommercialChoices>` `max-w-5xl p-6 sm:p-8` ok.

### UX/UI a melhorar
- A barra do topo é branca fixa sobre um `bg-[#0a0a0a]` — contraste abrupto com os templates que têm fundo próprio.

---

## `src/app/p/[token]/CommercialProposal.tsx` + `ClientResponse.tsx` + `AccessGate.tsx` + `AccessLocked.tsx` + `ViewPing.tsx`

### Lógica principal
- `CommercialProposal`: estado `q` (QuoteView). `locked` se status ∈ {approved,in_progress,delivered}. `<CommercialChoices>` muda pacote/adicionais → recomputa `q.items[].selected`. Passa `selection` (pacote + ids opcionais + `revision`) e `dueDateMode` pro `<ClientResponse>`.
- `ClientResponse`: estados `status/note/agreed/dueDate`; "gamification" (`guideStep`: blur→hand→done via timers de 4s/6s). `respond(decision)` → `POST /api/p/[token]/respond`; se `approved` → `router.push('/p/[token]/success')`.
- `AccessGate`: form da palavra-chave → `POST /api/p/[token]/unlock` → `window.location.reload()`.

### Bugs
- **Remonte que apaga a resposta** — `src/app/p/[token]/CommercialProposal.tsx:11`. Ver crítico #5. `key={JSON.stringify([...])}` no `<ClientResponse>`.
- **`ClientResponse` recebe `initialStatus`/`initialNote` mas só usa no `useState` inicial** — combinado com o remonte acima, ao mudar seleção o `note` volta pra `initialNote` (o do servidor), descartando o que foi digitado.
- **`respond` de `changes_requested` exige nota, mas o botão fica sempre habilitado** — `src/app/p/[token]/ClientResponse.tsx:271-277`. Clicar sem nota mostra erro só depois; ok, mas o botão poderia refletir o `disabled`.
- **`dueDate` default = último dia do mês corrente** — `src/app/p/[token]/ClientResponse.tsx:22-25, 48`. Se `dueDateMode !== 'client'`, esse estado é calculado e nunca usado (só enviado quando `dueDateMode === 'client'`, linha 103). Ok, morto mas inofensivo.
- **`min`/`max` do input `type="date"`** — linha 290-291: `min` = hoje, `max` = hoje+45d. Mas o servidor (`respond/route.ts:70-74`) aceita `d >= now - 3d` e `<= now + 45d`. Divergência de 3 dias no limite inferior (cliente não consegue escolher data passada que o servidor aceitaria — ok, mais restritivo no cliente).
- **`AccessGate.submit` faz `window.location.reload()` em vez de re-render** — `src/app/p/[token]/AccessGate.tsx:46`. Funciona, mas perde qualquer scroll/estado; e se o `Set-Cookie` do `unlock` (Path=/p) não pegar por causa de config de `SameSite`/proxy, entra em loop de gate. **Baixa**.
- **`AccessGate` e `AccessLocked` duplicam ~60 linhas de JSX de layout** — manutenção. **Baixa**.
- **`style dangerouslySetInnerHTML` com `@keyframes cardShine`** — `src/app/p/[token]/ClientResponse.tsx:133-139`. Injeta `<style>` global a cada instância; com o remonte do componente isso é re-injetado repetidamente (múltiplas tags `<style>` iguais no DOM). **Baixa**.

### Responsivo
- `ClientResponse`: `max-w-xl p-8 md:p-12` centrado, `min-h-screen`. Os orbs animados `w-[500px]/w-[600px] blur-[150px]` são `pointer-events-none` mas custam GPU no mobile.
- Overlay de "gamification" com `backdrop-blur-md` cobrindo o card — em mobile o blur de tela cheia é pesado.
- `AccessGate`: input `text-4xl` centralizado — "DIGITE AQUI" placeholder cabe; palavra longa transborda (sem `truncate`, mas é input então rola dentro).
- Botões de decisão `flex-col sm:flex-row` ok; alvos `py-4` bons.

### UX/UI a melhorar
- O "guia" que borra o card por 4s e depois pisca uma mãozinha 4x é intrusivo e atrasa quem já entendeu; e reinicia a cada mudança de seleção (por causa do remonte). Deveria ser dispensável e rodar uma vez só.
- `ClientResponse` mistura 3 CTAs (Solicitar alteração / Recusar / Aprovar) com pesos visuais que mudam conforme `agreed` — o "Recusar" e o "Aprovar-desabilitado" ficam quase iguais.

---

## `src/app/p/[token]/success/page.tsx` — Pós-aceite / criar conta do cliente

### Lógica principal
- Client component. `token` de `useParams()`. Form `email/phone/password` → `POST /api/p/[token]/setup-account` → `router.push('/portal')`.
- Alternativa: `<a href="/api/portal/auth/google?token={token}">` (Google).

### Bugs
- **Rota sem verificação nenhuma** — ver crítico #4. Não confere sessão, status da proposta, nem se já existe conta.
- **`setup-account` sobrescreve o cliente sem validar posse** — ver crítico #3. `console.log` de token em produção.
- **`catch (err: any) { setError(err.message) }`** — `src/app/p/[token]/success/page.tsx:41-44`. Em erro de rede, `err.message` = "Failed to fetch" vai cru pra tela. **Baixa**.
- **`minLength={6}` no password client-side** mas o servidor (`setup-account/route.ts`) **não valida tamanho nenhum** — aceita senha de 1 caractere via `curl`. **Média**.
- **`phone` entra sem sanitização** — vai direto pra `prisma.client.update({ data: { phone } })`. **Baixa**.
- **Não checa se o e-mail digitado difere do e-mail já cadastrado no `client`** — se o cliente real digita o e-mail dele, tudo bem; se digita errado, muda o e-mail do cadastro e o dono perde o vínculo. **Média**.

### Responsivo
- `max-w-md rounded-[2.5rem] p-8`. Inputs `p-3 text-sm`. Botão de olho `absolute right-3`. Ok mobile.
- `var(--bg-image)` de fundo + `backdrop-blur` — ok.

### UX/UI a melhorar
- A tela se chama "Sucesso!" mas a ação real é "crie uma senha" — dois objetivos concorrendo. E não há como *pular* (acompanhar depois).

---

## `src/app/portal/page.tsx` + `CockpitClientView.tsx` — Painel do cliente

### Lógica principal
- Server: `loadPortalProposals()` (sessão `client_session` → `prisma.client.findMany({ where: { email } })` case-insensitive, junta `proposals` de todos os cadastros com aquele e-mail, status ∈ {approved,in_progress,delivered}). `redirect('/portal/login')` se `null`.
- Anexa `pixPayload` (BR Code com valor do mês) a cada `payment` não pago via `resolvePix` + `buildPixBrCode`.
- `CockpitClientView`: seletor de projeto (`selected` index), `ProjectCockpit` (gate de contrato, andamento — blocos + diário, cronograma financeiro).
- `MonthCard`: fluxo de registro de pagamento (`RegisterPaymentFlow`: escolhe 1–4 parcelas → linhas de valor/forma/data → `POST .../entries`), `EntryRow` (editar/remover/anexar comprovante), `MonthReviewBlock` (avaliação do mês).

### Bugs
- **`firstName` vem de `clients[0].name` arbitrário** — `src/lib/portalData.ts:49`. Se a pessoa tem 2 cadastros (nomes "Ana" e "Ana Paula Ferreira") em empresas diferentes, o "Olá, {firstName}" pega o primeiro que o Prisma retornar (sem `orderBy` nos `clients`). **Baixa**.
- **`selected` do projeto não é resetado quando a lista muda** — `src/app/portal/CockpitClientView.tsx:71,81`. Usa `Math.min(selected, len-1)` pra não estourar, mas se um projeto some (ex.: `delivered` sai do filtro? não sai), o `key={proposal.id}` no `ProjectCockpit` remonta — ok. **Baixa**.
- **`RegisterPaymentFlow` divide `remaining` mas `remaining === payment.amount` sempre** — `src/app/portal/CockpitClientView.tsx:544`. É passado `remaining={payment.amount}` fixo, ignorando entries já verificadas. Se o cliente já teve uma parcela `verified` e clica "Registrar pagamento" de novo (só aparece quando `!hasEntries`, então não acontece)... na prática `open` só abre quando `!hasEntries`. Ok, mas o prop `remaining` é enganoso/morto.
- **`parseCents` frágil** — `src/app/portal/CockpitClientView.tsx:54-56`. `Number(v.replace(/\./g,'').replace(',','.'))` — se o cliente digita `1.500` (mil e quinhentos) vira `1500` centavos = R$ 15,00. Se digita `1500.50` (ponto decimal) vira `150050` centavos = R$ 1.500,50. Ambíguo: mesmo texto, resultados diferentes conforme o cliente ache que `.` é milhar ou decimal. **Média** (erro de valor em dinheiro do cliente).
- **`applyPattern`/`redo`/`attach` sem tratamento de erro visível** — `src/app/portal/CockpitClientView.tsx:426-456, 752-756`. `if (res.ok) refresh()` — se falhar (404, 400 "mês já quitado"), nada acontece na tela, o `busy` volta e o cliente fica sem saber por quê. **Média**.
- **`EntryRow.attach` chama `call` que espera `res.ok` mas o endpoint de receipt pode retornar 200 com corpo de erro** — não dá pra confirmar sem ler `.../entries/[entryId]/receipt/route.ts`. Risco. **Baixa**.
- **`reviewMonthOf(payment)`** usa `payment.dueDate` (data pura UTC) → `.toISOString().slice(0,7)` — ok, `"2026-09"`.
- **`brl()` local reimplementa `formatBRL`** — `src/app/portal/CockpitClientView.tsx:48-50` vs `lib/money.ts`. Duas implementações do mesmo formato (uma com `Intl.NumberFormat` cacheado, outra recriando). **Baixa** (dívida).
- **`redo` usa `confirm()`** (linha 445) — bom, tem confirmação. Mas `EntryRow.remove` (linha 750) **não** tem confirmação — apaga o recibo do cliente com 1 toque. **Média**.
- **`proposal.payments` é filtrado no server pra `status !== 'paid'`** (`portal/page.tsx:18`), mas `CockpitClientView` também checa `(proposal.payments ?? []).length === 0` pra "nenhuma cobrança em aberto" — ok, coerente.

### Responsivo
- `ProjectCockpit`: `p-6 md:p-10`, header `flex-col md:flex-row`. Ok.
- `MonthCard`: `flex-col md:flex-row` no header; valor `text-xl font-black` + label — ok.
- `RegisterPaymentFlow`: linhas `grid-cols-1 sm:grid-cols-3` (valor/forma/data) — no mobile 1 coluna, ok.
- `EntryRow`: `flex flex-wrap items-center justify-between` — os 3 botões (anexar/editar/remover) + status podem quebrar em 2 linhas apertadas em 320px.
- `PixQRCode size={190}` dentro de `p-5` — cabe em 320px (com folga mínima).
- Botões de seleção de projeto `flex flex-wrap gap-2` com `px-5 py-2.5` — ok, mas títulos longos não truncam.

### UX/UI a melhorar
- O `MonthCard` acumula muitos estados (aberto/em análise/quitado × tem entries/não tem × review) — a lógica de qual bloco mostrar (`isPaid ? ... : open ? ... : hasEntries ? ... : ...`) é difícil de seguir e o cliente pode ficar sem CTA claro num estado intermediário (ex.: `plannedMismatch`).
- O texto "Suas parcelas somam X — passou Y do valor do mês. Ajuste as parcelas." aparece em vermelho mas não há botão direto pra ajustar (tem que achar o lápis na `EntryRow`).
- Fundo do portal com `backdrop-blur-[8px]` fixo + cada card com mais `blur(40px) saturate(200%)` — em mobile mid-range trava o scroll.

---

## `src/app/portal/historico/` — Pagamentos concluídos

### Lógica principal
- Server: `loadPortalProposals()`, agrupa por proposta só os `payments` com `status === 'paid'`, descarta grupos vazios.
- `HistoricoView`: card por proposta, total pago, lista de pagamentos + entries com link de recibo.

### Bugs
- **`fmtDate(p.paidAt)` com `timeZone: 'UTC'`** — `src/app/portal/historico/HistoricoView.tsx:15-18`. `paidAt` é timestamp real (setado por `recomputePaymentStatus` com `new Date()`); formatar em UTC mostra o dia anterior pra pagamentos confirmados de tarde/noite no Brasil. **Média**.
- **`groups` só existe se houver `payment.status === 'paid'`** — comercial: pagamentos só ficam `paid` quando entries verificadas cobrem o valor **e** `entries.length > 0` (`paymentStatus.ts:26`). Um mês quitado 100% por "marcar pago" manual do dono (sem entries) também vira `paid` com `paidAt`. Ok, aparece. Sem bug.
- **`key={gi}` / `key={p.id}`** — grupos por `g.id` ok; entries por `e.id` ok. Bom.

### Responsivo
- `space-y-8`, cards `p-6 md:p-8`. Header `flex items-center justify-between` — "Total pago R$ ..." pode apertar com título longo (sem `truncate`/`min-w-0`). **Baixa**.

### UX/UI a melhorar
- Página puramente informativa; ok. Poderia somar "total pago no projeto todo" vs "valor contratado".

---

## `src/app/portal/documentos/` — Documentos

### Lógica principal
- Server: para cada proposta, junta entregas do diário (`progressUpdates[].deliveries[].url`) + links de etapas (`blocks[].link`) num array `entregas`. Expõe `publicToken`, `contractFileName`.
- `DocumentosView`: card por proposta com link "Proposta" (`/p/{token}`), "Contrato" (`/api/portal/proposals/{id}/contract`) ou placeholder, e lista de entregas.

### Bugs
- **Link "Proposta" aponta pra `/p/{publicToken}` sem slug** — `src/app/portal/documentos/DocumentosView.tsx:39`. Funciona (`extractToken` tolera), mas se a proposta tem `accessPhrase`, o cliente logado no portal cai no `AccessGate` de novo (o cookie de unlock é por-device e pode não existir). Fluxo quebrado pro cliente que já está autenticado. **Média**.
- **`monthLabel` sem guarda** — `src/app/portal/documentos/page.tsx:5-8`. `u.month.split('-').map(Number)` com `month` inválido → `Invalid Date` → "Invalid Date" no rótulo do contexto da entrega. **Baixa**.
- **`entregas` usa `key={idx}`** — `DocumentosView.tsx:76`. Lista concatenada de fontes diferentes; índice como key. **Baixa**.

### Responsivo
- `grid-cols-1 sm:grid-cols-2` pros 2 links principais; entregas em lista `truncate`. Ok.

### UX/UI a melhorar
- "Contrato não anexado" fica como card tracejado inerte — poderia sumir ou explicar quando estará disponível.

---

## `src/app/portal/avaliacao/` — Avaliação mensal

### Lógica principal
- Server: `projects` = propostas com `reviews` (month/rating/comment).
- `AvaliacaoView`: seletor de projeto; `ProjectReview` para o `currentMonth` (`new Date().toISOString().slice(0,7)`), pré-preenchido se já existe review do mês. `POST /api/portal/proposals/{id}/reviews`.
- Lista "avaliações anteriores".

### Bugs
- **`currentMonth` calculado em UTC** — `src/app/portal/avaliacao/AvaliacaoView.tsx:56`. `toISOString().slice(0,7)`. Vira o mês novo à meia-noite UTC (21:00 BRT do dia 31 → já é "mês seguinte" pra quem está no Brasil às 21:00 do último dia). Aresta pequena. **Baixa**.
- **`done` local trava o botão em "Avaliação enviada" mas não recarrega o `existing`** — `src/app/portal/avaliacao/AvaliacaoView.tsx:63,83`. Faz `router.refresh()` (server component re-renderiza), mas o `ProjectReview` tem `key={project.id}` (não muda), então `useState(existing?.rating ?? 0)` **não** re-inicializa com o review recém-salvo até uma navegação real. Editar de novo na hora mostra estado inconsistente. **Média**.
- **Rota `reviews` aceita qualquer `month` com ano 2020..ano+5** — `src/app/api/portal/proposals/[id]/reviews/route.ts:29-32`. Cliente pode avaliar meses futuros/passados arbitrários via API. Baixo impacto (é dado do próprio cliente). **Baixa**.

### Responsivo
- `max-w-` do container do layout; estrelas `size={32}` com `hover:scale-110` — alvo de toque ~32px, no limite. **Baixa**.

### UX/UI a melhorar
- Duas telas fazem a mesma avaliação: esta página **e** o `MonthReviewBlock` dentro do `MonthCard` do painel. Podem divergir (esta usa `currentMonth`; o card usa `reviewMonthOf(payment)` = mês do vencimento). O cliente pode avaliar "setembro" em dois lugares com meses-base diferentes.

---

## `src/app/portal/login/page.tsx`

### Lógica principal
- `PortalLogin` dentro de `<Suspense>` (por causa de `useSearchParams`). Erros do Google via query `?error=` mapeados em `GOOGLE_ERROR_MESSAGES`.
- `POST /api/portal/auth` (email+senha) → `router.push('/portal')`. Google via `<a href="/api/portal/auth/google">`.

### Bugs
- **`catch (err: any) { setError(err.message) }`** — `src/app/portal/login/page.tsx:52-56`. "Failed to fetch" cru na tela em erro de rede. **Baixa**.
- **Sucesso faz `router.push('/portal')` sem `router.refresh()`** — `src/app/portal/login/page.tsx:51`. O layout do portal é server-rendered e lê `client_session`; um `push` de client-nav pode servir a árvore em cache sem a nova sessão, deixando o usuário ver "redirect('/portal/login')" momentaneamente ou um flash. Better Auth/Next geralmente revalida, mas o padrão do resto do app é `push` + `refresh`. **Baixa**.
- **`/api/portal/auth` responde 500 genérico pra qualquer exceção** — `src/app/api/portal/auth/route.ts:37-39` — inclusive erros de conexão com o banco viram "Erro ao fazer login" sem log. **Baixa**.

### Responsivo
- `max-w-sm p-8`. Ok.

### UX/UI a melhorar
- Ok. Sem "esqueci a senha" (o cliente não tem como resetar — só o dono editando o cadastro ou refazendo o setup pelo link da proposta).

---

## `src/app/landing/page.tsx` — Marketing

### Lógica principal
- Client component estático. Hero, seção dor/solução, `PLANS` (Starter/Pro/Scale) com accordion (`expandedPlan`), CTA final, footer.
- Links pra `/login` e `/signup`.

### Bugs
- **Página inacessível deslogado** — ver `proxy.ts`. Este é o impacto prático mais grave: a landing só abre pra quem já tem sessão (que não precisa dela). **Alta**.
- **Preços divergem da oferta comercial documentada** — `PLANS` aqui: R$ 49/99/149. (Fora de escopo confirmar, mas é a única superfície de preço no código e não referencia nenhuma fonte única.) **Baixa**.
- **`© {new Date().getFullYear()}`** no footer — client component, ok (sem mismatch de hidratação relevante porque roda no cliente; mas se algum dia virar RSC, quebra). **Baixa**.
- **Accordion: `onClick` no card inteiro + `<Link onClick={e => e.stopPropagation()}>` dentro** — `src/app/landing/page.tsx:184,224`. Ok, o `stopPropagation` evita fechar o card ao clicar em "Assinar".

### Responsivo
- `overflow-x-hidden` no root previne scroll lateral dos glows.
- Hero `text-[6.5rem]` no `md` — em `md` (768px) `6.5rem` ainda é grande mas cabe; `4rem` no mobile.
- Mockup do hero `h-[400px]` com `R$ 45.000,00` em `text-7xl` — em 320px o número transborda a caixa (`overflow-hidden` no pai corta, mas fica feio).
- Navbar `px-8 md:px-16` fixa — ok.

### UX/UI a melhorar
- É uma landing decente; o bloqueio do middleware é o problema real.

---

## `src/app/privacidade/page.tsx` e `src/app/termos/page.tsx`

### Lógica principal
- Server components estáticos, `metadata` própria. Texto jurídico. Linkam um pro outro e pra `/login`. Estão em `PUBLIC_PATHS` do middleware — acessíveis deslogado. ✅

### Bugs
- **Data "hardcoded" `ATUALIZADO = '7 de setembro de 2026'`** — coerente com a data do sistema; só lembrar de atualizar manualmente. **Baixa**.
- **E-mail de contato diverge**: `privacidade`/`termos` usam `new.flow.sys@gmail.com`; o `userEmail` do projeto é `new.company.sys@gmail.com`. Conferir qual é o correto. **Baixa**.
- Nenhum bug funcional.

### Responsivo
- `max-w-2xl px-5 py-16`, texto `text-[15px] leading-relaxed`. Perfeito pra leitura mobile.

### UX/UI a melhorar
- Sem observações — são páginas de texto e cumprem o papel.

---

## Compartilhados

### `src/store/usePlatformStore.ts`

- **`persist` com `partialize` só de `quoteDraft`** — `linha 310-313`. `companyInfo/clients/savedServices` **não** são persistidos, mas `hydrated` também não → a cada navegação de rota que remonta o provider... na verdade Zustand store é módulo singleton, sobrevive. Ok.
- **`hydrate()` sem tratamento de erro / sem flag de "erro"** — `linha 190-202`. `Promise.all([company.get, clients.list, services.list])`; se **qualquer uma** falhar (401), o `set({..., hydrated: true})` nunca roda → `hydrated` fica `false` pra sempre → todas as páginas que fazem `!hydrated ? 'Carregando...'` travam. `StoreHydrator` só faz `console.error`. **Média/Alta** (onboarding de conta nova sem `companyId` resolvido, ou blip de rede no load, congela o app inteiro).
- **`updateCompanyInfo` otimista + `set(toCompanyInfo(saved))`** — se o PATCH falha, o estado otimista **não** é revertido (sem catch). **Média**.
- **`loadProposalIntoDraft` gera `id: randomId()` novo pra cada item** — `linha 283`. Correto (ids locais), mas significa que `order` é a única âncora de ordem e ela vem de `it.order ?? 0` — itens antigos sem `order` embaralham.
- **`randomId` = `crypto.randomUUID?.() ?? Math.random().toString(36)`** — guardado, ok. Mas `CommercialEditor.tsx:186` usa `crypto.randomUUID()` **sem** guarda → quebra em contexto inseguro/Safari antigo. **Baixa**.
- **`asTemplate` restringe a 6 ids** com fallback `'cyber'` — ok.

### `src/lib/api.ts`

- **`request<T>` trata `!res.ok` lendo `body.error`; retorna `undefined as T` em 204** — ok.
- **`api.proposals.update` não tem `clientId` no tipo** — `linha 325-347`. Impossível trocar o cliente de uma proposta pela camada tipada (ver bug em `quotes/preview`). **Média** (funcionalidade ausente).
- **`api.contracts.upload` / `payments.uploadReceipt` fazem `fetch` cru** (não passam por `request`) e setam `Content-Type` automático do `FormData` — ok.
- **Sem timeout / AbortController** em nenhuma chamada — uma requisição pendurada trava o botão indefinidamente (todos os `disabled={isPending}`). **Baixa**.
- **`Payment.expectedPaymentDate` / `billingLink`** no tipo mas nunca setados por nenhuma rota lida — campos mortos ou de feature incompleta.

### `src/lib/commercial.ts`

- **`parseCommercial` faz `throw`** para entrada inválida e `return null` para `null` — chamadores misturam os dois contratos. `p/[token]/page.tsx:63` chama sem try/catch no server render → 500. **Média**.
- **`commercialSchedule` — modo `client` sem `clientDueDate`** cai em `currentMonthEnd()` (linha 132) e `dateAt` usa `last` (fim do mês) — coerente.
- **`commercialTotals`: `Math.round(item.quantity * item.unitPrice)`** por item, depois soma — arredonda por linha (padrão do app, consistente com `normalizeProposalItems`). Ok.
- **`validateCommercial(items, c, requireDate)`**: `once > 0 && once < c.installments` (linha 105) — impede parcelar R$ 0,03 em 4x. Bom.
- **`commercialSchedule` `dateAt(offset)` com `Math.min(base.getUTCDate(), last)`** — preserva o dia contratado limitado ao fim do mês. Correto (fevereiro etc.).
- **`currentMonthEnd()` usa `new Date()` (hora do servidor)** — se o servidor estiver em UTC e o dono no Brasil, "fim do mês corrente" pode divergir 1 dia perto da virada. **Baixa**.

### `src/lib/analytics.ts`

- Ver crítico #7 (fuso em `paymentHealth`/`upcomingBills`).
- **`closedByMonth`/`revenueByMonth` bucketizam com `Date` local** (`monthKey` usa `getFullYear/getMonth` local) enquanto `respondedAt`/`paidAt` são UTC — deslize de mês na virada. **Baixa**.
- **`topServices` agrupa por `it.name.trim()`** — dois serviços com o mesmo nome (ex.: "Consultoria") de propostas diferentes viram uma linha só. Provavelmente intencional. **Baixa**.
- **`analyzeServiceTimelines`**: `parseDaysFromTimeline` interpreta "1 mês" = 30 dias, "2 semanas" = 14; compara com dias corridos entre `startedAt` e `deliveredAt`. "20 dias úteis" é lido como 20 corridos → alerta de atraso enviesado. **Baixa**.
- Funções puras e testáveis — boa separação.

### `src/lib/proxy.ts` — ver seção própria acima.

### `src/components/CommercialEditor.tsx`

- **Inputs numéricos com `Number(e.target.value)`** (linhas 111, 118, 122, 198, 202) — campo vazio → `0`; `min/max` do HTML não impede digitar fora. Estado do draft fica temporariamente inválido (`months: 0`, `installments: 0`) e `commercialTotals` roda com isso (só multiplica). A validação real só no submit. **Baixa**.
- **`crypto.randomUUID()` sem guarda** — linha 186. **Baixa**.
- **`details: e.target.value.split('\n')`** (linha 229) — não faz `.filter(Boolean)`, então linhas em branco viram bullets vazios até o servidor limpar (`normalizeProposalItems` filtra). Cosmético no preview. **Baixa**.
- **`edit` recria o array inteiro de `services` a cada tecla** (linha 168) — com muitos itens, re-render pesado + `AnimatePresence` recalculando. **Baixa** (perf).
- **Não há `<form>` nem `onSubmit`** — Enter em qualquer input não faz nada (ok) mas também não há barreira; a validação depende 100% do botão externo.

### `src/components/ExecutionModal.tsx`

- **`PixBox`: `resolvePix(company)` chamado sem `proposal`** (linha 118) — checa só o PIX global; o texto "Usando o PIX global" ignora se `pixKeyOverride` desta proposta está setado mas inválido.
- **`PaymentRow` toggle "Marcar pago" ↔ "pending"** (linha 374) — força status manual; `recomputePaymentStatus` depois respeita `paid` manual mas **rebaixa** de volta pra `pending` só some lógica — na verdade `paymentStatus.ts:31` só protege `pending → paid`, não `paid → pending`. Marcar pago manual e depois o cliente mexer nas entries pode voltar pra `awaiting_verification`? Não — `recomputePaymentStatus` roda no fluxo do cliente e faria `status = paid` se verified cobre, ou `awaiting`, ou `pending`; a proteção só evita rebaixar `paid` quando o cálculo dá `pending`. Se der `awaiting_verification`, **rebaixa** um `paid` manual. **Média** (dono marca pago, cliente anexa recibo novo, volta pra "em análise").
- **`clearPlan` ("Apagar plano")** — `PaymentsList` linha 447: sem `confirm()`. Apaga todas as parcelas não-pagas. **Média**.
- **`ContractBox` upload aceita `image/*` e PDF** — nome do arquivo vai pro `Content-Disposition` da rota de download sem sanitizar (`portal/.../contract/route.ts:31`): `filename="${proposal.contractFileName}"` — um nome com `"` ou `\r\n` permite header injection. **Média** (o nome vem do `File` do dono, risco baixo mas real).
- **Modal: `max-h-[90vh] overflow-y-auto`** — ✅ tem scroll interno.
- **`onClick={onClose}` no backdrop + `stopPropagation` no card** — ✅.
- **`PunctualityBanner` faz `useQuery(['clientInsight', clientId])` sem `enabled`** — dispara mesmo com o modal fechado? Não, o componente só monta dentro do modal. Ok.

### `src/components/templates/*`

- **`TemplateRenderer`** (`linha 40`): recalcula `total`/`paymentTerms`/`items` quando há `commercial`; multiplica quantidade e preço por `c.months` pros itens mensais e injeta `· N mensalidades` no nome. Coerente, mas o `price` da linha vira `round(qty*unitPrice)*months` — arredonda antes de multiplicar por meses (ok, cada mês é redondo).
- **`MAP[template] ?? TemplateCyber`** — fallback seguro pra template desconhecido.
- **`CommercialSummary`** (`linha 18`): a tabela do calendário está dentro de `<div className="overflow-x-auto">` ✅. `schedule` só é montado se `dueDateMode !== 'client'`; `try/catch` engole erro de draft incompleto ✅.
- **`CommercialSummary` sempre `bg-white text-[#17231f]`** — não respeita tema; no preview (fundo escuro) fica um bloco branco. Provavelmente intencional (parece papel).
- **`TemplateDetalhado`**:
  - `className="... md:px-6 md:px-16 md:py-20"` — `md:px-6` e `md:px-16` **conflitam** (Tailwind mantém o último; `md:px-6` é lixo). `linha 41`. **Baixa**.
  - `min-h-[29.7cm]` + `max-w-[21cm]` — em mobile o `max-w-[21cm]` (~794px) é limitado por `w-full`, mas os paddings `px-8 md:px-16 py-14` num "papel" de altura A4 fixa criam muito scroll vertical vazio no celular.
  - Cabeçalho da tabela `grid ... sm:grid-cols-[44px_1fr_130px] md:grid-cols-[52px_1fr_80px_140px]` mas as **linhas** usam a mesma grade — em `<sm` é `grid-cols-1` e os campos empilham sem rótulo (o header "Item/Descrição/Qtd/Subtotal" só aparece `sm+`). Em 320px cada item vira um bloco sem cabeçalho de coluna. **Média** (legibilidade).
  - `text-[clamp(2.25rem,8vw,5rem)]` no "Orçamento Detalhado" com `break-words` — ok.
- Os demais templates (`Cyber`, `Minimalista`, `Executivo`, `Escopo`, `Essencial`) não foram lidos linha a linha; pelo padrão de `Detalhado`/`CommercialSummary`, esperar: containers `max-w-[21cm]`, `min-h` A4, tabelas que precisam de wrapper `overflow-x-auto`, e fundos claros fixos independente de tema. **Recomendado** revisar cada um em 320/375/768px e verificar wrapper de scroll em qualquer `<table>` ou grid de colunas fixas.

### `src/components/layout/Sidebar.tsx`

- **`isActive` para `/` usa `pathname === '/'`; demais usam `startsWith(link.href + '/')`** — `/approved` e `/approved/[id]` ambos acendem "Aprovados" ✅. Mas `/havi` e um hipotético `/havi-x` — `startsWith('/havi/')` evita. Ok.
- **`motion.div layoutId="sidebar-active"`** — a animação de "pílula" que desliza entre itens; se dois `Sidebar` montam (desktop fixo + gaveta mobile no mesmo DOM), há **dois** elementos com o mesmo `layoutId` → Framer Motion faz warp entre eles. `AppChrome` renderiza **um** `<Sidebar>` só (com classes responsivas), então ok. **Baixa** (frágil se alguém duplicar).
- **`handleSignOut`**: `await signOut()` sem try/catch — se falhar, `router.push('/login')` mesmo assim (usuário fica "deslogado" na UI mas com sessão viva). **Baixa**.
- **`session?.user?.email` no rodapé** — `useSession()` client; durante load mostra "—". Ok.

### `src/components/layout/MobileBar.tsx`

- `sticky top-0 z-[90]`; `Sidebar` gaveta é `z-[100]`, backdrop `z-[99]` — camadas coerentes.
- **Sem `title`/`aria` no logo**; botões têm `aria-label` ✅.
- Altura ~49px não é descontada por páginas que usam `h-[calc(100dvh...)]` (ver bug do `havi`). **Média** (afeta havi; outras páginas usam `min-h-screen` que também ignora a barra mas rolam).

### `src/components/layout/PageHeader.tsx`

- Puro, sem estado. `flex-col sm:flex-row` ✅. `title` em `text-3xl sm:text-4xl lg:text-5xl` com `tracking-tighter` — títulos longos em 320px podem transbordar (sem `break-words`). **Baixa**.

### `src/lib/analytics.ts` / `src/lib/commercial.ts` — cobertos acima.

---

## Padrões recorrentes (dívida transversal)

1. **Ações destrutivas sem `confirm()`**: excluir cliente (`clients/page.tsx:94`), serviço (`services/page.tsx:357`), proposta (`proposals/page.tsx:189`), plano de cobrança (`ExecutionModal.tsx:447`), recibo do cliente (`CockpitClientView.tsx` `EntryRow.remove`). Só `redo` e `removeMonth` (ProgressLog) confirmam.
2. **`hydrated` sem caminho de erro**: `clients`, `services`, `quotes/new`, `settings` mostram "Carregando..." para sempre se `hydrate()` rejeitar.
3. **Fuso horário**: mistura de `timeZone: 'UTC'` (correto pra datas puras) e formatação local (correto pra timestamps), aplicados de forma trocada em vários lugares (`approved/[id]` usa UTC em `respondedAt`; `historico` usa UTC em `paidAt`; `analytics` compara data pura com `Date` local).
4. **Estado local inicializado de props sem re-sync** (`useState(prop)` sem `key`): `EmailTemplatesSettings.TemplateCard`, `AvaliacaoView.ProjectReview`, `MonthReviewBlock`, `ProgressLog.MonthCard`, `ExecutionModal.PixBox`.
5. **`catch (err: any) { setError(err.message) }`**: vaza "Failed to fetch" pra UI em `success`, `portal/login`, vários.
6. **Itens de proposta perdem campos comerciais ao clonar/editar** (`proposals/page.tsx:114`, `approved/[id]/page.tsx:72`): falta `billingType/optional/selected/packageId/order`.
7. **`console.log` de debug em produção**: `api/p/[token]/setup-account/route.ts:20,21,26` (com token).
