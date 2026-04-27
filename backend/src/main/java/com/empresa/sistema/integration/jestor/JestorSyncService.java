package com.empresa.sistema.integration.jestor;

import com.empresa.sistema.config.JestorConfig;
import com.empresa.sistema.domain.entity.*;
import com.empresa.sistema.domain.repository.*;
import com.empresa.sistema.domain.repository.CandidateStatusLogRepository;
import com.empresa.sistema.domain.repository.JobHistoryRepository;
import com.empresa.sistema.domain.repository.WarrantyRuleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
public class JestorSyncService {

    private static final Logger log = LoggerFactory.getLogger(JestorSyncService.class);

    private final JestorClient jestorClient;
    private final JestorConfig config;
    private final JobRepository jobRepository;
    private final ClientRepository clientRepository;
    private final CandidateRepository candidateRepository;
    private final HeadhunterRepository headhunterRepository;
    private final WarrantyRuleRepository warrantyRuleRepository;
    private final CandidateStatusLogRepository candidateStatusLogRepository;
    private final JobHistoryRepository jobHistoryRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final SyncLogRepository syncLogRepository;
    private final ObjectMapper objectMapper;

    public JestorSyncService(JestorClient jestorClient, JestorConfig config,
                             JobRepository jobRepository, ClientRepository clientRepository,
                             CandidateRepository candidateRepository, HeadhunterRepository headhunterRepository,
                             WarrantyRuleRepository warrantyRuleRepository,
                             CandidateStatusLogRepository candidateStatusLogRepository,
                             JobHistoryRepository jobHistoryRepository,
                             JobApplicationRepository jobApplicationRepository,
                             SyncLogRepository syncLogRepository, ObjectMapper objectMapper) {
        this.jestorClient = jestorClient;
        this.config = config;
        this.jobRepository = jobRepository;
        this.clientRepository = clientRepository;
        this.candidateRepository = candidateRepository;
        this.headhunterRepository = headhunterRepository;
        this.warrantyRuleRepository = warrantyRuleRepository;
        this.candidateStatusLogRepository = candidateStatusLogRepository;
        this.jobHistoryRepository = jobHistoryRepository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.syncLogRepository = syncLogRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Full sync with parallelism where possible.
     * Phase 1: clients + headhunters (parallel, no dependencies)
     * Phase 2: jobs (depends on clients + headhunters)
     * Phase 3: candidates + warranty_rules (parallel)
     * Phase 4: candidate_status_logs (depends on candidates)
     */
    public List<SyncResult> fullSync() {
        long startTime = System.currentTimeMillis();
        List<SyncResult> results = new ArrayList<>();

        // Phase 1: parallel - clients + headhunters
        log.info("Sync Phase 1: clients + headhunters (parallel)");
        CompletableFuture<SyncResult> clientsFuture = CompletableFuture.supplyAsync(this::syncClients);
        CompletableFuture<SyncResult> hhFuture = CompletableFuture.supplyAsync(this::syncHeadhunters);
        results.add(clientsFuture.join());
        results.add(hhFuture.join());

        // Phase 2: jobs (needs clients + headhunters)
        log.info("Sync Phase 2: jobs");
        results.add(syncJobs());

        // Phase 3: parallel - candidates + warranty_rules
        log.info("Sync Phase 3: candidates + warranty_rules (parallel)");
        CompletableFuture<SyncResult> candidatesFuture = CompletableFuture.supplyAsync(this::syncCandidates);
        CompletableFuture<SyncResult> warrantyFuture = CompletableFuture.supplyAsync(this::syncWarrantyRules);
        results.add(candidatesFuture.join());
        results.add(warrantyFuture.join());

        // Phase 4: candidate_status_logs (needs candidates)
        log.info("Sync Phase 4: candidate_status_logs");
        results.add(syncCandidateStatusLogs());

        long elapsed = (System.currentTimeMillis() - startTime) / 1000;
        log.info("Full sync completed in {}s", elapsed);
        return results;
    }

    @Transactional
    public SyncResult syncClients() {
        return syncTable("clients", config.getClientsTable(), (records, result) -> {
            Map<String, Client> cache = clientRepository.findAll().stream()
                .filter(c -> c.getJestorId() != null)
                .collect(Collectors.toMap(Client::getJestorId, c -> c, (a, b) -> a));
            List<Client> batch = new ArrayList<>();

            for (Map<String, Object> record : records) {
                try {
                    String jestorId = String.valueOf(record.get("id_" + config.getClientsTable()));
                    Client client = cache.getOrDefault(jestorId, new Client());
                    boolean isNew = client.getJestorId() == null;
                    client.setJestorId(jestorId);
                    String companyName = getStr(record, "name");
                    if (companyName != null && !companyName.isBlank()) {
                        client.setCompanyName(companyName);
                    } else if (isNew) {
                        client.setCompanyName("Cliente Jestor #" + jestorId);
                    }
                    client.setIndustry(getStr(record, "segmento"));
                    client.setContactPersonName(getStr(record, "nome_do_responsavel"));
                    client.setContactEmail(getStr(record, "email"));
                    client.setContactPhone(getStr(record, "telefone"));
                    batch.add(client);
                    if (isNew) result.incrementCreated(); else result.incrementUpdated();
                } catch (Exception e) {
                    result.addError("Client: " + e.getMessage());
                }
            }
            if (!batch.isEmpty()) clientRepository.saveAll(batch);
        });
    }

    @Transactional
    public SyncResult syncHeadhunters() {
        return syncTable("headhunters", config.getHeadhuntersTable(), (records, result) -> {
            Map<String, Headhunter> cache = headhunterRepository.findAll().stream()
                .filter(h -> h.getJestorId() != null)
                .collect(Collectors.toMap(Headhunter::getJestorId, h -> h, (a, b) -> a));
            List<Headhunter> batch = new ArrayList<>();

            for (Map<String, Object> record : records) {
                try {
                    String jestorId = String.valueOf(record.get("id_" + config.getHeadhuntersTable()));
                    Headhunter hh = cache.getOrDefault(jestorId, new Headhunter());
                    boolean isNew = hh.getJestorId() == null;
                    hh.setJestorId(jestorId);
                    String name = getStr(record, "nome");
                    if (name == null || name.isBlank()) name = getStr(record, "jestor_object_label");
                    if (name != null && !name.isBlank()) hh.setFullName(name);
                    else if (isNew) hh.setFullName("Membro Equipe #" + jestorId);
                    String funcao = getStr(record, "funcao");
                    if (funcao != null && !funcao.isBlank()) hh.setResponsibleAreas(funcao);
                    String email = getStr(record, "email");
                    if (email != null && !email.isBlank()) hh.setEmail(email);
                    else if (isNew) hh.setEmail(jestorId + "@jestor-sync.local");
                    String telefone = getStr(record, "telefone");
                    if (telefone != null) hh.setPhone(cleanPhone(telefone));
                    if (isNew) {
                        if (hh.getSeniority() == null) hh.setSeniority(Headhunter.Seniority.PLENO);
                        if (hh.getFixedCost() == null) hh.setFixedCost(BigDecimal.ZERO);
                        if (hh.getVariableCost() == null) hh.setVariableCost(BigDecimal.ZERO);
                    }
                    batch.add(hh);
                    if (isNew) result.incrementCreated(); else result.incrementUpdated();
                } catch (Exception e) {
                    result.addError("Headhunter: " + e.getMessage());
                }
            }
            if (!batch.isEmpty()) headhunterRepository.saveAll(batch);
        });
    }

    @Transactional
    public SyncResult syncJobs() {
        return syncTable("jobs", config.getJobsTable(), (records, result) -> {
            // Pre-load caches to avoid N+1
            Map<String, Job> jobCache = jobRepository.findAll().stream()
                .filter(j -> j.getJestorId() != null)
                .collect(Collectors.toMap(Job::getJestorId, j -> j, (a, b) -> a));
            Map<String, Client> clientCache = clientRepository.findAll().stream()
                .filter(c -> c.getJestorId() != null)
                .collect(Collectors.toMap(Client::getJestorId, c -> c, (a, b) -> a));
            Map<String, Headhunter> hhCache = headhunterRepository.findAll().stream()
                .filter(h -> h.getJestorId() != null)
                .collect(Collectors.toMap(Headhunter::getJestorId, h -> h, (a, b) -> a));
            Client defaultClient = clientRepository.findAll().stream().findFirst().orElse(null);

            List<Job> jobBatch = new ArrayList<>();
            List<JobHistory> historyBatch = new ArrayList<>();
            Map<String, LocalDateTime> jestorDates = new HashMap<>();

            for (Map<String, Object> record : records) {
                try {
                    String jestorId = String.valueOf(record.get("id_" + config.getJobsTable()));
                    Job job = jobCache.getOrDefault(jestorId, new Job());
                    boolean isNew = job.getJestorId() == null;
                    // Captura status anterior ANTES de qualquer mutação para decidir
                    // se updatedAt deve bumpar (só bumpa quando status muda).
                    Job.JobStatus oldStatus = isNew ? null : job.getStatus();
                    job.setJestorId(jestorId);

                    // Store Jestor creation date for history
                    String criadoEm = getStr(record, "criado_em");
                    if (criadoEm != null && isNew) {
                        try { jestorDates.put(jestorId, LocalDateTime.parse(criadoEm, DateTimeFormatter.ISO_OFFSET_DATE_TIME)); } catch (Exception ignored) {}
                    }

                    String title = getStr(record, "nome_vaga");
                    if (title == null || title.isBlank()) title = getStr(record, "vaga");
                    if (title != null && !title.isBlank()) job.setTitle(title.length() > 100 ? title.substring(0, 100) : title);
                    else if (isNew) job.setTitle("Vaga Jestor #" + jestorId);
                    if (isNew && job.getDescription() == null) job.setDescription(job.getTitle());

                    String perfil = getStr(record, "perfil");
                    if (perfil != null) job.setServiceCategory(mapServiceCategory(perfil));
                    String status = getStr(record, "status");
                    if (status != null) job.setStatus(mapJobStatus(status));

                    // Resolve client FK via cache
                    resolveClientFKCached(job, record.get("cliente"), clientCache);
                    resolveHeadhunterFKCached(job, record.get("headhunter_1"), hhCache);

                    Object remuneracao = record.get("remuneracao");
                    if (remuneracao != null) {
                        try { job.setJobValue(new BigDecimal(String.valueOf(remuneracao))); } catch (NumberFormatException ignored) {}
                    }
                    Object salarioFechamento = record.get("salario_fechamento");
                    if (salarioFechamento != null) {
                        try { job.setFinalValue(new BigDecimal(String.valueOf(salarioFechamento))); } catch (NumberFormatException ignored) {}
                    }
                    String dataContato = getStr(record, "data_contato");
                    if (dataContato != null) { try { job.setStartDate(LocalDate.parse(dataContato)); } catch (Exception ignored) {} }
                    String dataFechamento = getStr(record, "data_fechamento");
                    if (dataFechamento != null) { try { job.setClosedAt(LocalDate.parse(dataFechamento).atStartOfDay()); } catch (Exception ignored) {} }

                    if (job.getClient() == null && defaultClient != null) {
                        job.setClient(defaultClient);
                        if (job.getCompanyName() == null) job.setCompanyName(defaultClient.getCompanyName());
                    }

                    // Para jobs já existentes: se o status NÃO mudou nesta sync,
                    // sinaliza @PreUpdate para preservar updatedAt (estabiliza
                    // daysPaused — sync de outros campos não conta como "alteração").
                    if (!isNew && Objects.equals(oldStatus, job.getStatus())) {
                        job.setSkipUpdatedAtBump(true);
                    }

                    jobBatch.add(job);
                    if (isNew) {
                        result.incrementCreated();
                    } else {
                        result.incrementUpdated();
                    }
                } catch (Exception e) {
                    result.addError("Job: " + e.getMessage());
                    log.warn("Error syncing job: {}", e.getMessage());
                }
            }

            // Batch save jobs
            if (!jobBatch.isEmpty()) {
                List<Job> saved = jobRepository.saveAll(jobBatch);
                // Create history for new jobs
                for (Job j : saved) {
                    if (jobCache.get(j.getJestorId()) == null) {
                        LocalDateTime historyDate = jestorDates.getOrDefault(j.getJestorId(), LocalDateTime.now());
                        historyBatch.add(JobHistory.builder()
                            .job(j).type(JobHistory.HistoryType.STATUS_CHANGED)
                            .title("Vaga importada do Jestor")
                            .description("Vaga '" + j.getTitle() + "' importada com status " + j.getStatus())
                            .headhunter(j.getHeadhunter())
                            .createdAt(historyDate)
                            .build());
                    }
                }
            }
            if (!historyBatch.isEmpty()) jobHistoryRepository.saveAll(historyBatch);
        });
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public SyncResult syncCandidates() {
        return syncTable("candidates", config.getCandidatesTable(), (records, result) -> {
            Map<String, Candidate> cache = candidateRepository.findAll().stream()
                .filter(c -> c.getJestorId() != null)
                .collect(Collectors.toMap(Candidate::getJestorId, c -> c, (a, b) -> a));
            Map<String, Job> jobCache = jobRepository.findAll().stream()
                .filter(j -> j.getJestorId() != null)
                .collect(Collectors.toMap(Job::getJestorId, j -> j, (a, b) -> a));
            List<Candidate> batch = new ArrayList<>();
            // Track candidate-job links for JobApplication creation
            List<Object[]> candidateJobLinks = new ArrayList<>();

            for (Map<String, Object> record : records) {
                try {
                    String jestorId = String.valueOf(record.get("id_" + config.getCandidatesTable()));
                    Candidate candidate = cache.getOrDefault(jestorId, new Candidate());
                    boolean isNew = candidate.getJestorId() == null;
                    candidate.setJestorId(jestorId);
                    String name = getStr(record, "name");
                    if (name != null && !name.isBlank()) candidate.setFullName(name);
                    else if (isNew) candidate.setFullName("Candidato Jestor #" + jestorId);
                    String telefone = getStr(record, "telefone");
                    if (telefone != null) candidate.setPhone(telefone);
                    String linkedin = getStr(record, "linkedin");
                    if (linkedin != null) candidate.setLinkedinUrl(linkedin);
                    String funcaoAtual = getStr(record, "funcao_atual");
                    if (funcaoAtual != null) candidate.setHeadline(funcaoAtual);
                    String uf = getStr(record, "uf");
                    if (uf != null) candidate.setState(uf);
                    Object pretensao = record.get("pretensao_salarial");
                    if (pretensao != null) { try { candidate.setDesiredSalary(Double.parseDouble(String.valueOf(pretensao))); } catch (NumberFormatException ignored) {} }
                    if (isNew && candidate.getEmail() == null) candidate.setEmail(jestorId + "@jestor-sync.local");

                    // Extract job link from vagas_1
                    Object vagaObj = record.get("vagas_1");
                    String vagaJestorId = null;
                    if (vagaObj instanceof Map) {
                        Object vid = ((Map<String, Object>) vagaObj).get("id_" + config.getJobsTable());
                        if (vid != null) vagaJestorId = String.valueOf(vid);
                    } else if (vagaObj != null && !String.valueOf(vagaObj).equals("null")) {
                        vagaJestorId = String.valueOf(vagaObj);
                    }

                    String candidateStatus = getStr(record, "status");
                    if (vagaJestorId != null) {
                        candidateJobLinks.add(new Object[]{jestorId, vagaJestorId, candidateStatus});
                    }

                    batch.add(candidate);
                    if (isNew) result.incrementCreated(); else result.incrementUpdated();
                } catch (Exception e) {
                    result.addError("Candidate: " + e.getMessage());
                }
            }
            if (!batch.isEmpty()) candidateRepository.saveAll(batch);

            // Reload cache after save (IDs now assigned)
            Map<String, Candidate> savedCache = candidateRepository.findAll().stream()
                .filter(c -> c.getJestorId() != null)
                .collect(Collectors.toMap(Candidate::getJestorId, c -> c, (a, b) -> a));

            // Create JobApplications from candidate-job links
            List<JobApplication> appBatch = new ArrayList<>();
            for (Object[] link : candidateJobLinks) {
                try {
                    String candJestorId = (String) link[0];
                    String vagaJestorId = (String) link[1];
                    String status = (String) link[2];

                    Candidate c = savedCache.get(candJestorId);
                    Job j = jobCache.get(vagaJestorId);
                    if (c == null || j == null || c.getId() == null || j.getId() == null) continue;

                    // Check if already exists
                    if (jobApplicationRepository.findByCandidateIdAndJobId(c.getId(), j.getId()).isPresent()) continue;

                    JobApplication app = new JobApplication(c, j);
                    app.setStatus(mapCandidateStatus(status));
                    appBatch.add(app);
                } catch (Exception e) {
                    log.warn("Error creating job application: {}", e.getMessage());
                }
            }
            if (!appBatch.isEmpty()) {
                jobApplicationRepository.saveAll(appBatch);
                log.info("Created {} job applications from Jestor candidate-job links", appBatch.size());
            }
        });
    }

    private JobApplication.ApplicationStatus mapCandidateStatus(String status) {
        if (status == null || status.isBlank()) return JobApplication.ApplicationStatus.APPLIED;
        String lower = status.toLowerCase().trim();
        if (lower.contains("apresentado")) return JobApplication.ApplicationStatus.SHORTLISTED;
        if (lower.contains("entrevista")) return JobApplication.ApplicationStatus.INTERVIEW_SCHEDULED;
        if (lower.contains("aprovado")) return JobApplication.ApplicationStatus.HIRED;
        if (lower.contains("checagem") || lower.contains("referência")) return JobApplication.ApplicationStatus.UNDER_REVIEW;
        if (lower.contains("mapeado")) return JobApplication.ApplicationStatus.APPLIED;
        return JobApplication.ApplicationStatus.APPLIED;
    }

    @Transactional
    public SyncResult syncWarrantyRules() {
        return syncTable("warranty_rules", config.getWarrantyRulesTable(), (records, result) -> {
            Map<String, WarrantyRule> cache = warrantyRuleRepository.findAll().stream()
                .filter(r -> r.getJestorId() != null)
                .collect(Collectors.toMap(WarrantyRule::getJestorId, r -> r, (a, b) -> a));
            List<WarrantyRule> batch = new ArrayList<>();

            for (Map<String, Object> record : records) {
                try {
                    String jestorId = String.valueOf(record.get("id_" + config.getWarrantyRulesTable()));
                    String name = getStr(record, "name");
                    Job.ServiceCategory category = mapWarrantyCategory(name);
                    if (category == null) { log.info("Skipping warranty rule '{}' - no matching service category", name); continue; }

                    WarrantyRule rule = cache.get(jestorId);
                    boolean isNew = rule == null;
                    if (isNew) {
                        Optional<WarrantyRule> byCategory = warrantyRuleRepository.findByServiceCategory(category);
                        if (byCategory.isPresent()) { rule = byCategory.get(); rule.setJestorId(jestorId); isNew = false; }
                        else { rule = new WarrantyRule(); rule.setJestorId(jestorId); rule.setServiceCategory(category); rule.setActive(true); }
                    }
                    Object diasGarantia = record.get("dias_garantia");
                    if (diasGarantia != null) { try { rule.setDefaultDays(Integer.parseInt(String.valueOf(diasGarantia))); } catch (NumberFormatException ignored) {} }
                    Object diasDisparo = record.get("dias_para_disparo");
                    if (diasDisparo != null) { try { rule.setTriggerDays(Integer.parseInt(String.valueOf(diasDisparo))); } catch (NumberFormatException ignored) {} }
                    String texto = getStr(record, "texto");
                    if (texto != null) rule.setDescription(texto);
                    batch.add(rule);
                    if (isNew) result.incrementCreated(); else result.incrementUpdated();
                } catch (Exception e) {
                    result.addError("WarrantyRule: " + e.getMessage());
                }
            }
            if (!batch.isEmpty()) warrantyRuleRepository.saveAll(batch);
        });
    }

    @Transactional
    public SyncResult syncCandidateStatusLogs() {
        return syncTable("candidate_status_logs", config.getCandidateStatusLogsTable(), (records, result) -> {
            Map<String, CandidateStatusLog> cache = candidateStatusLogRepository.findAll().stream()
                .filter(l -> l.getJestorId() != null)
                .collect(Collectors.toMap(CandidateStatusLog::getJestorId, l -> l, (a, b) -> a));
            Map<String, Candidate> candidateCache = candidateRepository.findAll().stream()
                .filter(c -> c.getJestorId() != null)
                .collect(Collectors.toMap(Candidate::getJestorId, c -> c, (a, b) -> a));
            List<CandidateStatusLog> batch = new ArrayList<>();

            for (Map<String, Object> record : records) {
                try {
                    String jestorId = String.valueOf(record.get("id_" + config.getCandidateStatusLogsTable()));
                    CandidateStatusLog logEntry = cache.getOrDefault(jestorId, new CandidateStatusLog());
                    boolean isNew = logEntry.getJestorId() == null;
                    logEntry.setJestorId(jestorId);
                    String candidateName = getStr(record, "candidato");
                    if (candidateName != null) logEntry.setCandidateName(candidateName);
                    String candidateJestorId = getStr(record, "id_candidato");
                    if (candidateJestorId != null) {
                        logEntry.setCandidateJestorId(candidateJestorId);
                        Candidate c = candidateCache.get(candidateJestorId);
                        if (c != null) logEntry.setCandidate(c);
                    }
                    String statusVal = getStr(record, "status");
                    if (statusVal != null) logEntry.setStatus(statusVal);
                    // Extract creator name
                    Object criadoPor = record.get("criado_por");
                    if (criadoPor instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> cpMap = (Map<String, Object>) criadoPor;
                        String cpType = String.valueOf(cpMap.getOrDefault("type", ""));
                        String cpName = String.valueOf(cpMap.getOrDefault("name", ""));
                        // Only use real users, not tricks/automations
                        if ("standard".equals(cpType) && !cpName.isBlank()) {
                            logEntry.setCreatedBy(cpName);
                        }
                    }
                    String criadoEm = getStr(record, "criado_em");
                    if (criadoEm != null && isNew) {
                        try { logEntry.setCreatedAt(LocalDateTime.parse(criadoEm, DateTimeFormatter.ISO_OFFSET_DATE_TIME)); } catch (Exception ignored) {}
                    }
                    batch.add(logEntry);
                    if (isNew) result.incrementCreated(); else result.incrementUpdated();
                } catch (Exception e) {
                    result.addError("StatusLog: " + e.getMessage());
                }
            }
            if (!batch.isEmpty()) candidateStatusLogRepository.saveAll(batch);
        });
    }

    /**
     * Generic sync table method - fetches records from Jestor and processes them.
     */
    private SyncResult syncTable(String entityName, String table, java.util.function.BiConsumer<List<Map<String, Object>>, SyncResult> processor) {
        if (table == null || table.isBlank()) return new SyncResult(entityName);

        SyncResult result = new SyncResult(entityName);
        SyncLog syncLog = new SyncLog("jestor", entityName);

        try {
            List<Map<String, Object>> records = jestorClient.listAllRecords(table);
            result.setTotal(records.size());
            processor.accept(records, result);
            syncLog.setStatus("SUCCESS");
        } catch (Exception e) {
            result.addError("Full " + entityName + " sync failed: " + e.getMessage());
            syncLog.setStatus("FAILED");
            log.error("{} sync failed", entityName, e);
        }

        completeSyncLog(syncLog, result);
        return result;
    }

    @SuppressWarnings("unchecked")
    private void resolveClientFKCached(Job job, Object clienteObj, Map<String, Client> clientCache) {
        if (clienteObj == null) return;
        String clientJestorId = null;
        if (clienteObj instanceof Map) {
            Map<String, Object> clientMap = (Map<String, Object>) clienteObj;
            Object idValue = clientMap.get("id_" + config.getClientsTable());
            if (idValue == null) {
                for (Map.Entry<String, Object> entry : clientMap.entrySet()) {
                    if (entry.getKey().startsWith("id_") && entry.getValue() != null) { idValue = entry.getValue(); break; }
                }
            }
            if (idValue != null) clientJestorId = String.valueOf(idValue);
            if (job.getCompanyName() == null || job.getCompanyName().isBlank()) {
                Object nameObj = clientMap.get("name");
                if (nameObj != null && !String.valueOf(nameObj).equals("null")) job.setCompanyName(String.valueOf(nameObj));
            }
        } else {
            clientJestorId = String.valueOf(clienteObj);
        }
        if (clientJestorId != null && !clientJestorId.equals("null")) {
            Client client = clientCache.get(clientJestorId);
            if (client != null) { job.setClient(client); job.setCompanyName(client.getCompanyName()); }
        }
    }

    @SuppressWarnings("unchecked")
    private void resolveHeadhunterFKCached(Job job, Object hhObj, Map<String, Headhunter> hhCache) {
        if (hhObj == null) return;
        String hhJestorId = null;
        if (hhObj instanceof Map) {
            Map<String, Object> hhMap = (Map<String, Object>) hhObj;
            Object idValue = hhMap.get("id_" + config.getHeadhuntersTable());
            if (idValue == null) {
                for (Map.Entry<String, Object> entry : hhMap.entrySet()) {
                    if (entry.getKey().startsWith("id_") && entry.getValue() != null) { idValue = entry.getValue(); break; }
                }
            }
            if (idValue != null) hhJestorId = String.valueOf(idValue);
        } else {
            hhJestorId = String.valueOf(hhObj);
        }
        if (hhJestorId != null && !hhJestorId.equals("null")) {
            Headhunter hh = hhCache.get(hhJestorId);
            if (hh != null) job.setHeadhunter(hh);
        }
    }

    private Job.ServiceCategory mapWarrantyCategory(String name) {
        if (name == null) return null;
        String lower = name.toLowerCase().trim();
        if (lower.equals("nhh") || lower.contains("nosso headhunter")) return Job.ServiceCategory.NOSSO_HEADHUNTER;
        if (lower.contains("projeto")) return Job.ServiceCategory.PROJETOS;
        if (lower.contains("executiv")) return Job.ServiceCategory.EXECUTIVAS;
        if (lower.contains("tatic") || lower.contains("tátic")) return Job.ServiceCategory.TATICAS;
        return null;
    }

    private Job.ServiceCategory mapServiceCategory(String perfil) {
        if (perfil == null) return null;
        String lower = perfil.toLowerCase().trim();
        if (lower.contains("projeto")) return Job.ServiceCategory.PROJETOS;
        if (lower.contains("headhunter") || lower.contains("nhh")) return Job.ServiceCategory.NOSSO_HEADHUNTER;
        if (lower.contains("t\u00e1tico") || lower.contains("tatico")) return Job.ServiceCategory.TATICAS;
        if (lower.contains("executiv")) return Job.ServiceCategory.EXECUTIVAS;
        return null;
    }

    private Job.JobStatus mapJobStatus(String status) {
        if (status == null) return Job.JobStatus.ACTIVE;
        String lower = status.toLowerCase().trim();
        if (lower.contains("fechada") || lower.contains("closed")) return Job.JobStatus.CLOSED;
        if (lower.contains("aberta") || lower.contains("open") || lower.contains("ativa") || lower.contains("reaberta")) return Job.JobStatus.ACTIVE;
        if (lower.contains("pausada") || lower.contains("paused") || lower.contains("congelada")) return Job.JobStatus.PAUSED;
        if (lower.contains("cancelada")) return Job.JobStatus.CLOSED;
        if (lower.contains("transferida")) return Job.JobStatus.PAUSED;
        if (lower.contains("garantia") || lower.contains("warranty")) return Job.JobStatus.WARRANTY;
        if (lower.contains("rascunho") || lower.contains("draft")) return Job.JobStatus.DRAFT;
        return Job.JobStatus.ACTIVE;
    }

    private String cleanPhone(String phone) {
        if (phone == null) return null;
        String digits = phone.replaceAll("[^0-9]", "");
        return digits.length() >= 10 && digits.length() <= 11 ? digits : null;
    }

    private String getStr(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        String str = String.valueOf(value);
        return str.equals("null") ? null : str.trim();
    }

    private void completeSyncLog(SyncLog syncLog, SyncResult result) {
        syncLog.setRecordsCreated(result.getCreated());
        syncLog.setRecordsUpdated(result.getUpdated());
        syncLog.setRecordsErrors(result.getErrors());
        syncLog.setCompletedAt(LocalDateTime.now());

        if (result.getErrors() > 0 && result.getCreated() + result.getUpdated() > 0) {
            syncLog.setStatus("PARTIAL");
        }

        if (!result.getErrorMessages().isEmpty()) {
            try {
                syncLog.setErrorDetails(objectMapper.writeValueAsString(result.getErrorMessages()));
            } catch (Exception ignored) {}
        }

        syncLogRepository.save(syncLog);
        log.info("Sync {} complete: created={}, updated={}, errors={}",
            result.getEntity(), result.getCreated(), result.getUpdated(), result.getErrors());
    }
}
