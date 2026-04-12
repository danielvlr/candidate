# 🎯 Sistema de Banco de Talentos

Sistema administrativo para headhunters gerenciarem candidatos, vagas e processos de recrutamento. Sistema exclusivo para uso por profissionais de RH/recrutamento.

## 🚀 Como Rodar Localmente

### Pré-requisitos

- **Docker** e **Docker Compose** instalados
- **Git** para clonar o repositório
- **Java 21** (para desenvolvimento backend)
- **Node.js 18+** (para desenvolvimento frontend)

### 1. Clonar o Repositório

```bash
git clone https://github.com/sua-empresa/sistema-banco-talentos.git
cd sistema-banco-talentos
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar configurações básicas
nano .env
```

**Configurações mínimas obrigatórias:**

```env
# Database
DB_PASSWORD=sua_senha_postgres_segura

# Redis
REDIS_PASSWORD=sua_senha_redis_segura

# MinIO
MINIO_ROOT_PASSWORD=sua_senha_minio_segura

# JWT (IMPORTANTE: gerar chave segura)
JWT_SECRET=sua-chave-jwt-super-secreta-aqui-mude-em-producao

# Email (escolher um provedor)
MAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-de-app
```

### 3. Iniciar Todos os Serviços

```bash
# Subir infraestrutura + aplicação
docker-compose up -d

# Acompanhar logs
docker-compose logs -f
```

### 4. Aguardar Inicialização

```bash
# Verificar se todos os serviços estão rodando
docker-compose ps

# Aguardar health checks (cerca de 2-3 minutos)
```

### 5. Acessar a Aplicação

- **Frontend**: http://localhost:5173
- **API**: http://localhost:8080/api/v1
- **Swagger**: http://localhost:8080/swagger-ui.html
- **MinIO Console**: http://localhost:9001

### 6. Dados de Teste

**Usuário padrão:**
- Email: `admin@empresa.com`
- Senha: `admin123`

**Candidatos de exemplo:** 5 candidatos pré-cadastrados (gerenciados por headhunters)
**Vagas de exemplo:** 2 vagas pré-cadastradas

**Nota:** Apenas headhunters podem cadastrar e gerenciar candidatos. Não há portal público para candidatos.

## ⚡ Desenvolvimento Local

### Backend (Spring Boot)

```bash
# Entrar no diretório do backend
cd backend

# Subir apenas infraestrutura
docker-compose up -d postgres redis minio

# Configurar application-dev.yml
# Rodar aplicação
./mvnw spring-boot:run -Dspring.profiles.active=dev

# Executar testes
./mvnw test

# Executar com live reload
./mvnw spring-boot:run -Dspring.profiles.active=dev -Dspring-boot.run.jvmArguments="-XX:+UseZGC"
```

### Frontend (React)

```bash
cd frontend

# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev

# Executar testes
npm test

# Build para produção
npm run build

# Lint e formatação
npm run lint
npm run lint:fix
```

## 🛠 Scripts Úteis

### Banco de Dados

```bash
# Executar migrations
./mvnw flyway:migrate

# Seed com dados de teste
./mvnw spring-boot:run -Dspring.profiles.active=seed

# Reset completo do banco
docker-compose down -v
docker-compose up -d postgres
./mvnw flyway:clean flyway:migrate
```

### Docker

```bash
# Rebuild apenas backend
docker-compose build backend
docker-compose up -d backend

# Rebuild apenas frontend
docker-compose build frontend
docker-compose up -d frontend

# Ver logs de um serviço específico
docker-compose logs -f backend

# Entrar no container do backend
docker-compose exec backend bash

# Backup do banco
docker-compose exec postgres pg_dump -U postgres talent_bank > backup.sql
```

### Desenvolvimento

```bash
# Gerar JWT secret seguro
openssl rand -base64 32

# Executar apenas testes unitários
./mvnw test -Dtest="*Test"

# Executar apenas testes de integração
./mvnw test -Dtest="*IntegrationTest"

# Análise de cobertura
./mvnw clean verify jacoco:report
open target/site/jacoco/index.html
```

## 🔧 Configuração de Produção

### 1. Variáveis de Ambiente Críticas

