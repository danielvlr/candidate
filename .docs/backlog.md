# 📋 Backlog - Próximos Passos

## 🎯 Funcionalidades Prioritárias (Sprint 1-2)

### 1. Recomendação de Matching Candidato-Vaga
**Objetivo**: Sugerir candidatos automaticamente para vagas baseado em score de compatibilidade

**Implementação**:
- Algoritmo de score baseado em skills, senioridade, localização e pretensão salarial
- API endpoint `/api/v1/jobs/{id}/recommended-candidates`
- Interface no detalhe da vaga mostrando candidatos recomendados
- Explicação do score (por que foi recomendado)

**Critérios de Aceite**:
- Score de 0-100% de compatibilidade
- Explicação textual do match (ex: "95% - Skills exatas, localização próxima")
- Filtros para refinar recomendações
- Possibilidade de feedback do recrutador (melhorar algoritmo)

```sql
-- Score simples para POC
SELECT
  c.id,
  c.first_name,
  c.last_name,
  (
    -- Score de skills (40%)
    (SELECT COUNT(*) FROM candidate_skills cs
     JOIN job_skills js ON cs.skill_id = js.skill_id
     WHERE cs.candidate_id = c.id AND js.job_id = :jobId) * 40.0 /
    (SELECT COUNT(*) FROM job_skills WHERE job_id = :jobId AND is_required = true)

    -- Score de localização (30%)
    + CASE WHEN c.address_city = j.work_city THEN 30.0 ELSE 0.0 END

    -- Score de senioridade (20%)
    + CASE WHEN c.seniority_level = :preferredSeniority THEN 20.0 ELSE 10.0 END

    -- Score de pretensão salarial (10%)
    + CASE WHEN c.salary_expectation_min <= j.salary_max THEN 10.0 ELSE 0.0 END
  ) as compatibility_score
FROM candidates c, job_openings j
WHERE j.id = :jobId AND c.is_active = true
ORDER BY compatibility_score DESC;
```

### 2. Calendário de Entrevistas
**Objetivo**: Agendar e gerenciar entrevistas diretamente no sistema

**Implementação**:
- Integração com Google Calendar/Outlook
- Agendamento com disponibilidade de entrevistadores
- Envio automático de convites por email/WhatsApp
- Lembretes automáticos D-1 e H-2
- Interface tipo calendário no frontend

**Tabelas necessárias**:
```sql
CREATE TABLE interview_slots (
    id UUID PRIMARY KEY,
    interviewer_id UUID REFERENCES users(id),
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    is_available BOOLEAN DEFAULT true
);

CREATE TABLE interviews (
    id UUID PRIMARY KEY,
    job_candidate_id UUID REFERENCES job_opening_candidates(id),
    interviewer_id UUID REFERENCES users(id),
    interview_type VARCHAR(50), -- 'PHONE', 'VIDEO', 'PRESENTIAL'
    scheduled_datetime TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    location VARCHAR(255),
    meeting_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5)
);
```

### 3. ~~Portal do Candidato~~ (REMOVIDO)
**Status**: **CANCELADO** - Funcionalidade removida do escopo

**Justificativa**: O sistema agora é exclusivamente operado por headhunters. Todos os candidatos devem ser cadastrados e gerenciados pelos profissionais de recrutamento, garantindo maior controle de qualidade e padronização dos dados.

**Alteração de Escopo**:
- ❌ Candidatos NÃO podem se auto-cadastrar
- ✅ Apenas headhunters cadastram candidatos
- ✅ Headhunters gerenciam todo o processo
- ✅ Maior controle de qualidade dos dados
- ✅ Processo mais padronizado

### 4. Relatórios e Analytics
**Objetivo**: Dashboard com métricas de recrutamento e performance

**Métricas**:
- Tempo médio por etapa do funil
- Taxa de conversão por fonte de candidatos
- Performance por headhunter
- Análise de salários por região/skill
- Relatório de diversidade e inclusão

**Gráficos**:
- Funil de candidatos por vaga
- Timeline de contratações
- Heatmap de skills mais demandadas
- Análise de tendências salariais

**Implementação**:
```java
@Service
public class JobBoardService {

    @Autowired
    private LinkedInJobsClient linkedInClient;

    @Autowired
    private IndeedClient indeedClient;

    public void publishJob(JobOpening job, List<String> platforms) {
        for (String platform : platforms) {
            switch (platform) {
                case "LINKEDIN" -> linkedInClient.publishJob(job);
                case "INDEED" -> indeedClient.publishJob(job);
                // etc
            }
        }
    }
}
```

### 6. IA para Triagem de Currículos
**Objetivo**: Análise automática de currículos com IA

**Funcionalidades**:
- Extração estruturada de dados de PDFs
- Classificação automática de skills
- Detecção de anos de experiência
- Score de adequação à vaga
- Identificação de red flags

**Tecnologias**:
- OpenAI GPT API para análise de texto
- AWS Textract para OCR
- Modelo próprio para classificação

### 7. ~~App Mobile~~ (REMOVIDO)
**Status**: **CANCELADO** - Funcionalidade removida do escopo

**Justificativa**: O sistema é 100% web-based, otimizado para mobile através de design responsivo. A experiência mobile será garantida através de PWA (Progressive Web App) se necessário no futuro.

### 8. Performance e Escalabilidade
**Melhorias**:
- Implementar cache Redis para buscas frequentes
- Paginação otimizada com cursor
- Índices compostos otimizados
- CDN para arquivos estáticos
- Database read replicas

**Cache Strategy**:
```java
@Cacheable(value = "candidates", key = "#filters.hashCode()")
public PageResponse<CandidateListResponse> searchCandidates(
    CandidateFilters filters, Pageable pageable) {
    // implementação
}

@CacheEvict(value = "candidates", allEntries = true)
public CandidateResponse updateCandidate(UUID id, CandidateUpdateRequest request) {
    // implementação
}
```

### 9. Monitoring e Observabilidade
**Implementar**:
- Distributed tracing com Jaeger
- Métricas customizadas com Micrometer
- Alertas proativos com PagerDuty
- Health checks avançados
- Log aggregation com ELK Stack

### 10. Segurança Avançada
**Implementar**:
- Rate limiting por usuário/IP
- WAF (Web Application Firewall)
- Scan de vulnerabilidades automatizado
- Penetration testing
- Backup encrypted automático

### 11. Gestão Financeira
**Objetivo**: Controlar custos e ROI do recrutamento

**Funcionalidades**:
- Custo por contratação
- ROI por fonte de candidatos
- Faturamento por cliente
- Comissões de headhunters
- Relatórios financeiros

### 12. CRM Avançado
**Objetivo**: Relacionamento aprofundado com candidatos

**Funcionalidades**:
- Segmentação de candidatos
- Campanhas de email marketing
- Nurturing automático
- Lead scoring
- Pipeline de relacionamento
agora

## 🔮 Funcionalidades Futuras (Backlog Longo Prazo)

### 14. Análise Preditiva
- Prever sucesso de contratação
- Identificar candidatos com maior probabilidade de aceitar oferta
- Prever tempo de permanência na empresa
- Análise de sentimento em entrevistas

### 15. Automação Avançada
- Chatbot para triagem inicial
- Entrevistas automatizadas por vídeo
- Geração automática de ofertas
- Assinatura digital de contratos

### 16. Integração Avançada
- ATS (Applicant Tracking System) externos
- Sistemas de RH (HRIS)
- Plataformas de assessment
- Background check automático

### 17. Marketplace de Talentos
- Candidatos podem se promover
- Empresas fazem ofertas diretamente
- Sistema de reviews e ratings
- Freelancers e consultores