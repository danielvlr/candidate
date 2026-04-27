# Project Map — Camarmo Candidate Management

> Quick-reference para sessões futuras. Compilado por `/sciomc` em 2026-04-26 a partir de leitura completa de 96 endpoints, 16 entidades, 12 controllers, 14 services, todos os arquivos de config e o frontend completo. Veja `.omc/research/research-20260426-projinit/` para findings brutos por estágio.

---

## TL;DR

- **Monorepo**: `backend/` (Spring Boot 3.3.1, Java 21) + `frontend/` (React 19, Vite 6, TS 5.7, Tailwind 4)
- **Domínio**: gestão de candidatos / vagas / clientes / headhunters / shortlists / garantias / assessorados
- **Persistence**: H2 in-memory local; PostgreSQL no Render
- **Schema**: Hibernate DDL-auto (NÃO há Flyway)
- **Auth**: ❌ **não implementada** (apesar do que diz o `CLAUDE.md` legacy)
- **Tests**: ❌ **zero testes backend**; Playwright disponível no frontend
- **Deploy**: Render.com via Docker (backend) + static (frontend); CI em `.github/workflows/ci-cd.yml`
- **Sync externo**: Jestor (CRM) cron a cada 30min

---

## Estrutura raiz

```
candidate/
├── backend/                  Spring Boot
├── frontend/                 React + Vite
├── .docs/                    7 docs internos (openapi.yaml, schema.sql, diagram.md, etc.)
├── .omc/                     OMC research/state
├── .github/workflows/        CI/CD
├── render.yaml               Deploy Render (web+static+postgres)
└── docker-compose.yml        Stack local (com Redis+MinIO opcionais)
```

---

## Backend — package map

```
backend/src/main/java/com/empresa/sistema/
├── SistemaApplication.java   @SpringBootApplication @EntityScan @EnableJpaRepositories
│                              @EnableFeignClients @EnableScheduling
├── api/
│   ├── controller/           12 @RestController (ver tabela abaixo)
│   ├── dto/request/          18 DTOs de entrada
│   ├── dto/response/         19 DTOs de saída
│   ├── exception/            GlobalExceptionHandler (@RestControllerAdvice)
│   └── mapper/               11 MapStruct @Mapper interfaces
├── client/chatgpt/           Feign client OpenAI (LinkedIn PDF parsing)
├── config/                   WebConfig (CORS), JestorConfig, JestorSyncScheduler,
│                              NotificationScheduler, DataInitializer
├── domain/
│   ├── entity/               16 JPA entities
│   ├── repository/           16 JpaRepository
│   └── service/              14 @Service + JobStatusTransition + 2 exceptions
└── integration/jestor/       JestorClient (RestTemplate), JestorSyncService
```

### Service catalog (14)
`CandidateService`, `JobService`, `ClientService`, `HeadhunterService`, `JobApplicationService`, `ShortlistService`, `WarrantyService`, `AssessoradoService`, `HeadhunterDashboardService`, `JobMatchingService` (skills=35, workMode=20, salary=20, location=10, experience=15), `LinkedInService` (PDFBox→ChatGPT), `GmailEmailService` (alertas warranty), `JobHistoryService`, `FileUploadService`.

### Schedulers
- `JestorSyncScheduler` — cron `0 */30 * * * *` (`@ConditionalOnProperty=jestor.api-token`); 2 fases via `CompletableFuture.allOf`.
- `NotificationScheduler` — `0 0 8 * * MON-FRI` (alertas garantia 10d antes); `0 0 0 * * *` (expirar warranties).

---

## Domínio — entidades & relacionamentos

### Entidades (16)
**Core:** Candidate, Headhunter, Client, Job, JobApplication, Shortlist, Warranty, WarrantyRule, Assessorado.
**Filhos de Candidate:** Education, Experience.
**Histórias/audit:** AssessoradoHistory, HeadhunterHistory, JobHistory, CandidateStatusLog.
**Operacional:** SyncLog.

### Grafo (texto)
```
Client 1──N Job N──1 Headhunter
            │  └── N──1 Headhunter (assignment opcional)
            ├── N JobApplication N──1 Candidate (unique cand+job)
            │   └── 1 Warranty (auto on hire) ─── N WarrantyRule
            ├── N Shortlist N──1 Candidate, N──1 Headhunter (todas FKs NOT NULL)
            └── N JobHistory (timeline; FKs hh+cand opcionais)

Candidate 1──N Experience, Education (cascade ALL)
          1──N JobApplication, CandidateStatusLog (FK nullable)

Headhunter 1──N HeadhunterHistory (audit completo: changedBy/IP/UA)
           1──N Assessorado (senior_id) 1──N AssessoradoHistory

WarrantyRule  → 1 por ServiceCategory (unique)
SyncLog       → standalone, sem FKs
```