```env
# IMPORTANTE: Alterar em produção
SPRING_PROFILES_ACTIVE=production
JWT_SECRET=sua-chave-super-secreta-de-256-bits-aqui
DB_PASSWORD=senha-forte-postgres
REDIS_PASSWORD=senha-forte-redis

# URLs de produção
FRONTEND_URL=https://app.empresa.com
VITE_API_BASE_URL=https://api.empresa.com/v1

# SSL/TLS
USE_SSL=true
SSL_KEY_STORE_PATH=/certs/keystore.p12
SSL_KEY_STORE_PASSWORD=senha-keystore

# Provedores externos
MAIL_PROVIDER=postmark
POSTMARK_API_TOKEN=seu-token-postmark

WHATSAPP_PROVIDER=meta
META_WHATSAPP_ACCESS_TOKEN=seu-token-whatsapp
```

### 2. Otimizações de Performance

```yaml
# docker-compose.production.yml
services:
  backend:
    environment:
      JAVA_OPTS: >-
        -Xmx2g
        -Xms1g
        -XX:+UseG1GC
        -XX:+UseStringDeduplication
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 2.5G
          cpus: '1.5'
```

### 3. Monitoring e Observabilidade

```env
# Sentry para erros
SENTRY_DSN=sua-sentry-dsn

# New Relic para APM
NEWRELIC_LICENSE_KEY=sua-license-key

# Prometheus metrics
MANAGEMENT_METRICS_EXPORT_PROMETHEUS_ENABLED=true
```

## 🧪 Testes

### Executar Todos os Testes

```bash
# Backend
./mvnw clean verify

# Frontend
cd frontend && npm test -- --coverage

# E2E (quando implementado)
npm run test:e2e
```

### Testes Específicos

```bash
# Apenas testes unitários backend
./mvnw test

# Apenas testes de integração
./mvnw test -Dgroups=integration

# Testes de performance
./mvnw test -Dgroups=performance

# Testes do frontend em watch mode
cd frontend && npm test -- --watch
```

## 📊 Monitoramento

### Health Checks

- **Backend**: http://localhost:8080/actuator/health
- **Frontend**: http://localhost:5173/health
- **Postgres**: `docker-compose exec postgres pg_isready`
- **Redis**: `docker-compose exec redis redis-cli ping`

### Métricas

- **Prometheus**: http://localhost:8080/actuator/prometheus
- **Métricas JVM**: http://localhost:8080/actuator/metrics
- **Logs estruturados**: `docker-compose logs backend | jq`

## 🔒 Segurança

### Autenticação

```bash
# Gerar token JWT para testes
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"admin123"}'

# Usar token nas requisições
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:8080/api/v1/candidates
```

### LGPD

- **Consentimento**: Todos os candidatos devem ter consentimento registrado
- **Retenção**: Dados são automaticamente anonimizados após prazo
- **Auditoria**: Todos os acessos são logados
- **Direitos**: APIs para exercer direitos do titular

## 🐛 Troubleshooting

### Problemas Comuns

**1. Erro de conexão com banco:**
```bash
# Verificar se postgres está rodando
docker-compose ps postgres

# Ver logs do postgres
docker-compose logs postgres

# Recrear volume se necessário
docker-compose down -v
docker-compose up -d postgres
```

**2. Frontend não carrega:**
```bash
# Verificar se build foi bem-sucedido
docker-compose logs frontend

# Rebuild do frontend
docker-compose build frontend --no-cache
docker-compose up -d frontend
```

**3. Emails não estão sendo enviados:**
```bash
# Verificar configuração SMTP
docker-compose exec backend env | grep SMTP

# Ver logs de email
docker-compose logs backend | grep -i mail
```

**4. Performance lenta:**
```bash
# Verificar uso de recursos
docker stats

# Otimizar índices do banco
docker-compose exec postgres psql -U postgres -d talent_bank -c "REINDEX DATABASE talent_bank;"
```

### Logs Importantes

```bash
# Logs da aplicação
docker-compose logs -f backend

# Logs de erro específicos
docker-compose logs backend | grep ERROR

# Logs de auditoria LGPD
docker-compose logs backend | grep -i audit

# Logs de jobs/alertas
docker-compose logs backend | grep -i scheduler
```

## 📞 Suporte

- **Documentação**: [Wiki do projeto](https://wiki.empresa.com/talent-bank)
- **Issues**: [GitHub Issues](https://github.com/empresa/talent-bank/issues)
- **Chat**: #dev-talent-bank no Slack
- **Email**: dev-team@empresa.com

## 🎯 Próximos Passos

Após rodar o sistema, consulte o backlog em `docs/backlog.md` para implementar funcionalidades avançadas como:

- Matching automático candidato-vaga
- Integração com calendário
- Relatórios avançados
- IA para triagem de currículos
- CRM avançado

---

**⚠️ Lembrete de Segurança:** Sempre altere as senhas padrão em ambiente de produção!