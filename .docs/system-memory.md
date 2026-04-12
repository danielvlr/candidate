# System Memory - Camarmo Project

## Project Overview
Sistema completo de gestão de candidatos com backend Spring Boot e frontend React.

### Architecture
- **Backend**: Spring Boot 3.3.1 + Java 21 (pasta `backend/`)
- **Frontend**: React 18 + Vite + Tailwind CSS (pasta `frontend/`)
- **Database**: PostgreSQL com JPA/Hibernate
- **Authentication**: JWT com OAuth2 Resource Server

## Development Progress

### Phase 1: Project Refactoring ✅
- **MapStruct + Lombok Integration**: Adicionados ao pom.xml para reduzir boilerplate
- **Request/Response Pattern**: Migração completa das DTOs para padrão request/response
- **DTOs Refatoradas**:
  - `com.empresa.sistema.api.dto.request.*` - DTOs de entrada
  - `com.empresa.sistema.api.dto.response.*` - DTOs de saída
  - Mappers criados: `CandidateMapper`, `ExperienceMapper`, `EducationMapper`

### Phase 2: LinkedIn Service Cleanup ✅
- **Fallback Removal**: Removida toda funcionalidade de dados simulados
- **Error Handling**: Implementado com `BusinessException` para falhas reais
- **PDF Processing**: Mantido apenas processamento real com Apache PDFBox + ChatGPT

### Phase 3: Client Entity System ✅
- **Client Entity**: Sistema completo de empresas contratantes
- **Job Association**: Vagas agora associadas a clientes para informações completas da empresa
- **CRUD Completo**: Controller, Service, Repository, DTOs para clients
- **Business Logic**: Validações de CNPJ, soft delete, status management

### Phase 4: Photo Upload Feature ✅
- **Backend**:
  - `FileUploadService` - validação e armazenamento de imagens
  - `FileUploadController` - endpoints `/api/v1/upload/*`
  - `POST /api/v1/candidates/{id}/photo` - upload de foto do candidato
- **Frontend**:
  - Interface de upload no formulário de candidatos
  - Validação client-side (5MB, formatos permitidos)
  - Preview de foto atual ou placeholder

### Phase 5: Dashboard Job Detail View ✅
- **Backend Entities**:
  - `Shortlist` - candidatos enviados para empresas
  - `JobHistory` - histórico de interações e anotações
  - Repositories e Services completos
- **API Endpoints**:
  - `GET /api/v1/jobs/{id}/detail` - visão detalhada da vaga
  - `GET /api/v1/shortlists/job/{jobId}` - shortlists da vaga
  - `POST /api/v1/shortlists` - criar shortlist
  - `GET /api/v1/job-history/job/{jobId}` - histórico da vaga
  - `POST /api/v1/job-history` - adicionar histórico
- **Features**:
  - Controle de status de shortlists (SENT, VIEWED, APPROVED, REJECTED)
  - Histórico tipado (INTERVIEW, FEEDBACK, STATUS_CHANGE, etc.)
  - Estatísticas automáticas (contadores, percentuais)
  - Validações de negócio (candidato duplicado em shortlist)

## Key Technical Decisions

### Backend Patterns
- **Constructor Injection**: `@RequiredArgsConstructor` do Lombok
- **Soft Delete**: Status INACTIVE ao invés de exclusão física
- **MapStruct**: Mapeamento compile-time entre entidades e DTOs
- **Exception Handling**: `BusinessException` para regras de negócio

### Frontend Patterns
- **Feature-based Structure**: Módulos organizados por funcionalidade
- **Form Validation**: Client + server-side validation
- **Error Handling**: Estados específicos para loading/error
- **File Upload**: FormData com validação prévia

## Current System State

### Entities
- `Candidate` - candidatos com experiências, educação, foto
- `Client` - empresas contratantes com dados completos
- `Job` - vagas associadas a clients
- `UserInfo/UserRole` - sistema de autenticação

### APIs Available
- `/api/v1/candidates/*` - CRUD de candidatos + busca/filtros
- `/api/v1/clients/*` - CRUD de clientes + filtros
- `/api/v1/upload/*` - upload de arquivos
- `/api/v1/auth/*` - autenticação JWT

### Development Commands
```bash
# Backend
cd backend && ./mvnw spring-boot:run

# Frontend
cd frontend && npm run dev

# Build
./mvnw clean package -DskipTests
npm run build
```

## Next Development Areas

### Potential Improvements
- Job posting system integration
- Advanced search/filtering
- Report generation
- Email notifications
- Advanced file management
- Role-based permissions

### Technical Debt
- Add comprehensive unit tests
- Implement API documentation (OpenAPI/Swagger)
- Add monitoring/logging
- Implement caching strategies
- Database migrations management

## Important Notes
- Photo upload requires existing candidate (edit mode only)
- File validation: max 5MB, image formats only
- All passwords/secrets in environment variables
- CORS configured for development (localhost:5174)
- Database connection configured in application.properties

---
*Last Updated: 2025-09-28*
*Status: Production Ready for Core Features*