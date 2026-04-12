package com.empresa.sistema.integration.jestor;

import com.empresa.sistema.config.JestorConfig;
import com.empresa.sistema.domain.entity.*;
import com.empresa.sistema.domain.repository.*;
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

@Service
public class JestorSyncService {

    private static final Logger log = LoggerFactory.getLogger(JestorSyncService.class);

    private final JestorClient jestorClient;
    private final JestorConfig config;
    private final JobRepository jobRepository;
    private final ClientRepository clientRepository;
    private final CandidateRepository candidateRepository;
    private final HeadhunterRepository headhunterRepository;
    private final SyncLogRepository syncLogRepository;
    private final ObjectMapper objectMapper;

    public JestorSyncService(JestorClient jestorClient, JestorConfig config,
                             JobRepository jobRepository, ClientRepository clientRepository,
                             CandidateRepository candidateRepository, HeadhunterRepository headhunterRepository,
                             SyncLogRepository syncLogRepository, ObjectMapper objectMapper) {
        this.jestorClient = jestorClient;
        this.config = config;
        this.jobRepository = jobRepository;
        this.clientRepository = clientRepository;
        this.candidateRepository = candidateRepository;
        this.headhunterRepository = headhunterRepository;
        this.syncLogRepository = syncLogRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Full sync in dependency order: clients -> headhunters -> jobs -> candidates
     */
    public List<SyncResult> fullSync() {
        List<SyncResult> results = new ArrayList<>();
        results.add(syncClients());
        results.add(syncHeadhunters());
        results.add(syncJobs());
        results.add(syncCandidates());
        return results;
    }

    @Transactional
    public SyncResult syncClients() {
        String table = config.getClientsTable();
        if (table == null || table.isBlank()) {
            return new SyncResult("clients");
        }

        SyncResult result = new SyncResult("clients");
        SyncLog syncLog = new SyncLog("jestor", "clients");

        try {
            List<Map<String, Object>> records = jestorClient.listAllRecords(table);
            result.setTotal(records.size());

            for (Map<String, Object> record : records) {
                try {
                    boolean isNew = upsertClient(record);
                    if (isNew) result.incrementCreated();
                    else result.incrementUpdated();
                } catch (Exception e) {
                    result.addError("Client sync error: " + e.getMessage());
                    log.warn("Error syncing client record: {}", e.getMessage());
                }
            }

            // Re-count: fetch all and count by jestorId presence
            syncLog.setStatus("SUCCESS");
        } catch (Exception e) {
            result.addError("Full client sync failed: " + e.getMessage());
            syncLog.setStatus("FAILED");
            log.error("Client sync failed", e);
        }

        completeSyncLog(syncLog, result);
        return result;
    }

    @Transactional
    public SyncResult syncHeadhunters() {
        String table = config.getHeadhuntersTable();
        if (table == null || table.isBlank()) {
            return new SyncResult("headhunters");
        }

        SyncResult result = new SyncResult("headhunters");
        SyncLog syncLog = new SyncLog("jestor", "headhunters");

        try {
            List<Map<String, Object>> records = jestorClient.listAllRecords(table);
            result.setTotal(records.size());

            for (Map<String, Object> record : records) {
                try {
                    boolean isNew = upsertHeadhunter(record);
                    if (isNew) result.incrementCreated();
                    else result.incrementUpdated();
                } catch (Exception e) {
                    result.addError("Headhunter sync error: " + e.getMessage());
                    log.warn("Error syncing headhunter record: {}", e.getMessage());
                }
            }
            syncLog.setStatus("SUCCESS");
        } catch (Exception e) {
            result.addError("Full headhunter sync failed: " + e.getMessage());
            syncLog.setStatus("FAILED");
            log.error("Headhunter sync failed", e);
        }

        completeSyncLog(syncLog, result);
        return result;
    }

    @Transactional
    public SyncResult syncJobs() {
        String table = config.getJobsTable();
        if (table == null || table.isBlank()) {
            return new SyncResult("jobs");
        }

        SyncResult result = new SyncResult("jobs");
        SyncLog syncLog = new SyncLog("jestor", "jobs");

        try {
            List<Map<String, Object>> records = jestorClient.listAllRecords(table);
            result.setTotal(records.size());

            for (Map<String, Object> record : records) {
                try {
                    boolean isNew = upsertJob(record);
                    if (isNew) result.incrementCreated();
                    else result.incrementUpdated();
                } catch (Exception e) {
                    result.addError("Job sync error: " + e.getMessage());
                    log.warn("Error syncing job record: {}", e.getMessage());
                }
            }
            syncLog.setStatus("SUCCESS");
        } catch (Exception e) {
            result.addError("Full job sync failed: " + e.getMessage());
            syncLog.setStatus("FAILED");
            log.error("Job sync failed", e);
        }

        completeSyncLog(syncLog, result);
        return result;
    }

    @Transactional
    public SyncResult syncCandidates() {
        String table = config.getCandidatesTable();
        if (table == null || table.isBlank()) {
            return new SyncResult("candidates");
        }

        SyncResult result = new SyncResult("candidates");
        SyncLog syncLog = new SyncLog("jestor", "candidates");

        try {
            List<Map<String, Object>> records = jestorClient.listAllRecords(table);
            result.setTotal(records.size());

            for (Map<String, Object> record : records) {
                try {
                    boolean isNew = upsertCandidate(record);
                    if (isNew) result.incrementCreated();
                    else result.incrementUpdated();
                } catch (Exception e) {
                    result.addError("Candidate sync error: " + e.getMessage());
                    log.warn("Error syncing candidate record: {}", e.getMessage());
                }
            }
            syncLog.setStatus("SUCCESS");
        } catch (Exception e) {
            result.addError("Full candidate sync failed: " + e.getMessage());
            syncLog.setStatus("FAILED");
            log.error("Candidate sync failed", e);
        }

        completeSyncLog(syncLog, result);
        return result;
    }

    // ==================== UPSERT METHODS ====================

    /**
     * Upsert client with CRITICAL gestor info mapping:
     * nome_do_responsavel -> contactPersonName
     * email -> contactEmail
     * telefone -> contactPhone
     */
    private boolean upsertClient(Map<String, Object> record) {
        String jestorId = String.valueOf(record.get("id_" + config.getClientsTable()));
        Optional<Client> existing = clientRepository.findByJestorId(jestorId);
        boolean isNew = existing.isEmpty();

        Client client = existing.orElseGet(Client::new);
        client.setJestorId(jestorId);
        String companyName = getStr(record, "name");
        if (companyName != null && !companyName.isBlank()) {
            client.setCompanyName(companyName);
        } else if (isNew) {
            client.setCompanyName("Cliente Jestor #" + jestorId);
        }
        client.setIndustry(getStr(record, "segmento"));

        // CRITICAL - Gestor information
        client.setContactPersonName(getStr(record, "nome_do_responsavel"));
        client.setContactEmail(getStr(record, "email"));
        client.setContactPhone(getStr(record, "telefone"));

        clientRepository.save(client);
        return isNew;
    }

    /**
     * Upsert headhunter from Funcionários table:
     * name/nome -> fullName, email -> email, telefone -> phone
     */
    private boolean upsertHeadhunter(Map<String, Object> record) {
        String jestorId = String.valueOf(record.get("id_" + config.getHeadhuntersTable()));
        Optional<Headhunter> existing = headhunterRepository.findByJestorId(jestorId);
        boolean isNew = existing.isEmpty();

        Headhunter hh = existing.orElseGet(Headhunter::new);
        hh.setJestorId(jestorId);

        String name = getStr(record, "name");
        if (name == null || name.isBlank()) {
            name = getStr(record, "nome");
        }
        if (name == null || name.isBlank()) {
            name = getStr(record, "jestor_object_label");
        }
        if (name != null && !name.isBlank()) {
            hh.setFullName(name);
        } else if (isNew) {
            hh.setFullName("Funcionario Jestor #" + jestorId);
        }

        String email = getStr(record, "email");
        if (email != null && !email.isBlank()) {
            hh.setEmail(email);
        } else if (isNew) {
            hh.setEmail(jestorId + "@jestor-sync.local");
        }

        String telefone = getStr(record, "telefone");
        if (telefone != null) {
            hh.setPhone(cleanPhone(telefone));
        }

        // Set defaults for required fields on new records
        if (isNew) {
            if (hh.getSeniority() == null) hh.setSeniority(Headhunter.Seniority.PLENO);
            if (hh.getFixedCost() == null) hh.setFixedCost(BigDecimal.ZERO);
            if (hh.getVariableCost() == null) hh.setVariableCost(BigDecimal.ZERO);
        }

        headhunterRepository.save(hh);
        return isNew;
    }

    private boolean upsertJob(Map<String, Object> record) {
        String jestorId = String.valueOf(record.get("id_" + config.getJobsTable()));
        Optional<Job> existing = jobRepository.findByJestorId(jestorId);
        boolean isNew = existing.isEmpty();

        Job job = existing.orElseGet(Job::new);
        job.setJestorId(jestorId);

        // Title: prefer nome_vaga, fallback to vaga
        String title = getStr(record, "nome_vaga");
        if (title == null || title.isBlank()) {
            title = getStr(record, "vaga");
        }
        if (title != null && !title.isBlank()) {
            job.setTitle(title);
        } else if (isNew) {
            job.setTitle("Vaga Jestor #" + jestorId);
        }

        // Description
        if (isNew && job.getDescription() == null) {
            job.setDescription(title != null ? title : "Importado do Jestor");
        }

        // Service category from perfil
        String perfil = getStr(record, "perfil");
        if (perfil != null) {
            job.setServiceCategory(mapServiceCategory(perfil));
        }

        // Status
        String status = getStr(record, "status");
        if (status != null) {
            job.setStatus(mapJobStatus(status));
        }

        // Resolve client FK via jestorId
        Object clienteObj = record.get("cliente");
        resolveClientFK(job, clienteObj);

        // Resolve headhunter FK via jestorId
        Object hhObj = record.get("headhunter_1");
        resolveHeadhunterFK(job, hhObj);

        // Salary/value
        Object remuneracao = record.get("remuneracao");
        if (remuneracao != null) {
            try {
                job.setJobValue(new BigDecimal(String.valueOf(remuneracao)));
            } catch (NumberFormatException ignored) {}
        }

        // Dates
        String dataContato = getStr(record, "data_contato");
        if (dataContato != null) {
            try {
                job.setStartDate(LocalDate.parse(dataContato));
            } catch (Exception ignored) {}
        }

        String dataFechamento = getStr(record, "data_fechamento");
        if (dataFechamento != null) {
            try {
                job.setClosedAt(LocalDate.parse(dataFechamento).atStartOfDay());
            } catch (Exception ignored) {}
        }

        // Ensure client is set (required field)
        if (job.getClient() == null) {
            Client defaultClient = clientRepository.findAll().stream().findFirst().orElse(null);
            if (defaultClient != null) {
                job.setClient(defaultClient);
                job.setCompanyName(defaultClient.getCompanyName());
            }
        }

        jobRepository.save(job);
        return isNew;
    }

    private boolean upsertCandidate(Map<String, Object> record) {
        String jestorId = String.valueOf(record.get("id_" + config.getCandidatesTable()));
        Optional<Candidate> existing = candidateRepository.findByJestorId(jestorId);
        boolean isNew = existing.isEmpty();

        Candidate candidate = existing.orElseGet(Candidate::new);
        candidate.setJestorId(jestorId);

        String name = getStr(record, "name");
        if (name != null && !name.isBlank()) {
            candidate.setFullName(name);
        } else if (isNew) {
            candidate.setFullName("Candidato Jestor #" + jestorId);
        }

        String telefone = getStr(record, "telefone");
        if (telefone != null) {
            candidate.setPhone(telefone);
        }

        String linkedin = getStr(record, "linkedin");
        if (linkedin != null) {
            candidate.setLinkedinUrl(linkedin);
        }

        String funcaoAtual = getStr(record, "funcao_atual");
        if (funcaoAtual != null) {
            candidate.setHeadline(funcaoAtual);
        }

        String uf = getStr(record, "uf");
        if (uf != null) {
            candidate.setState(uf);
        }

        Object pretensao = record.get("pretensao_salarial");
        if (pretensao != null) {
            try {
                candidate.setDesiredSalary(Double.parseDouble(String.valueOf(pretensao)));
            } catch (NumberFormatException ignored) {}
        }

        // Set required email for new candidates
        if (isNew && candidate.getEmail() == null) {
            candidate.setEmail(jestorId + "@jestor-sync.local");
        }

        candidateRepository.save(candidate);
        return isNew;
    }

    // ==================== HELPER METHODS ====================

    @SuppressWarnings("unchecked")
    private void resolveClientFK(Job job, Object clienteObj) {
        if (clienteObj == null) return;

        String clientJestorId = null;
        if (clienteObj instanceof Map) {
            Map<String, Object> clientMap = (Map<String, Object>) clienteObj;
            clientJestorId = String.valueOf(clientMap.get("id_" + config.getClientsTable()));
        } else {
            clientJestorId = String.valueOf(clienteObj);
        }

        if (clientJestorId != null && !clientJestorId.equals("null")) {
            clientRepository.findByJestorId(clientJestorId).ifPresent(client -> {
                job.setClient(client);
                job.setCompanyName(client.getCompanyName());
            });
        }
    }

    @SuppressWarnings("unchecked")
    private void resolveHeadhunterFK(Job job, Object hhObj) {
        if (hhObj == null) return;

        String hhJestorId = null;
        if (hhObj instanceof Map) {
            Map<String, Object> hhMap = (Map<String, Object>) hhObj;
            hhJestorId = String.valueOf(hhMap.get("id_" + config.getHeadhuntersTable()));
        } else {
            hhJestorId = String.valueOf(hhObj);
        }

        if (hhJestorId != null && !hhJestorId.equals("null")) {
            headhunterRepository.findByJestorId(hhJestorId).ifPresent(job::setHeadhunter);
        }
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
        if (lower.contains("aberta") || lower.contains("open") || lower.contains("ativa")) return Job.JobStatus.ACTIVE;
        if (lower.contains("pausada") || lower.contains("paused") || lower.contains("congelada")) return Job.JobStatus.PAUSED;
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
