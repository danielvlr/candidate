# Relatório de QA — Camarmo (2026-10-23)

QA manual no Chrome com os três perfis, mais checagem da API com o token de cada perfil e leitura do código.
Cada bug tem **evidência**, **passos**, **esperado × obtido**, **arquivos** e **sugestão de correção**,
para que possa ser corrigido depois sem precisar refazer a investigação.

## 1. Ambiente de teste

| Item | Valor |
|---|---|
| Código | `main` @ `2f9f66a` (inclui PRs #10–#13) |
| Backend | `SPRING_PROFILES_ACTIVE=render` contra Postgres 16 descartável (`docker run postgres:16`, porta 5433) |
| Frontend | `npm run dev` (Vite, proxy `/api` → `localhost:8080`) |
| Navegador | Chrome (extensão Claude in Chrome) |
| Dados | Seed via API (2 empresas, 2 headhunters, 4 candidatos, 3 vagas, 3 usuários) **+ dados reais puxados do Jestor sem querer** — ver BUG-01 |

Usuários de teste (seed local, não existem em produção):

| Perfil | Login | Observação |
|---|---|---|
| ADMIN | `admin@qa.local` | admin de bootstrap |
| HEADHUNTER | `hugo@qa.local` | vinculado ao headhunter "Hugo Headhunter" (vagas 1 e 2) |
| HEADHUNTER | `helena@qa.local` | vinculada a "Helena Recrutadora" (vaga 3) |
| CPARTNER | `cpartner@qa.local` | sem vínculo |

Legenda da evidência: **[Chrome]** reproduzido na tela · **[API]** reproduzido com `fetch`/`curl` usando o token do perfil · **[Código]** verificado lendo o código (não exercitado na tela).

## 2. Perfis

| Perfil (backend) | Perfil (frontend) | Para quem |
|---|---|---|
| `ADMIN` | `admin` | Gestão completa: headhunters, vagas, empresas, Jestor, usuários |
| `HEADHUNTER` | `headhunter` | Recrutador: os próprios candidatos e vagas, empresas |
| `CPARTNER` | `cpartner` | "Senior"/consultor de carreira: assessorados e vagas |

Como o acesso funciona hoje:
- No frontend, `RoleBasedRoute` redireciona para `/` quando o perfil não está liberado.
- No backend, a única regra por perfil é `/api/v1/users/** → ADMIN` (`SecurityConfig.java:61`); todo o resto exige só estar logado.

## 3. Funcionalidades por perfil

### ADMIN — menu: Dashboard, Headhunters, Vagas, Empresas, Integração Jestor, Usuários

| Área | Rota | Funcionalidades | Resultado no QA |
|---|---|---|---|
| Login | `/signin` | Login, erro de senha, "manter conectado", esqueci a senha | OK (erro de senha exibido) — marca "TailAdmin" (BUG-21) |
| Dashboard | `/` | KPIs, feed de atividade, ações rápidas | Abre zerado: filtro de empresa vem pré-selecionado (BUG-15) |
| Headhunters | `/headhunters`, `/headhunters/:id` | Lista, busca, ativar/desativar, novo, editar, detalhe | Lista cortada em 10 (BUG-10); "Novo" quebra (BUG-09); ativar só local (BUG-11) |
| Vagas | `/jobs` | Kanban/lista, busca, filtros, pausar/ativar/fechar | Kanban OK; rótulos de prazo OK; pausar mostra erro (BUG-07) |
| Nova vaga | `/jobs/create` | Formulário, rascunho, publicar | Sem headhunter, categoria, valor ou garantia (BUG-16) |
| Detalhe da vaga | `/jobs/:id` | Abas, atividade, enviar candidatos, fechar com aprovado, breach | **Fechar com candidato aprovado OK** (garantia criada); pausar mostra erro (BUG-07) |
| Empresas | `/clients*` | Lista, filtros, criar/editar, suspender/ativar, timeline | Suspender mostra erro e a empresa some da lista (BUG-07, BUG-12) |
| Candidatos (fora do menu) | `/candidates*` | Lista, filtros, convite, novo, blacklist, LinkedIn | Blacklist mostra erro (BUG-07); LinkedIn por URL quebra (BUG-08) |
| Jestor | `/settings/jestor` | Testar conexão, sincronizar, histórico | Página OK |
| Usuários | `/settings/users` | Trocar perfil, vínculo com headhunter | Troca de perfil OK; não remove vínculo (BUG-14) |

### HEADHUNTER — menu: Dashboard, Candidatos, Vagas, Empresas

| Área | Rota | Funcionalidades | Resultado no QA |
|---|---|---|---|
| Dashboard | `/` | Totais, últimas atualizações, vagas em aberto | Mostra só as próprias vagas (OK); textos técnicos (BUG-21) |
| Vagas | `/jobs`, `/jobs/:id` | Kanban/lista sem botões de status | Cards arrastáveis mesmo sem permissão (BUG-04) |
| Busca global | cabeçalho | Busca vagas/candidatos/empresas | **Lista vagas de outros headhunters** (BUG-03) |
| Candidatos | `/candidates*` | Igual ao admin | Igual ao admin |
| Empresas | `/clients*` | Igual ao admin, incluindo suspender e editar | Permissão a definir (BUG-05) |
| Bloqueadas | `/headhunters`, `/settings/*`, `/jobs/create` | Redirecionam para `/` | OK na tela, **abertas na API** (BUG-02) |

### CPARTNER — menu: Dashboard, Assessorados, Vagas

| Área | Rota | Funcionalidades | Resultado no QA |
|---|---|---|---|
| Dashboard | `/` | Totais de assessorados, vagas compatíveis | "Vagas Compatíveis" são dados fictícios fixos (BUG-18) |
| Assessorados | `/assessorados*` | Lista/kanban, novo, detalhe, alterar fase, pausar | Fase grava mas a tela não atualiza (BUG-07); pausar não grava (BUG-13) |
| Vagas | `/jobs*` | Igual ao headhunter, sem escopo | Vê todas as vagas (BUG-22) |
| Fora do menu | `/candidates*`, `/clients*` | Abrem pela URL, com todas as ações | BUG-05 |

### Público (sem login)

| Rota | Resultado no QA |
|---|---|
| `/forgot-password` | OK — 202 sem revelar se a conta existe |
| `/reset-password?token=` | OK — token inválido → `{"valid":false}` |
| `/register/:token` | OK — convite inválido → 410 "Convite inválido." |
| `/api/**` sem token | OK — 401 |

## 4. Resumo dos bugs

| ID | Severidade | Área | Título | Evidência |
|---|---|---|---|---|
| BUG-01 | **Crítica** | Config/Segurança | Token do Jestor de produção commitado como default: qualquer execução local puxa dados pessoais reais | [Chrome][Código] |
| BUG-02 | **Alta** | Segurança | Backend não autoriza por perfil: HEADHUNTER cria headhunter, altera vaga alheia etc. | [API] |
| BUG-03 | **Alta** | Segurança | Escopo do HEADHUNTER vaza: busca global, `/jobs/search`, `/jobs/kanban`, `/jobs/{id}` | [Chrome][API] |
| BUG-07 | **Alta** | Frontend | Ações que dão certo mostram erro (resposta vazia quebra `api.ts`) | [Chrome] |
| BUG-08 | **Alta** | Candidatos | Importar do LinkedIn por URL chama endpoint inexistente → erro 500 | [Chrome] |
| BUG-09 | **Alta** | Headhunters | "Novo Headhunter"/"Editar" levam a rota inexistente → "Erro ao carregar headhunter" | [Chrome] |
| BUG-16 | **Alta** | Vagas | Não há como atribuir headhunter a uma vaga (nem tela nem API); nova vaga sem campos essenciais | [Chrome][Código] |
| BUG-04 | Média | Vagas | Arrastar no kanban troca o status para qualquer perfil (inclusive CLOSED sem valor) | [Chrome][Código] |
| BUG-05 | Média | Rotas | CPARTNER abre `/candidates` e `/clients` pela URL, com todas as ações | [Chrome] |
| BUG-06 | Média | API | Erros de cliente viram 500 e a resposta vaza detalhes internos | [API] |
| BUG-10 | Média | Listas | Listas cortadas em 10 itens (headhunters, assessorados); contadores vazios | [Chrome][Código] |
| BUG-11 | Média | Headhunters | Ativar/Desativar headhunter só muda a tela, não grava | [Código] |
| BUG-12 | Média | Empresas | Empresa suspensa some da lista e não pode ser reativada | [Chrome] |
| BUG-13 | Média | Assessorados | "Pausar" não grava; arrastar no kanban só muda a tela | [Chrome][Código] |
| BUG-14 | Média | Usuários | Não dá para remover o vínculo com headhunter; falta criar/ativar usuário na tela | [Chrome][Código] |
| BUG-15 | Média | Filtros | Filtro global de empresa vem pré-selecionado → dashboard e listas zerados | [Chrome] |
| BUG-17 | Média | Candidatos | Admin convidando/aprovando candidato age como headhunter de id 1 (fixo no código) | [Código] |
| BUG-18 | Baixa | Dashboard CPARTNER | "Vagas Compatíveis" são dados fictícios fixos no código | [Chrome] |
| BUG-19 | Baixa | Vaga detalhe | Contador da aba "Candidatos Enviados" soma shortlists, mas a aba lista candidaturas | [Código] |
| BUG-20 | Baixa | Links | Links para `/warranties` (rota comentada) caem na página em branco | [Código] |
| BUG-21 | Baixa | UI/Textos | Títulos errados, "Dashboard-admin", "TailAdmin", textos sem acento, status em inglês | [Chrome] |
| BUG-22 | Baixa (decisão) | Escopo CPARTNER | CPARTNER vê todas as vagas e todos os assessorados; não há vínculo CPARTNER ↔ senior | [API][Código] |
| BUG-23 | **Alta** | Formulários | CNPJ/CEP vazios são recusados: não dá para criar empresa sem CNPJ+CEP nem candidato sem CEP | [Chrome] (rodada 2) |
| BUG-24 | Média | Frontend | Mensagens de erro do backend são descartadas ("HTTP error! status: 409/500", "Erro ao criar empresa") | [Chrome] (rodada 2) |
| BUG-25 | Média | Vagas | "Salvar como Rascunho" cria a vaga como ACTIVE | [Chrome] (rodada 2) |
| BUG-26 | Média | Vaga detalhe | Candidatos enviados (shortlist) não aparecem em nenhum lugar da vaga | [Chrome] (rodada 2) |
| BUG-27 | **Alta** | Postgres | `Client.description/notes` (`@Lob` → `oid`) lidos fora de transação: fechar vaga devolve 500 (mas grava) e o card de garantia quebra | [Chrome] (rodada 2) |
| BUG-28 | Baixa | Datas | Datas `LocalDate` exibidas um dia antes (fuso) | [Chrome] (rodada 2) |
| BUG-29 | Baixa | Vaga detalhe | Ao navegar para uma vaga que falha (404), a tela mantém os dados da vaga anterior | [Chrome] (rodada 2) |
| BUG-30 | Média | Assessorados | "Vagas Compatíveis" no detalhe do assessorado mostra "6500% compatível" | [Chrome] (rodada 2) |
| BUG-31 | Baixa | UI/Textos | Nome do candidato ausente nos cards de assessorado, histórico com códigos crus, acentos e toasts restantes | [Chrome] (rodada 2) |

## 5. Detalhamento

### BUG-01 — Token do Jestor de produção commitado como default (Crítica)
- **Evidência [Chrome][Código]:** `backend/src/main/resources/application.yml:46-47` define `jestor.api-url` e `jestor.api-token` com **valores default reais**. Ao subir o backend localmente (sem `JESTOR_API_TOKEN`), o `JestorSyncScheduler` rodou às 13:30 e criou no banco local 400 empresas, 22 headhunters, 828 vagas e ~1.570 candidatos reais (log: `Sync clients complete: created=400 ...`).
- **Impacto:** vazamento de credencial no repositório. Qualquer pessoa com acesso ao código lê o Jestor de produção, e qualquer ambiente de dev/teste copia dados pessoais (LGPD).
- **Esperado:** sem token configurado, a integração fica desligada (`@ConditionalOnProperty` já prevê isso).
- **Correção:**
  1. Trocar por `${JESTOR_API_TOKEN:}` e `${JESTOR_API_URL:}`, sem default; manter o scheduler desligado quando vazio.
  2. **Rotacionar o token no Jestor** (ação manual — o token atual está no histórico do git).
  3. Conferir se o token já está configurado no Render antes do deploy.

### BUG-02 — Backend não autoriza por perfil (Alta)
- **Evidência [API]** com o token de `hugo@qa.local` (HEADHUNTER):
  - `POST /api/v1/headhunters` → **201** (criou o headhunter id 25)
  - `PATCH /api/v1/jobs/3/status {"status":"PAUSED"}` em vaga de **outro** headhunter → **200**
  - `GET /api/v1/warranty-rules` → 200; `GET /api/v1/assessorados` → 200
  - Só `/api/v1/users` responde 403.
- **[Código]** também ficam abertos a qualquer logado: CRUD de `/headhunters` (`HeadhunterController.java:93-130`), `POST /jestor/sync` (`JestorController.java:34`), CRUD de `/warranty-rules` (`WarrantyController.java:108-134`), `POST/PUT/DELETE /jobs`, `/jobs/{id}/pause|activate|close|status`, `/jobs/expire-jobs`, `/jobs/promote-expired-warranty`, `/assessorados/**`.
- **Causa:** `SecurityConfig.java:61-62` só restringe `/users/**`; não há `@PreAuthorize`.
- **Esperado:** o backend aplica as mesmas regras do frontend.
- **Correção:** em `SecurityConfig`, adicionar regras por método e caminho:
  - ADMIN: escrita em headhunters, jestor, warranty-rules, criação/edição/status de vagas, jobs/expire e promote;
  - ADMIN + CPARTNER: `/assessorados/**`;
  - mudança de status de vaga do headhunter só na própria vaga (via `HeadhunterScope`), se o produto quiser que o headhunter altere status.
  - Cobrir com testes de integração no estilo de `AuthSecurityIntegrationTest`.

### BUG-03 — Escopo do HEADHUNTER vaza (Alta)
- **Evidência [Chrome]:** logado como Hugo, ao digitar "Gerente" na **busca global do cabeçalho** aparecem vagas de outros headhunters (ex.: "Gerente de Loja", que é da Helena).
- **Evidência [API]** com o token do Hugo:
  - `GET /jobs/search?q=Gerente&size=50` → 168 resultados, 50 deles de outros headhunters;
  - `GET /jobs/kanban` → **831 vagas** (todas);
  - `GET /jobs/3` (vaga da Helena) → 200.
- **[Código]** sem `HeadhunterScope`: `JobController.java:48-66` (`/{id}`, `/{id}/detail`, `/search`), `:208-226` (`/kanban`, `/kanban/pipeline`), `/jobs/status/{s}`, `GET /warranties` (`WarrantyController.java:30-43`), `/applications/*`, `/shortlists/job/*`. No frontend: `AppHeader.tsx:75` usa `searchJobs` sem headhunter.
- **Esperado:** HEADHUNTER só enxerga vagas (e dados ligados) com `headhunter_id` igual ao seu `headhunterId`.
- **Correção:** aplicar `HeadhunterScope.resolve(principal, …)` nesses endpoints (filtro no repositório para busca/kanban; 404/403 no acesso por id a vaga de outro headhunter). Na busca global, passar o escopo. Adicionar testes como `HeadhunterJobsVisibilityIntegrationTest`.

### BUG-04 — Arrastar no kanban de vagas troca status para qualquer perfil (Média)
- **Evidência [Chrome]:** como HEADHUNTER os botões Pausar/Ativar/Fechar não aparecem, mas os cards continuam `draggable=true`.
- **Evidência [Código]:** soltar o card chama `PATCH /jobs/{id}/status` (`JobList.tsx:240-273`, `:474-477`). O backend aceita (BUG-02), inclusive levar para CLOSED pela tela sem valor final nem candidato aprovado, pulando o `CloseJobModal`.
- **Correção:**
  - Desabilitar o drag quando `userRole !== 'admin'`.
  - Arrastar para "Fechada" deve abrir o `CloseJobModal`, não chamar `/status`.
  - No backend, `updateJobStatus` deve recusar CLOSED (forçar `POST /jobs/{id}/close`).

### BUG-05 — CPARTNER abre `/candidates` e `/clients` pela URL (Média)
- **Evidência [Chrome]:** como CPARTNER, `/candidates` e `/clients` abrem com todas as ações (Novo, Blacklist, Suspender, Editar). `/settings/users` e `/headhunters` redirecionam corretamente.
- **Causa:** `App.tsx:74-91` não envolve essas rotas com `RoleBasedRoute`.
- **Correção:** `RoleBasedRoute allowedRoles={['admin','headhunter']}` em `/candidates*` e `/clients*`; esconder esses tipos na busca global para CPARTNER. Confirmar com o produto se HEADHUNTER pode suspender/editar empresas.

### BUG-06 — Erros de cliente viram 500 e vazam detalhes internos (Média)
- **Evidência [API]:**
  - `GET /api/v1/headhunters/new` → **500** `"Failed to convert value of type 'java.lang.String' to required type 'java.lang.Long'; For input string: \"new\""`
  - `POST /api/v1/candidates/validate-linkedin` (rota inexistente) → **500** com a mesma mensagem
  - `PATCH /api/v1/jobs/3/status` sem corpo → **500** `"Required request body is missing: public org.springframework.http.ResponseEntity<...JobController.updateJobStatus(...)"`
- **Causa:** o handler genérico do `GlobalExceptionHandler` devolve `ex.getMessage()` com status 500.
- **Correção:** tratar `MethodArgumentTypeMismatchException`, `HttpMessageNotReadableException`, `MissingServletRequestParameterException` → 400; `NoResourceFoundException`/`HttpRequestMethodNotSupportedException` → 404/405. No handler genérico, mensagem fixa ("Erro interno") e log do detalhe só no servidor.

### BUG-07 — Ações que dão certo mostram erro (Alta)
- **Causa:** `frontend/src/services/api.ts:63` sempre faz `response.json()`. Endpoints que respondem 200 sem corpo ou 204 geram `SyntaxError: Unexpected end of JSON input` (visto no console), e a tela trata como falha.
- **Evidência [Chrome]** (em todos os casos o banco gravou a mudança):

| Ação | Request | Tela |
|---|---|---|
| Pausar vaga (detalhe) | `PATCH /jobs/1/pause` → 200 | Toast "Erro ao pausar vaga"; status continua "Ativa" (no banco: `PAUSED`) |
| Suspender empresa | `PATCH /clients/402/suspend` → 200 | Página trocada por "Empresa nao encontrada / Erro ao suspender empresa" |
| Blacklist candidato | `PATCH /candidates/4/blacklist` → 200 | Lista trocada por "Erro ao carregar candidatos / Erro ao blacklistar candidato" |
| Alterar fase do assessorado | `PATCH /assessorados/1/phase` → 204 | Fase na tela continua "Onboarding" (no banco: `ACTIVE_SEARCH`) |

- **[Código]** mesmo problema: ativar vaga, ativar candidato, ativar empresa, status/delete de assessorado; na lista de vagas o `.then` de Pausar/Ativar nunca roda (`JobList.tsx:653-654`).
- **Correção:** em `request()`, devolver `undefined` quando `status === 204` ou o corpo estiver vazio (ler `response.text()` e só fazer `JSON.parse` se houver conteúdo). Ajustar as telas para recarregar os dados depois do sucesso.

### BUG-08 — Importar do LinkedIn por URL quebra (Alta)
- **Evidência [Chrome]:** `/candidates/new` → URL `https://www.linkedin.com/in/exemplo-qa` → "Importar" → `POST /candidates/validate-linkedin` **500** → "Erro ao importar dados do LinkedIn: HTTP error! status: 500".
- **Causa:** `api.ts:172-207` chama `/candidates/validate-linkedin` e `/candidates/import-linkedin`, que não existem no backend. Só existe `import-linkedin-pdf`. A opção por URL é o padrão (`CandidateForm.tsx:40`).
- **Correção (a decidir):** remover a opção por URL e deixar o PDF como padrão, **ou** implementar os endpoints. Recomendo remover: a importação por URL depende de raspar o LinkedIn.

### BUG-09 — Não dá para cadastrar nem editar headhunter pela tela (Alta)
- **Evidência [Chrome]:** `/headhunters` → "Novo Headhunter" → `/headhunters/new` → "Erro ao carregar headhunter" (a rota cai em `/headhunters/:id` com `id="new"`, e o backend responde 500 — ver BUG-06). O título da página fica "Dashboard".
- **Causa:** `HeadhunterList.tsx:132,189,225` aponta para `/headhunters/new` e `/headhunters/:id/edit`, que não existem em `App.tsx`. O backend já tem `POST/PUT /headhunters`.
- **Correção:** criar `HeadhunterForm` (create/edit: nome, e-mail, telefone, senioridade, custo fixo, custo variável, áreas) e as rotas `/headhunters/new` e `/headhunters/:id/edit` (antes de `/:id`), restritas a admin.

### BUG-10 — Listas cortadas em 10 itens e contadores vazios (Média)
- **Evidência [Chrome]:** `/headhunters` mostra "10 headhunters" com 24 no banco. Cada card mostra "candidatos" e "colocações" sem número.
- **Causa [Código]:** `getHeadhunters()` sem `size` usa o padrão 10 do backend (`HeadhunterController.java:39`). O mesmo vale para `getAssessorados()` na lista e no dashboard do CPARTNER.
- **Correção:** paginação real ou `size` alto, com o total vindo de `totalElements`. Preencher os contadores ou remover os rótulos.

### BUG-11 — Ativar/Desativar headhunter não grava (Média)
- **Evidência [Código]:** `HeadhunterList.tsx:96-104` só altera o estado local; nenhuma chamada de API. Ao recarregar, volta ao estado anterior.
- **Correção:** criar no backend um endpoint de status (por exemplo `PATCH /headhunters/{id}/status`, só ADMIN) ou usar `PUT /headhunters/{id}`; recarregar a lista.

### BUG-12 — Empresa suspensa some e não pode ser reativada (Média)
- **Evidência [Chrome]:** depois de suspender "Beta Varejo", `/clients` mostra 401 de 402 empresas e "Beta Varejo" não aparece. O botão "Ativar" nunca habilita e o filtro "Suspensa" fica sempre vazio.
- **Causa:** `ClientList.tsx:67` busca só `/clients/status/ACTIVE`.
- **Correção:** carregar todas as empresas (endpoint paginado sem filtro de status) e filtrar por status na tela.

### BUG-13 — Pausar assessorado não grava; kanban só muda a tela (Média)
- **Evidência [Chrome]:** `/assessorados/1` → "Pausar" → tela mostra "Pausado", mas `GET /assessorados/1` continua `status: ACTIVE`. O PUT enviado não tem o campo `status`.
- **[Código]:** arrastar no kanban (`AssessoradoList.tsx:96-125`) só muda a tela e grava um histórico falso local.
- **Correção:** usar `PATCH /assessorados/{id}/status` (já existe) para pausar/reativar e `PATCH /phase` no drop do kanban; recarregar depois do sucesso (depende do BUG-07 para respostas 204).

### BUG-14 — Gestão de usuários incompleta (Média)
- **Evidência [Chrome]:** em `/settings/users`, escolher "Sem vínculo" no select de headhunter do Hugo não chama a API e o valor volta para o anterior.
- **Causa:**
  - `UserManagementPage.tsx:139-142` ignora o valor vazio.
  - `UserService.updateRole` mantém o vínculo quando `headhunterId` vem nulo (`UserService.java:57`).
- **[Código]:** a tela não tem criar usuário nem ativar/desativar, embora o backend tenha (`UserController.java:30,42-49`).
- **Correção:** permitir limpar o vínculo de forma explícita (ex.: campo `clearHeadhunter` ou `headhunterId: 0`, com teste); adicionar "Novo usuário" e ativar/desativar na tela.

### BUG-15 — Filtro global de empresa vem pré-selecionado (Média)
- **Evidência [Chrome]:** no primeiro acesso como ADMIN, o filtro do cabeçalho vem com a primeira empresa da lista, e não com "Todas as Empresas". O dashboard chama `/jobs/filter?...&clientId=350` e mostra tudo zerado.
- **Correção:** o default de `ClientFilterContext` deve ser "Todas" (`null`). Se houver valor salvo, validar que a empresa ainda existe.

### BUG-16 — Não há como atribuir headhunter a uma vaga (Alta)
- **Evidência [Chrome]:** o formulário `/jobs/create` tem Título, Empresa, Localização, Tipo, Modalidade, Nível, Descrição, Salários, Benefícios, Habilidades, Prazo, Destaque e Urgente. **Não tem** headhunter, categoria de serviço, valor da vaga nem dias de garantia.
- **[Código]:** `JobCreateRequest`/`JobUpdateRequest` não têm `headhunterId`, e nenhum endpoint atribui headhunter. Hoje o vínculo só vem do sync do Jestor.
- **Consequências:**
  - a vaga criada no sistema fica invisível para todos os HEADHUNTERs;
  - "Enviar Candidatos" falha com "Vaga sem headhunter responsável" (`SendCandidatesModal.tsx:129`);
  - a garantia usa a categoria padrão.
- **[Código]** também: rascunhos (DRAFT) não aparecem no kanban, que só tem 4 colunas (`JobList.tsx:26`), e não existe tela de edição de vaga (`updateJob` sem uso).
- **Correção:** adicionar `headhunterId`, `serviceCategory`, `jobValue` e `guaranteeDays` ao create/update (backend + formulário); criar a tela de edição de vaga; decidir onde os rascunhos aparecem.

### BUG-17 — Admin age como headhunter de id 1 ao convidar/aprovar candidato (Média)
- **Evidência [Código]:** `CandidateDetailView.tsx:71` e `InviteCandidateModal.tsx:29` enviam `X-Headhunter-Id: 1` fixo quando o usuário não é HEADHUNTER. O mesmo id 1 é usado ao simular HEADHUNTER (`HeadhunterFilterContext.tsx:36-37`).
- **Impacto:** convites e aprovações feitos pelo admin ficam atribuídos a um headhunter real qualquer.
- **Correção:** para ADMIN, pedir o headhunter responsável no modal (ou usar o filtro de headhunter selecionado); bloquear o envio sem headhunter.

### BUG-18 — "Vagas Compatíveis" do dashboard CPARTNER são fictícias (Baixa)
- **Evidência [Chrome]:** com 0 assessorados, o card mostra "Tech Lead Full Stack — TechCorp Brasil — Match: Carlos Eduardo Mendes", "Head de Produto Digital — Fintech Solutions"...
- **Causa:** lista fixa em `SeniorDashboard.tsx:308-323`, que navega para `/jobs/1..5` (vagas reais sem relação).
- **Correção:** usar `/assessorados/{id}/matching-jobs` (já existe) ou esconder o card.

### BUG-19 — Contador da aba "Candidatos Enviados" não bate (Baixa)
- **Evidência [Código]:** o contador soma shortlists (`JobDetailView.tsx:241`), mas a aba lista candidaturas (`:557`). `JobShortlist` está comentado (`:18`).
- **Correção:** alinhar contador e conteúdo da aba (contar candidaturas ou reativar a shortlist).

### BUG-20 — Links para `/warranties` caem na página em branco (Baixa)
- **Evidência [Código]:** `RecentActivityCard.tsx:218` e `activityFeed.ts:319` linkam `/warranties`, que está comentada em `App.tsx:34-35`.
- **Correção:** reativar `WarrantyDashboard` (restrito a admin) ou apontar para a vaga da garantia.

### BUG-21 — Textos e títulos (Baixa)
- **[Chrome]** Tela de login mostra a marca do template "TailAdmin".
- **[Chrome]** Item de menu "Dashboard-admin" (`AppSidebar.tsx:27`).
- **[Chrome]** Título/breadcrumb "Dashboard" em `/clients`, `/assessorados`, `/settings/*`, `/headhunters/:id` (`AppHeader.tsx:14-24,44-49`).
- **[Chrome]** Rótulos sem acento: "Titulo da Vaga", "Localizacao", "Descricao da Vaga", "Nivel de Experiencia", "Integracao Jestor", "Informacoes", "Empresa nao encontrada".
- **[Chrome]** Feed do dashboard do headhunter: "Status alterado de ACTIVE para CLOSED" (status em inglês).
- **[Chrome]** Dashboard do headhunter lista vaga **pausada** em "Vagas em Aberto".
- **Correção:** ajustar os textos; mapear os status para pt-BR (Ativa/Pausada/Fechada); filtrar só ACTIVE em "Vagas em Aberto".

### BUG-22 — CPARTNER sem escopo (Baixa — precisa de decisão de produto)
- **Evidência [API][Código]:**
  - CPARTNER vê as 831 vagas.
  - `GET /assessorados` não filtra por senior (`AssessoradoController.java:34-45`).
  - `AppUser` não tem vínculo CPARTNER ↔ senior (o `seniorId` do assessorado aponta para `Headhunter`).
- **Decisão necessária:** o CPARTNER deve ver só os próprios assessorados? Se sim, criar o vínculo (ex.: `AppUser.headhunterId` reaproveitado como senior) e aplicar o escopo.

## 6. O que funcionou

- Login, erro de senha, logout, revalidação de sessão; rotas públicas e 401 sem token.
- `/api/v1/users` restrito a ADMIN (403 para os outros perfis); troca de perfil na tela de Usuários.
- **Fechar vaga com candidato aprovado** (PR #13) no Postgres: `POST /jobs/2/close` 200, vaga "Fechada", "Candidato aprovado: Bruno Barbosa" no detalhe e garantia criada.
- Rótulos de prazo por extenso ("Garantia: 2 de 90 dias", "Último contato", "Pausada há 22 dias").
- Dashboard do headhunter mostra só as próprias vagas; redirecionamento de rotas de admin para HEADHUNTER/CPARTNER.
- Criação de assessorado; alterar fase grava no backend (só a tela não atualiza).

## 7. Plano de correção (lotes para agentes)

Lotes pensados para mexer em arquivos diferentes e evitar conflito. Itens com "(decisão)" ficam fora até o produto decidir.

| Lote | Bugs | Escopo principal |
|---|---|---|
| A — Segurança backend | BUG-01, BUG-02, BUG-03 (backend), BUG-06 | `application.yml`, `SecurityConfig`, controllers de jobs/warranties/applications/shortlists, `GlobalExceptionHandler` + testes de integração |
| B — Frontend: respostas vazias e textos | BUG-07, BUG-15, BUG-19, BUG-20, BUG-21 | `services/api.ts`, `ClientFilterContext`, telas que chamam ações, textos, `JobDetailView` (contador), links `/warranties` |
| C — Frontend: acesso por perfil | BUG-03 (busca global), BUG-04, BUG-05 | `App.tsx`, `AppHeader.tsx` (busca + mapa de títulos), drag do `JobList.tsx` |
| D — Headhunters, empresas, usuários | BUG-09, BUG-10, BUG-11, BUG-12, BUG-14 | `HeadhunterList`/novo `HeadhunterForm`, `ClientList`, `UserManagementPage`, `UserService` |
| E — Vagas, assessorados, candidatos | BUG-08, BUG-13, BUG-16, BUG-17, BUG-18 | `JobCreateForm` + `JobCreate/UpdateRequest`, `CandidateForm` (LinkedIn), `AssessoradoDetailView`/`AssessoradoList`, `SeniorDashboard`, convites |
| Fora (decisão) | BUG-22 | Escopo do CPARTNER |

Ações manuais (não dá para agente fazer): **rotacionar o token do Jestor** (BUG-01) e confirmar `JESTOR_API_TOKEN` no Render.

## 8. Rodada 2 — teste completo na tela com o código corrigido

A primeira rodada deixou várias funcionalidades verificadas só por API ou código. A rodada 2 exercitou **todas na tela**:
- código: `main` + os 5 PRs de correção (#15–#19) combinados;
- banco: Postgres 16 descartável e limpo, sem sync do Jestor;
- dados: todos criados pelos próprios formulários.

### 8.1 Funcionalidades exercitadas no Chrome

| Perfil | Funcionalidade | Resultado |
|---|---|---|
| Público | Esqueci a senha (formulário) | OK — mensagem neutra |
| Público | Reset com token inválido | OK — "link inválido ou expirado" |
| Público | Cadastro por convite: sem aceitar LGPD (bloqueado), com aceite (204 "Cadastro recebido!"), link reaproveitado ("Convite inválido") | OK |
| Todos | Login pela tela (admin, headhunter), logout pelo menu "Sair" | OK |
| ADMIN | Dashboard: KPIs, feed com status traduzido, clique no KPI | OK |
| ADMIN | Empresa: criar, editar, nova nota na timeline | OK (criar exige CNPJ/CEP — BUG-23) |
| ADMIN | Headhunter: criar, editar, detalhe, desativar/ativar (persistem) | OK |
| ADMIN | Usuários: novo usuário (3 perfis), trocar perfil, "Sem vínculo", desativar (login 401) e reativar; próprio perfil travado | OK |
| ADMIN | Integração Jestor: testar conexão, sincronizar (409 sem token), histórico | Funciona; mensagem crua (BUG-24) |
| ADMIN | Vaga: criar com headhunter/categoria/valor/garantia, editar, rascunho | OK; rascunho vira ACTIVE (BUG-25) |
| ADMIN | Vaga detalhe: adicionar atividade (com data), enviar candidatos (shortlist), vincular candidato, pausar/ativar, fechar com aprovado, registrar breach | OK; shortlist invisível (BUG-26); fechar com empresa com descrição → 500 (BUG-27) |
| ADMIN | Lista de vagas: pausar pela barra, "Fechar" abre modal; kanban: arrastar para "Fechada" abre modal, para "Pausada" grava | OK |
| ADMIN | Candidato: criar, editar, nota, foto (upload + exibição), convite (exige headhunter), aprovar/rejeitar (exige headhunter no filtro), reenviar convite | OK (criar exige CEP — BUG-23) |
| ADMIN | Importar LinkedIn por PDF | Erro tratado de forma crua (BUG-24); sucesso não testável sem `OPENAI_API_KEY` |
| HEADHUNTER | Dashboard próprio, kanban sem arrastar, busca global só com as próprias vagas, vaga alheia → 404 | OK (tela antiga mantida ao navegar — BUG-29) |
| HEADHUNTER | Convite sem escolher headhunter, blacklist/ativar candidato (persistem, lista não quebra), reenviar | OK |
| HEADHUNTER | Rotas de admin redirecionam; Empresas acessível | OK |
| CPARTNER | Menu, dashboard sem dados fictícios, `/candidates` `/clients` `/headhunters` redirecionam | OK |
| CPARTNER | Assessorado: criar pelo formulário, editar, alterar fase, pausar/ativar, abas Vagas Compatíveis e Histórico, lista, kanban (arrastar grava a fase) | OK; "6500%" (BUG-30); textos (BUG-31) |

**Correções da rodada 1 confirmadas na tela:**
- BUG-03 (busca e vaga alheia), 04, 05, 07, 09, 10, 11, 12, 13, 14, 15, 17 e 18;
- BUG-21: menu, login e status traduzidos;
- BUG-02, 03 e 06 também pela API: 403 para headhunter, 404 para vaga alheia, 400 sem detalhe interno.

**Não testável neste ambiente:**
- entrega real de e-mails (sem SMTP local; a tela trata a falha);
- caminho de sucesso da importação do LinkedIn (sem `OPENAI_API_KEY`).

### 8.2 Bugs novos

#### BUG-23 — CNPJ/CEP vazios bloqueiam cadastros (Alta)
- **Evidência [Chrome]:**
  - `/clients/new` preenchido sem CNPJ e CEP → `POST /clients` 400 `{"fieldErrors":{"zipCode":"CEP deve ter formato válido","cnpj":"CNPJ deve ter 14 dígitos"}}`.
  - `/candidates/new` sem CEP → `POST /candidates` 400 (`zipCode`).
  - A tela mostra só "Erro ao criar empresa" / "Erro ao criar candidato".
- **Causa:** o formulário envia `""` nos campos opcionais, e as validações `@Pattern`/`@Size` do backend reprovam string vazia.
- **Correção:** normalizar `""` → `null` no frontend (ou no DTO, com `@JsonSetter`/trim) e/ou ajustar as regex para aceitar vazio. Teste de integração criando empresa e candidato sem CNPJ/CEP.

#### BUG-24 — Mensagens do backend descartadas (Média)
- **Evidência [Chrome]:**
  - Jestor: "✗ HTTP error! status: 409" (o backend manda "Integração com o Jestor não configurada").
  - Importar PDF: "HTTP error! status: 500" (o backend sabe que "Não foi possível extrair texto do PDF enviado").
  - Empresa/candidato: "Erro ao criar..." sem os `fieldErrors`.
- **Causa:** `request()` em `services/api.ts` lança `Error('HTTP error! status: N')` sem ler o corpo.
- **Correção:**
  - Ler `message`/`fieldErrors` do corpo e lançar um erro tipado; as telas mostram a mensagem e marcam os campos inválidos.
  - No backend, o erro de negócio do `LinkedInService` deve virar 422/400, não 500.

#### BUG-25 — "Salvar como Rascunho" publica a vaga (Média)
- **Evidência [Chrome]:** "Analista de Dados Pleno" salva como rascunho → `status=ACTIVE`.
- **Correção:** o create deve aceitar o status (DRAFT) vindo do formulário; o kanban/lista precisa mostrar os rascunhos (ligado ao BUG-16).

#### BUG-26 — Candidatos enviados (shortlist) somem (Média)
- **Evidência [Chrome]:**
  - "Enviar 2 Candidato(s)" → `POST /shortlists` 201 e toast de sucesso.
  - A aba "Candidatos Enviados" continua "Nenhum candidato vinculado". Ela lista candidaturas (`/applications`), não shortlists, e `JobShortlist` está comentado.
- **Correção:** reativar a listagem de shortlists na vaga (com status de aprovação do cliente) ou unificar o envio com as candidaturas. Renomear as abas para evitar confusão ("Enviados ao cliente" × "Vinculados").

#### BUG-27 — `@Lob` da empresa quebra respostas no Postgres (Alta)
- **Evidência [Chrome]:**
  - Empresa criada pela tela (com descrição/notas) → fechar vaga → `POST /jobs/2/close` **500**.
  - Log: `HibernateException: Unable to access lob stream` em `JobMapperImpl.toClientSummary` ← `JobController.closeJobWithValue`.
  - **A vaga foi fechada e a garantia criada mesmo assim**, mas a tela mostrou erro e "Ativa".
  - Mesmo erro em `GET /warranties/job/{id}` (`WarrantyResponse.fromEntity`), que alimenta o card de garantia.
- **Causa:**
  - `Client.description` e `Client.notes` são `@Lob String` e no Postgres viraram colunas `oid`, que só podem ser lidas dentro de transação.
  - Os controllers montam a resposta fora da transação do service.
  - As empresas vindas do Jestor têm esses campos nulos, por isso a rodada 1 não pegou. O H2 também não reproduz.
- **Correção (cuidado com dados de produção):**
  - (a) Imediata: montar as respostas dentro do service transacional, ou `@Transactional(readOnly = true)` nesses endpoints.
  - (b) Definitiva: trocar `@Lob` por `@Column(columnDefinition = "TEXT")` **com migração** do `oid` existente (`lo_get`/`convert_from`), porque `ddl-auto=update` não converte tipo.
  - Validar contra Postgres (docker), como manda o CLAUDE.md.

#### BUG-28 — Datas exibidas um dia antes (Baixa)
- **Evidência [Chrome]:**
  - Garantia com `startDate=2026-10-23`/`endDate=2027-01-21` exibida como "22/10/2026 — 20/01/2027".
  - Assessorado com início 20/10 exibido "19/10/2026".
- **Causa:** `new Date('YYYY-MM-DD')` interpreta como UTC e a exibição em America/Sao_Paulo volta um dia.
- **Correção:** formatar `LocalDate` sem conversão de fuso (split da string ou `new Date(y, m-1, d)`), num helper único.

#### BUG-29 — Tela de vaga mantém dados antigos após erro (Baixa)
- **Evidência [Chrome]:** como headhunter, ir de `/jobs/1` para `/jobs/2` (alheia, 404) pela navegação interna mantém a "Dev Java Sênior" na tela. Abrindo direto aparece "Erro ao carregar vaga".
- **Correção:** limpar `job` quando o `id` muda e no erro. Mensagem "Vaga não encontrada" para 404.

#### BUG-30 — "6500% compatível" (Média)
- **Evidência [Chrome]:** aba "Vagas Compatíveis" do assessorado mostra "6500% compatível". No dashboard do CPARTNER, a mesma vaga aparece como "65%".
- **Correção:** o detalhe multiplica por 100 um score que já vem em porcentagem; alinhar com o dashboard.

#### BUG-31 — Textos e UX restantes (Baixa)
- Cards de assessorado (lista/kanban) mostram "Candidato" em vez do nome; o dashboard do CPARTNER mostra "Match: Assessorado".
- O histórico do assessorado mostra códigos crus ("PAUSED para ACTIVE", "ONBOARDING para ACTIVE_SEARCH").
- Rótulos sem acento: `JobCreateForm` ("Titulo", "Localizacao", "Responsavel", "Servico", "Salvar Alteracoes"), `HeadhunterDetailView` ("Informacoes", "CUSTO VARIAVEL", "atribuida"), `CandidateDetailView` ("PRETENSAO", "PREFERENCIA", "Hibrido"), texto da timeline da empresa ("comecar").
- Criar empresa/headhunter/candidato/vaga e pausar pela lista não mostram toast de sucesso.
- Foto do candidato: escolher a foto e clicar em "Salvar Alterações" sem clicar em "Upload" descarta a foto sem aviso.
- Blacklist pede o motivo num `window.prompt` nativo (o resto usa modal).
- Depois do login, o usuário cai na última página do usuário anterior (ex.: headhunter caiu em `/jobs`), não no dashboard.

### 8.3 Plano de correção da rodada 2

| Lote | Bugs | Observação |
|---|---|---|
| F — Rodada 2 | BUG-23, 24, 25, 26, 27 (a), 28, 29, 30, 31 | Depende dos PRs #15–#19 (mesmos arquivos); base = integração dos 5 lotes. BUG-27 (b) exige migração e decisão de janela. |

### 8.4 Verificação do lote F (PR #20) no Chrome

Código `fix/qa-lote-f-rodada2` contra Postgres 16 limpo, exercitado na tela:

| Bug | Verificação | Resultado |
|---|---|---|
| BUG-23 | Empresa sem CNPJ/CEP e candidatos sem CEP pelos formulários | 201, com toast de sucesso |
| BUG-24 | Jestor sem token; importar PDF inválido | "Integração com o Jestor não configurada"; "Não foi possível extrair texto do PDF enviado" (agora 400) |
| BUG-25 | "Salvar como Rascunho" → coluna "Rascunho" → "Publicar" | `DRAFT`, depois `ACTIVE` com toast |
| BUG-26 | Enviar candidato | Aparece em "Enviados ao cliente", com status e "Enviado em ... por Hugo Headhunter" |
| BUG-27 (a) | Fechar vaga de empresa com descrição/notas; card de garantia | `POST /close` 200, `GET /warranties/job/{id}` 200, card visível |
| BUG-28 | Período da garantia; início do assessorado | "23/10/2026 — 21/01/2027" (= API); "Início: 20/10/2026" (= informado) |
| BUG-29 | Headhunter navega de vaga própria para alheia e volta | "Vaga não encontrada" sem dados antigos; volta normal |
| BUG-30 | Aba Vagas Compatíveis | "30% compatível" (igual ao dashboard) |
| BUG-31 | Nome no card e no match; histórico; acentos; toasts; foto ao salvar; Blacklist; login após logout | "Ana Aprovada" e "Match: Ana Aprovada (30%)"; "Fase alterada de Onboarding para Busca Ativa"; "Informações", "CUSTO VARIÁVEL", "Híbrido"; toasts presentes; foto enviada no salvar; modal "Bloquear candidato"; login cai em `/` |

Ainda não verificável neste ambiente: entrega real de e-mail (sem SMTP) e o caminho de sucesso da importação do LinkedIn (sem `OPENAI_API_KEY`). Os dois precisam ser conferidos em staging/produção com as credenciais configuradas.