### Enums-chave
- `CandidateStatus`: ACTIVE, INACTIVE, HIRED, BLACKLISTED
- `JobStatus`: DRAFT, ACTIVE, PAUSED, CLOSED, EXPIRED, WARRANTY (⚠ WARRANTY bypassa o guard)
- `PipelineStage`: SOURCING, SCREENING, SHORTLISTED, INTERVIEW, OFFER, HIRED, WARRANTY
- `ApplicationStatus` (10): APPLIED, UNDER_REVIEW, SHORTLISTED, INTERVIEW_SCHEDULED, INTERVIEWED, TECHNICAL_TEST, OFFER_MADE, HIRED, REJECTED, WITHDRAWN
- `ShortlistStatus`: SENT, VIEWED, UNDER_REVIEW, INTERVIEW_REQUESTED, APPROVED, REJECTED, WITHDRAWN
- `WarrantyStatus`: PENDING, ACTIVE, EXPIRING_SOON, EXPIRED, BREACHED
- `ServiceCategory` (durações default): PROJETOS=60, NOSSO_HEADHUNTER=90, TATICAS=90, EXECUTIVAS=180

### Invariantes de negócio
1. Aplicação única por (candidate, job) — `@UniqueConstraint`.
2. Job deve estar ACTIVE para aceitar aplicações.
3. Candidate deve estar ACTIVE para aplicar.
4. `hire()` cria warranty automaticamente (não-bloqueante; falha logada como WARN).
5. Uma `WarrantyRule` por `ServiceCategory`.
6. Lookup de duração: `WarrantyRule.defaultDays` → `Job.guaranteeDays` → 90.
7. Soft-delete: Candidate via `INACTIVE`. Job via `CLOSED`. Headhunter / Assessorado: hard delete (com bug — `IllegalArgumentException` → 500).
8. `Job.companyName` é denormalizado do Client.
9. Jestor IDs em 5 entidades: Candidate, Headhunter, Client, Job, WarrantyRule.

---

## API — base paths e controllers

| Controller | Base path | Endpoints | Notas |
|---|---|---|---|
| HomeController | `/api` | 2 | Liveness, health |
| CandidateController | `/api/v1/candidates` | 18 | LinkedIn PDF import, photo upload, blacklist |
| ClientController | `/api/v1/clients` | 20 | Filtros multi-campo, enum endpoints |
| HeadhunterController | `/api/v1/headhunters` | 18 | Dashboard server-aggregated; pagination manual |
| JobController | `/api/v1/jobs` | 26 | Kanban (status + pipeline); shortcuts vs general status |
| JobApplicationController | `/api/v1/applications` | 18 | `hire` dispara warranty auto-create |
| JobHistoryController | `/api/v1/job-history` | 10 | Timeline; suporta tarefas pendentes |
| ShortlistController | `/api/v1/shortlists` | 6 | POST bulk; status via **query params** |
| WarrantyController | `/api/v1/warranties` + `/warranty-rules` | 11 | Breach manual; rules CRUD |
| AssessoradoController | `/api/v1/assessorados` | 13 | Kanban via `/phase`; matching jobs |
| FileUploadController | `/api/v1/upload` | 2 | apenas imagens, 5MB max |
| JestorController | `/api/v1/jestor` | 4 | sync trigger, history, test |

**Total: 96 endpoints. Todos sem auth.**

### Dual-pattern de pagination
- **Spring `Pageable`** (Candidate/Client/Job/JobHistory): `?page,?size,?sort=field,asc`, default 20.
- **Manual** (Headhunter/Assessorado): `?page,?size,?sortBy,?sortDir`, default 10.

### Validation error shape
```json
{
  "status": 400,
  "error": "Erro de validação",
  "message": "Dados inválidos fornecidos",
  "timestamp": "2026-04-26T...",
  "fieldErrors": {"email": "must be a well-formed email address"}
}
```

---

## Frontend — quick map

