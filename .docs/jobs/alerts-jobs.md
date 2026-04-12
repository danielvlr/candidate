# Sistema de Jobs e Alertas

## Arquitetura de Filas

### Filas com Redis/Spring Boot Scheduler

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Alert Checker │───▶│   Event Queue   │───▶│ Message Sender  │
│  (Scheduler)    │    │    (Redis)      │    │   (Consumer)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   Dead Letter   │    │   External APIs │
│   (Events)      │    │     Queue       │    │ (Email/WhatsApp)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Tipos de Alertas

### 1. Alertas de Datas Importantes

**D-7 do Start Date:**
```sql
-- Query executada a cada 15 minutos
SELECT
  jo.id as job_id,
  jo.title,
  jo.start_date,
  c.name as company_name,
  joc.candidate_id,
  cand.first_name,
  cand.last_name,
  cand.email
FROM job_openings jo
JOIN companies c ON jo.company_id = c.id
JOIN job_opening_candidates joc ON jo.id = joc.job_id
JOIN candidates cand ON joc.candidate_id = cand.id
WHERE
  jo.start_date = CURRENT_DATE + INTERVAL '7 days'
  AND joc.status = 'CONTRATADO'
  AND jo.is_active = true
  -- Evitar spam: só enviar se não foi enviado nas últimas 24h
  AND NOT EXISTS(
    SELECT 1 FROM outbox_events oe
    WHERE oe.entity_type = 'JOB'
    AND oe.entity_id = jo.id
    AND oe.event_type = 'START_DATE_REMINDER'
    AND oe.created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
  );
```

**D-3 da Data de Contratação Esperada:**
```sql
SELECT
  jo.id as job_id,
  jo.title,
  jo.expected_hire_date,
  COUNT(joc.id) as total_candidates,
  COUNT(CASE WHEN joc.status = 'ATIVO' THEN 1 END) as active_candidates
FROM job_openings jo
LEFT JOIN job_opening_candidates joc ON jo.id = joc.job_id
WHERE
  jo.expected_hire_date = CURRENT_DATE + INTERVAL '3 days'
  AND jo.status IN ('ABERTA', 'EM_TRIAGEM')
  AND jo.is_active = true
GROUP BY jo.id, jo.title, jo.expected_hire_date
HAVING COUNT(CASE WHEN joc.status = 'ATIVO' THEN 1 END) = 0; -- Sem candidatos ativos
```

### 2. Alertas de Mudança de Status

**Nova Candidatura:**
```java
// Trigger automático ao inserir em job_opening_candidates
@EventListener
public void onNewApplication(JobApplicationCreatedEvent event) {
    OutboxEvent alertEvent = OutboxEvent.builder()
        .eventType("NEW_APPLICATION")
        .entityType("APPLICATION")
        .entityId(event.getApplicationId())
        .payload(Map.of(
            "jobId", event.getJobId(),
            "candidateId", event.getCandidateId(),
            "companyId", event.getCompanyId()
        ))
        .build();

    outboxEventRepository.save(alertEvent);
}
```

**Mudança de Etapa:**
```java
@EventListener
public void onStageChange(JobStageChangedEvent event) {
    // Criar eventos para diferentes stakeholders
    List<OutboxEvent> events = Arrays.asList(
        // Para o cliente/empresa
        OutboxEvent.builder()
            .eventType("STAGE_CHANGED_COMPANY")
            .entityType("APPLICATION")
            .entityId(event.getApplicationId())
            .payload(event.toMap())
            .build(),

        // Para o candidato (se configurado)
        OutboxEvent.builder()
            .eventType("STAGE_CHANGED_CANDIDATE")
            .entityType("APPLICATION")
            .entityId(event.getApplicationId())
            .payload(event.toMap())
            .build()
    );

    outboxEventRepository.saveAll(events);
}
```

## Templates de Mensagens

### Templates de Email

