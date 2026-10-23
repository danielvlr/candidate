package com.empresa.sistema.api;

import com.empresa.sistema.domain.entity.Assessorado;
import com.empresa.sistema.domain.entity.Candidate;
import com.empresa.sistema.domain.entity.Client;
import com.empresa.sistema.domain.entity.Headhunter;
import com.empresa.sistema.domain.entity.Job;
import com.empresa.sistema.domain.repository.AssessoradoRepository;
import com.empresa.sistema.domain.repository.CandidateRepository;
import com.empresa.sistema.domain.repository.ClientRepository;
import com.empresa.sistema.domain.repository.HeadhunterRepository;
import com.empresa.sistema.domain.repository.JobRepository;
import com.empresa.sistema.domain.service.GmailEmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** BUG-22: o CPARTNER só enxerga assessorados do senior vinculado e só vagas ativas, sem dados internos. */
@SpringBootTest(properties = {
        "jestor.api-token=",
        "spring.sql.init.mode=never",
        "app.jwt.secret=integration-test-secret-with-32-bytes-min!!",
        "app.auth.bootstrap-admin.email=admin@test.com",
        "app.auth.bootstrap-admin.password=admin-pass-123"
})
@AutoConfigureMockMvc
@Transactional
class CpartnerScopeIntegrationTest {

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private ClientRepository clientRepository;
    @Autowired private HeadhunterRepository headhunterRepository;
    @Autowired private JobRepository jobRepository;
    @Autowired private CandidateRepository candidateRepository;
    @Autowired private AssessoradoRepository assessoradoRepository;
    @MockBean private GmailEmailService emailService;

    private Headhunter seniorA;
    private Headhunter seniorB;
    private Assessorado ownAssessorado;
    private Assessorado otherAssessorado;
    private Job activeJob;
    private Job draftJob;
    private Job closedJob;
    private Job pausedJob;
    private String adminToken;
    private String linkedToken;
    private String unlinkedToken;

    @BeforeEach
    void setUp() throws Exception {
        Client client = clientRepository.save(Client.builder().companyName("ACME Parceiro").build());
        seniorA = saveHeadhunter("Senior A", "senior.a@test.com");
        seniorB = saveHeadhunter("Senior B", "senior.b@test.com");
        ownAssessorado = saveAssessorado("Cand Um", "cand.um@test.com", seniorA);
        otherAssessorado = saveAssessorado("Cand Dois", "cand.dois@test.com", seniorB);
        activeJob = saveJob("Vaga Parceiro Ativa", client, Job.JobStatus.ACTIVE);
        draftJob = saveJob("Vaga Parceiro Rascunho", client, Job.JobStatus.DRAFT);
        closedJob = saveJob("Vaga Parceiro Fechada", client, Job.JobStatus.CLOSED);
        pausedJob = saveJob("Vaga Parceiro Pausada", client, Job.JobStatus.PAUSED);

        adminToken = "Bearer " + login("admin@test.com", "admin-pass-123");
        createCpartner("linked@test.com", seniorA.getId());
        createCpartner("unlinked@test.com", null);
        linkedToken = "Bearer " + login("linked@test.com", "cpartner-pass-123");
        unlinkedToken = "Bearer " + login("unlinked@test.com", "cpartner-pass-123");
    }