```
frontend/src/
├── App.tsx                   24 rotas, todas sob AppLayout
├── main.tsx                  bootstrap React
├── components/
│   ├── auth/                 SignInForm (stub), SignUpForm, RoleBasedRoute (client-side only)
│   ├── header/               ClientSelector, HeadhunterSelector, RoleSelector (dev), Header
│   ├── job/                  JobShortlist, JobTimeline, AddActivityModal, SendCandidatesModal
│   ├── ui/                   Button, Input, Card, Modal, Pagination, Skeleton, Toast,
│   │                         Badge, EmptyState, etc.
│   └── common/               PageBreadCrumb, ScrollToTop, ThemeToggle, etc.
├── context/                  ClientFilter, HeadhunterFilter, Theme, Sidebar, UserRole
├── hooks/                    useGoBack, useInfiniteScroll, useListSelection, useModal
├── layout/                   AppLayout, AppHeader, AppSidebar, Backdrop
├── pages/
│   ├── Dashboard/            AdminHome, SeniorDashboard, HeadhunterDashboard, Home,
│   │                         JobDetailView (em Dashboard/, não em Jobs/)
│   ├── Candidates/           CandidateList, CandidateDetailView, CandidateForm
│   ├── Clients/              ClientList, ClientDetailView, ClientForm
│   ├── Jobs/                 JobList, JobCreateForm, HeadhunterKanban, KanbanColumn,
│   │                         KanbanFilters, KanbanJobCard, KanbanViewToggle, JobDetailView
│   ├── Headhunters/          HeadhunterList, HeadhunterDetailView
│   ├── Assessorados/         AssessoradoList, AssessoradoForm, AssessoradoDetailView,
│   │                         AssessoradoKanban, KanbanCard, KanbanColumn
│   ├── AuthPages/            SignIn, SignUp, AuthPageLayout (UI dead-end — sem backend)
│   ├── Warranty/             WarrantyDashboard, WarrantyRules, WarrantyBreachModal
│   │                          (rotas comentadas em App.tsx)
│   ├── Settings/             JestorSyncPage
│   ├── Calendar.tsx, UserProfiles.tsx, Blank.tsx
├── services/api.ts           apiService singleton, base `/api/v1`, fetch nativo, sem interceptors
├── types/api.ts              14 interfaces + 18 enums espelhando DTOs do backend
└── icons/, layout/, etc.
```

### Contexts (5)
| Context | Storage | Default | Notas |
|---|---|---|---|
| ThemeContext | localStorage `'theme'` | sistema | |
| ToastProvider | in-memory | — | |
| UserRoleContext | in-memory | `'admin'` (sempre on load) | |
| ClientFilterContext | localStorage `camarmo_selectedClientId` | null | |
| HeadhunterFilterContext | localStorage `camarmo_selectedHeadhunterId` | locked ID=1 para role headhunter | ⚠ hardcode |

### Routing & guards
- 24 rotas autenticadas sob `AppLayout`
- `RoleBasedRoute` (client-side only): `/jobs/create` admin, `/headhunters/*` admin, `/settings/jestor` admin, `/assessorados/*` admin+senior
- 3 rotas comentadas: `WarrantyDashboard`, `WarrantyRules`, `HeadhunterKanban`
- `DashboardRoute` em `/` é role-switch entre AdminHome / SeniorDashboard / HeadhunterDashboard

---

## Configuração & deploy

### Profiles
| Profile | DB | Port | DDL | Uploads |
|---|---|---|---|---|
| default (`application.properties`) | H2 `jdbc:h2:mem:testdb` | 8080 | create-drop | `./uploads` |
| `application.yml` (overlay) | H2 `jdbc:h2:mem:talentbank` | 8081 ⚠ | create-drop | — |
| `render` (`application-render.properties`) | PostgreSQL via env | `${PORT:8080}` | **create** ⚠ destrutivo | `/tmp/uploads` (efêmero) |

⚠ Conflito real: `application.yml` e `application.properties` divergem em port (8081 vs 8080) e DB (talentbank vs testdb). Spring Boot carrega ambos — `.properties` tem prioridade na maioria dos cenários.

### Env vars (chaves)
**Backend Render (manual no dashboard):** `OPENAI_API_KEY`, `JESTOR_API_URL`, `JESTOR_API_TOKEN`, `MAIL_USERNAME`, `MAIL_PASSWORD`.
**Auto Render:** `DATABASE_HOST/PORT/NAME/USER/PASSWORD`, `PORT`, `RENDER_EXTERNAL_URL`.
**Backend Render (do `render.yaml`):** `FRONTEND_URL=https://camarmo.onrender.com`, `SPRING_PROFILES_ACTIVE=render`.
**Frontend Render:** `VITE_API_BASE_URL=https://camarmo-api.onrender.com/api/v1`.