**Template: Start Date Reminder**
```json
{
  "id": "start_date_reminder",
  "name": "Lembrete - Data de Início Próxima",
  "type": "EMAIL",
  "subject": "🗓️ Lembrete: {{candidate.firstName}} inicia em 7 dias - {{job.title}}",
  "content": "
    <h2>Olá {{company.name}}!</h2>

    <p>Este é um lembrete de que <strong>{{candidate.firstName}} {{candidate.lastName}}</strong>
    está programado(a) para iniciar na vaga de <strong>{{job.title}}</strong>
    em <strong>{{job.startDate}}</strong> (7 dias).</p>

    <h3>Dados do Candidato:</h3>
    <ul>
      <li><strong>Nome:</strong> {{candidate.firstName}} {{candidate.lastName}}</li>
      <li><strong>Email:</strong> {{candidate.email}}</li>
      <li><strong>Telefone:</strong> {{candidate.phone}}</li>
      <li><strong>Vaga:</strong> {{job.title}}</li>
      <li><strong>Data de Início:</strong> {{job.startDate}}</li>
    </ul>

    <p>Não se esqueça de preparar:</p>
    <ul>
      <li>✅ Onboarding e documentação</li>
      <li>✅ Acesso aos sistemas</li>
      <li>✅ Equipamentos necessários</li>
      <li>✅ Apresentação da equipe</li>
    </ul>

    <p>Em caso de dúvidas, entre em contato conosco.</p>

    <p>Atenciosamente,<br>
    Equipe de Recrutamento</p>
  ",
  "variables": [
    "candidate.firstName",
    "candidate.lastName",
    "candidate.email",
    "candidate.phone",
    "job.title",
    "job.startDate",
    "company.name"
  ]
}
```

**Template: New Application**
```json
{
  "id": "new_application",
  "name": "Nova Candidatura Recebida",
  "type": "EMAIL",
  "subject": "🎯 Nova candidatura para {{job.title}} - {{candidate.firstName}}",
  "content": "
    <h2>Nova candidatura recebida!</h2>

    <p>Recebemos uma nova candidatura para a vaga <strong>{{job.title}}</strong>:</p>

    <div style='background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;'>
      <h3>{{candidate.firstName}} {{candidate.lastName}}</h3>
      <p><strong>Posição Atual:</strong> {{candidate.currentPosition}} na {{candidate.currentCompany}}</p>
      <p><strong>Senioridade:</strong> {{candidate.seniorityLevel}}</p>
      <p><strong>Localização:</strong> {{candidate.location}}</p>
      <p><strong>Pretensão Salarial:</strong> R$ {{candidate.salaryExpectation}}</p>
    </div>

    <p><a href='{{frontendUrl}}/jobs/{{job.id}}/candidates/{{candidate.id}}'
          style='background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
       👀 Ver Perfil Completo
    </a></p>

    <p>Skills principais: {{candidate.topSkills}}</p>
  ",
  "variables": [
    "job.title",
    "job.id",
    "candidate.firstName",
    "candidate.lastName",
    "candidate.id",
    "candidate.currentPosition",
    "candidate.currentCompany",
    "candidate.seniorityLevel",
    "candidate.location",
    "candidate.salaryExpectation",
    "candidate.topSkills",
    "frontendUrl"
  ]
}
```

### Templates de WhatsApp

**Template: Stage Change (Candidate)**
```json
{
  "id": "stage_change_candidate",
  "name": "Mudança de Etapa - Candidato",
  "type": "WHATSAPP",
  "content": "
    Olá {{candidate.firstName}}! 👋

    Temos uma atualização sobre sua candidatura para a vaga de *{{job.title}}* na {{company.name}}:

    🔄 *Status atualizado:* {{newStage.name}}

    {{#if notes}}
    📝 *Observações:* {{notes}}
    {{/if}}

    {{#if nextSteps}}
    ⏭️ *Próximos passos:* {{nextSteps}}
    {{/if}}

    Em caso de dúvidas, entre em contato conosco!

    Boa sorte! 🍀
  ",
  "variables": [
    "candidate.firstName",
    "job.title",
    "company.name",
    "newStage.name",
    "notes",
    "nextSteps"
  ]
}
```

## Configuração de Jobs

### Spring Boot Scheduler