    @Test
    void linkedCpartnerListsOnlyOwnSeniorsAssessorados() throws Exception {
        mvc.perform(get("/api/v1/assessorados").header("Authorization", linkedToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(ownAssessorado.getId()));
        mvc.perform(get("/api/v1/assessorados/senior/" + seniorB.getId()).header("Authorization", linkedToken))
                .andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/v1/assessorados/" + ownAssessorado.getId()).header("Authorization", linkedToken))
                .andExpect(status().isOk());
    }

    @Test
    void unlinkedCpartnerSeesNothing() throws Exception {
        mvc.perform(get("/api/v1/assessorados").header("Authorization", unlinkedToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/v1/assessorados/" + ownAssessorado.getId()).header("Authorization", unlinkedToken))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/assessorados").header("Authorization", unlinkedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(seniorA.getId())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cpartnerCannotReachAnotherSeniorsAssessoradoById() throws Exception {
        String id = otherAssessorado.getId().toString();
        mvc.perform(get("/api/v1/assessorados/" + id).header("Authorization", linkedToken))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/assessorados/" + id + "/history").header("Authorization", linkedToken))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/assessorados/" + id + "/matching-jobs").header("Authorization", linkedToken))
                .andExpect(status().isNotFound());
        mvc.perform(put("/api/v1/assessorados/" + id).header("Authorization", linkedToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"notes\":\"x\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .patch("/api/v1/assessorados/" + id + "/phase").header("Authorization", linkedToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"phase\":\"COMPLETED\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void cpartnerCreateForcesOwnSeniorId() throws Exception {
        Candidate candidate = candidateRepository.save(new Candidate("Cand Tres", "cand.tres@test.com"));
        String body = objectMapper.writeValueAsString(Map.of(
                "candidateId", candidate.getId(), "seniorId", seniorB.getId(),
                "advisoryStartDate", LocalDate.now().toString()));
        mvc.perform(post("/api/v1/assessorados").header("Authorization", linkedToken)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.seniorId").value(seniorA.getId()));
    }

    @Test
    void adminSeesAllAssessorados() throws Exception {
        mvc.perform(get("/api/v1/assessorados").header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].id",
                        hasItems(ownAssessorado.getId().intValue(), otherAssessorado.getId().intValue())));
    }

    @Test
    void cpartnerSeesOnlyOpenJobsInEveryListing() throws Exception {
        int open = activeJob.getId().intValue();
        for (String path : new String[]{"/api/v1/jobs", "/api/v1/jobs/filter"}) {
            mvc.perform(get(path).header("Authorization", linkedToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[*].id", hasItem(open)))
                    .andExpect(jsonPath("$.content[*].id", not(hasItem(draftJob.getId().intValue()))))
                    .andExpect(jsonPath("$.content[*].id", not(hasItem(closedJob.getId().intValue()))))
                    .andExpect(jsonPath("$.content[*].id", not(hasItem(pausedJob.getId().intValue()))));
        }
        mvc.perform(get("/api/v1/jobs/search").param("q", "Vaga Parceiro").header("Authorization", linkedToken))
                .andExpect(jsonPath("$.content[*].id", contains(open)));
        mvc.perform(get("/api/v1/jobs/status/DRAFT").header("Authorization", linkedToken))
                .andExpect(jsonPath("$", empty()));
        mvc.perform(get("/api/v1/jobs/status/ACTIVE").header("Authorization", linkedToken))
                .andExpect(jsonPath("$[*].id", hasItem(open)));
    }

    @Test
    void cpartnerGetsNotFoundForNonOpenJobsAndNoInternalData() throws Exception {
        for (Job hidden : new Job[]{draftJob, closedJob, pausedJob}) {
            mvc.perform(get("/api/v1/jobs/" + hidden.getId()).header("Authorization", linkedToken))
                    .andExpect(status().isNotFound());
            mvc.perform(get("/api/v1/jobs/" + hidden.getId() + "/detail").header("Authorization", linkedToken))
                    .andExpect(status().isNotFound());
        }
        mvc.perform(get("/api/v1/jobs/" + activeJob.getId()).header("Authorization", linkedToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobValue").value(nullValue()))
                .andExpect(jsonPath("$.contactEmail").value(nullValue()));
        mvc.perform(get("/api/v1/jobs/" + activeJob.getId() + "/detail").header("Authorization", linkedToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shortlists", empty()))
                .andExpect(jsonPath("$.history", empty()))
                .andExpect(jsonPath("$.jobValue").value(nullValue()));
    }

    @Test
    void cpartnerCannotReachInternalJobEndpoints() throws Exception {
        for (String path : new String[]{
                "/api/v1/shortlists/job/" + activeJob.getId(),
                "/api/v1/applications/job/" + activeJob.getId(),
                "/api/v1/job-history/job/" + activeJob.getId(),
                "/api/v1/warranties",
                "/api/v1/jobs/kanban"}) {
            mvc.perform(get(path).header("Authorization", linkedToken)).andExpect(status().isForbidden());
        }
    }

    @Test
    void adminStillSeesEveryJobAndDetail() throws Exception {
        mvc.perform(get("/api/v1/jobs").header("Authorization", adminToken))
                .andExpect(jsonPath("$.content[*].id", hasItems(activeJob.getId().intValue(),
                        draftJob.getId().intValue(), closedJob.getId().intValue(), pausedJob.getId().intValue())));
        mvc.perform(get("/api/v1/jobs/" + draftJob.getId()).header("Authorization", adminToken))
                .andExpect(status().isOk());
    }

    private void createCpartner(String email, Long headhunterId) throws Exception {
        Map<String, Object> body = new java.util.HashMap<>(Map.of(
                "email", email, "fullName", "Parceiro", "password", "cpartner-pass-123", "role", "CPARTNER"));
        if (headhunterId != null) {
            body.put("headhunterId", headhunterId);
        }
        mvc.perform(post("/api/v1/users").header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated());
    }

    private String createBody(Long seniorId) throws Exception {
        Candidate candidate = candidateRepository.save(new Candidate("Cand Novo", "cand.novo@test.com"));
        return objectMapper.writeValueAsString(Map.of(
                "candidateId", candidate.getId(), "seniorId", seniorId,
                "advisoryStartDate", LocalDate.now().toString()));
    }

    private Headhunter saveHeadhunter(String name, String email) {
        Headhunter hh = new Headhunter(name, email, Headhunter.Seniority.PLENO);
        hh.setFixedCost(BigDecimal.ZERO);
        hh.setVariableCost(BigDecimal.ZERO);
        return headhunterRepository.save(hh);
    }

    private Assessorado saveAssessorado(String name, String email, Headhunter senior) {
        Candidate candidate = candidateRepository.save(new Candidate(name, email));
        return assessoradoRepository.save(new Assessorado(candidate, senior, LocalDate.now()));
    }

    private Job saveJob(String title, Client client, Job.JobStatus status) {
        Job job = new Job(title, "descricao", client);
        job.setStatus(status);
        job.setContactEmail("interno@test.com");
        job.setJobValue(new BigDecimal("12345.00"));
        return jobRepository.save(job);
    }

    private String login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asText();
    }
}