### Comandos
```bash
# Local
cd backend && ./mvnw spring-boot:run                 # :8080
cd frontend && npm install && npm run dev            # :5173 (proxy /api → 8080)

# Build
cd backend && ./mvnw clean package -DskipTests       # → target/sistema-0.0.1-SNAPSHOT.jar
cd frontend && npm ci && npm run build               # → dist/

# Docker
docker build -t camarmo-api ./backend
docker build -t camarmo-ui ./frontend --build-arg VITE_API_BASE_URL=...
```

### Jestor (CRM externo)
- Sync: 30min (cron). Ativado via `@ConditionalOnProperty=jestor.api-token`.
- Tabelas mapeadas (IDs hardcoded em `application.yml`): jobs, clients, candidates, headhunters, warranty rules, candidate status logs.
- Pattern: upsert por `externalId` (`jestor_id` na entidade).
- Auditoria em `SyncLog`.

### ChatGPT (OpenAI)
- Cliente Feign em `client/chatgpt/`.
- Uso: `LinkedInService.parseLinkedInPdf()` → PDFBox extrai texto → ChatGPT → JSON → `CandidateCreateRequest`.
- ⚠ `ChatGptService` hardcoda `max_tokens=2000`, ignora `chatgpt.max-tokens` config.

---

## Riscos conhecidos & gotchas

### 🔴 Críticos (segurança / produção)
1. **Sem auth backend.** Todos os 96 endpoints são públicos. UI tem stub auth (`SignInForm` apenas `window.location.href='/'`).
2. **H2 console exposto** em `/h2-console` sem profile gating.
3. **DDL-auto=create no Render** (commits recentes resetando DB) — recriará schema a cada deploy. Reverter para `validate`/`none` após sync.
4. **Jestor token hardcoded** como default em `application.yml` (commitado).

### 🟡 Médios
5. **Uploads em `/tmp/uploads`** no Render — efêmeros, perdidos no restart. Precisa Disk/S3 para produção.
6. **`GlobalExceptionHandler` 500 path** chama `ex.printStackTrace()` e expõe `ex.getMessage()` (info leak).
7. **Conflito port/DB** entre `application.yml` e `application.properties`.
8. **`UserRoleContext` sempre default `'admin'`** on load — sem persistência.
9. **`HeadhunterFilterContext` hardcoda ID=1** para role headhunter.
10. **`SeniorDashboard` matching jobs é mock hardcoded** (linhas 313-318).
11. **3 chamadas frontend dead/wrong** (`importFromLinkedIn`, `validateLinkedInUrl`, `updateJobApplicationStatus` com path `/job-applications/...` em vez de `/applications/...`).
12. **JobApplication FKs são EAGER** — risco de N+1 em listagens grandes.

### 🟢 Menores / dívidas
13. `HeadhunterService.delete()` e `AssessoradoService.delete()` lançam `IllegalArgumentException` → 500 em vez de 404.
14. `CandidateController` injeta `CandidateStatusLogRepository` direto, bypassando service.
15. `JobStatus.WARRANTY` ausente do `JobStatusTransition.ALLOWED` map — pode ser setado direto, sem validação.
16. **CLAUDE.md está desatualizado** (referencia OAuth2/JWT inexistentes, ModelMapper em vez de MapStruct, `CandidatoController`/`HistoricoDeContatoController` que não existem).
17. **Sem Flyway** — schema só via DDL-auto. Sem versionamento de migrations.
18. **Zero testes backend** (`backend/src/test/` não existe).

---

## Onde encontrar

| Pergunta | Lugar |
|---|---|
| Como rodar local? | seção "Comandos" acima |
| Schema atual? | gerado por Hibernate; ver entidades em `backend/src/main/java/com/empresa/sistema/domain/entity/` |
| Lista completa de endpoints? | `.omc/research/research-20260426-projinit/stages/stage-5.md` |
| Detalhes de cada entidade? | `.omc/research/research-20260426-projinit/stages/stage-4.md` |
| Como o frontend consome a API? | seção `services/api.ts` + Stage 5 §10 |
| Por que algo está quebrado em produção? | seção "Riscos" + commits recentes (`git log -10`) |
| Findings brutos? | `.omc/research/research-20260426-projinit/stages/stage-{1..6}.md` |
| Cross-validation? | `.omc/research/research-20260426-projinit/findings/verified/cross-validation.md` |