```java
@Component
@EnableScheduling
public class AlertScheduler {

    @Autowired
    private AlertService alertService;

    // Executa a cada 15 minutos
    @Scheduled(fixedRate = 900000) // 15 * 60 * 1000
    public void checkDateAlerts() {
        try {
            alertService.checkStartDateReminders();
            alertService.checkHireDateDeadlines();
        } catch (Exception e) {
            log.error("Erro ao verificar alertas de data", e);
        }
    }

    // Executa a cada 5 minutos
    @Scheduled(fixedRate = 300000) // 5 * 60 * 1000
    public void processOutboxEvents() {
        try {
            alertService.processOutboxEvents();
        } catch (Exception e) {
            log.error("Erro ao processar eventos da outbox", e);
        }
    }

    // Limpar eventos antigos - diário às 2h
    @Scheduled(cron = "0 0 2 * * *")
    public void cleanupOldEvents() {
        alertService.cleanupProcessedEvents();
    }
}
```

### Processamento de Eventos

```java
@Service
public class AlertService {

    public void processOutboxEvents() {
        List<OutboxEvent> pendingEvents = outboxEventRepository
            .findByStatusAndScheduledForBefore(
                OutboxEventStatus.PENDING,
                LocalDateTime.now()
            );

        for (OutboxEvent event : pendingEvents) {
            try {
                processEvent(event);
                event.setStatus(OutboxEventStatus.COMPLETED);
                event.setProcessedAt(LocalDateTime.now());
            } catch (Exception e) {
                handleEventFailure(event, e);
            }

            outboxEventRepository.save(event);
        }
    }

    private void processEvent(OutboxEvent event) {
        switch (event.getEventType()) {
            case "START_DATE_REMINDER":
                sendStartDateReminder(event);
                break;
            case "NEW_APPLICATION":
                sendNewApplicationAlert(event);
                break;
            case "STAGE_CHANGED_COMPANY":
                sendStageChangeToCompany(event);
                break;
            case "STAGE_CHANGED_CANDIDATE":
                sendStageChangeToCandidate(event);
                break;
            default:
                log.warn("Tipo de evento desconhecido: {}", event.getEventType());
        }
    }

    private void handleEventFailure(OutboxEvent event, Exception e) {
        event.setRetryCount(event.getRetryCount() + 1);
        event.setErrorMessage(e.getMessage());

        if (event.getRetryCount() >= event.getMaxRetries()) {
            event.setStatus(OutboxEventStatus.FAILED);
            log.error("Evento falhou após {} tentativas: {}",
                event.getMaxRetries(), event.getId(), e);
        } else {
            // Retry exponencial: 2^n minutos
            int delayMinutes = (int) Math.pow(2, event.getRetryCount());
            event.setScheduledFor(LocalDateTime.now().plusMinutes(delayMinutes));
            log.warn("Reagendando evento {} para {} (tentativa {})",
                event.getId(), event.getScheduledFor(), event.getRetryCount());
        }
    }
}
```

## Dead Letter Queue (DLQ)

Para eventos que falharam definitivamente:

```java
@Component
public class DeadLetterQueueProcessor {

    @Scheduled(fixedRate = 3600000) // A cada hora
    public void processDLQ() {
        List<OutboxEvent> failedEvents = outboxEventRepository
            .findByStatus(OutboxEventStatus.FAILED);

        for (OutboxEvent event : failedEvents) {
            // Logar para análise manual
            log.error("Evento na DLQ: {} - {}", event.getId(), event.getErrorMessage());

            // Opcionalmente, enviar para sistema de monitoramento
            monitoringService.reportFailedEvent(event);

            // Marcar como processado na DLQ
            event.setStatus(OutboxEventStatus.DLQ_PROCESSED);
            outboxEventRepository.save(event);
        }
    }
}
```

## Configurações de Retry

```yaml
# application.yml
alerts:
  retry:
    max-attempts: 3
    delay-multiplier: 2
    initial-delay: 60 # segundos

  email:
    provider: postmark # ou 'ses'
    from: noreply@empresa.com

  whatsapp:
    provider: meta # ou 'twilio'
    business-phone: '+5585999999999'
```