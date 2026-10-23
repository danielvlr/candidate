package com.empresa.sistema.api;

import com.empresa.sistema.domain.entity.Candidate;
import com.empresa.sistema.domain.entity.Client;
import com.empresa.sistema.domain.entity.Headhunter;
import com.empresa.sistema.domain.entity.Job;
import com.empresa.sistema.domain.entity.JobApplication;
import com.empresa.sistema.domain.entity.Warranty;
import com.empresa.sistema.domain.repository.CandidateRepository;
import com.empresa.sistema.domain.repository.ClientRepository;
import com.empresa.sistema.domain.repository.HeadhunterRepository;
import com.empresa.sistema.domain.repository.JobApplicationRepository;
import com.empresa.sistema.domain.repository.JobRepository;
import com.empresa.sistema.domain.repository.WarrantyRepository;
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

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** BUG-03: o HEADHUNTER só enxerga as próprias vagas (e dados ligados a elas) em todos os endpoints de leitura. */
@SpringBootTest(properties = {
        "jestor.api-token=",
        "spring.sql.init.mode=never",
        "app.jwt.secret=integration-test-secret-with-32-bytes-min!!",
        "app.auth.bootstrap-admin.email=admin@test.com",
        "app.auth.bootstrap-admin.password=admin-pass-123"
})
@AutoConfigureMockMvc
@Transactional
class HeadhunterJobScopeIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private HeadhunterRepository headhunterRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private WarrantyRepository warrantyRepository;

    @MockBean
    private GmailEmailService emailService;

    private Headhunter own;
    private Job ownJob;
    private Job otherJob;
    private String hhToken;
    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        Client client = clientRepository.save(Client.builder().companyName("ACME Escopo").build());
        own = saveHeadhunter("HH Dono", "hh.dono@test.com");
        Headhunter other = saveHeadhunter("HH Outro", "hh.outro@test.com");
        ownJob = saveJob("Gerente Escopo Dono", client, own);
        otherJob = saveJob("Gerente Escopo Outro", client, other);
        saveWarranty(ownJob, own, "cand.dono@test.com");
        saveWarranty(otherJob, other, "cand.outro@test.com");

        adminToken = "Bearer " + login("admin@test.com", "admin-pass-123");
        mvc.perform(post("/api/v1/users").header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "hh.dono@test.com", "fullName", "HH Dono",
                                "password", "dono-pass-123", "role", "HEADHUNTER",
                                "headhunterId", own.getId()))))
                .andExpect(status().isCreated());
        hhToken = "Bearer " + login("hh.dono@test.com", "dono-pass-123");
    }

    @Test
    void searchOnlyReturnsOwnJobs() throws Exception {
        mvc.perform(get("/api/v1/jobs/search").param("q", "Gerente Escopo").header("Authorization", hhToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(ownJob.getId()));

        mvc.perform(get("/api/v1/jobs/search").param("q", "Gerente Escopo").header("Authorization", adminToken))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void anotherHeadhuntersJobByIdIsNotFound() throws Exception {
        mvc.perform(get("/api/v1/jobs/" + otherJob.getId()).header("Authorization", hhToken))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/jobs/" + otherJob.getId() + "/detail").header("Authorization", hhToken))
                .andExpect(status().isNotFound());

        mvc.perform(get("/api/v1/jobs/" + ownJob.getId()).header("Authorization", hhToken))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/jobs/" + ownJob.getId() + "/detail").header("Authorization", hhToken))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/jobs/" + otherJob.getId()).header("Authorization", adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void kanbanBoardsOnlyShowOwnJobs() throws Exception {
        for (String path : new String[]{"/api/v1/jobs/kanban", "/api/v1/jobs/kanban/pipeline"}) {
            mvc.perform(get(path).header("Authorization", hhToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.*[*].id", hasItem(ownJob.getId().intValue())))
                    .andExpect(jsonPath("$.*[*].headhunterId", everyItem(is(own.getId().intValue()))));

            mvc.perform(get(path).header("Authorization", adminToken))
                    .andExpect(jsonPath("$.*[*].id",
                            hasItems(ownJob.getId().intValue(), otherJob.getId().intValue())));
        }
    }

    @Test
    void jobsByStatusOnlyShowOwnJobs() throws Exception {
        mvc.perform(get("/api/v1/jobs/status/ACTIVE").header("Authorization", hhToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", hasItem(ownJob.getId().intValue())))
                .andExpect(jsonPath("$[*].id", not(hasItem(otherJob.getId().intValue()))));
    }

    @Test
    void applicationsAndShortlistsOfAnotherHeadhuntersJobAreNotFound() throws Exception {
        mvc.perform(get("/api/v1/applications/job/" + otherJob.getId()).header("Authorization", hhToken))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/shortlists/job/" + otherJob.getId()).header("Authorization", hhToken))
                .andExpect(status().isNotFound());

        mvc.perform(get("/api/v1/applications/job/" + ownJob.getId()).header("Authorization", hhToken))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/shortlists/job/" + ownJob.getId()).header("Authorization", hhToken))
                .andExpect(status().isOk());
    }

    @Test
    void warrantiesOnlyShowOwnJobs() throws Exception {
        mvc.perform(get("/api/v1/warranties").header("Authorization", hhToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].jobId").value(ownJob.getId()));
        mvc.perform(get("/api/v1/warranties").param("status", "ACTIVE").header("Authorization", hhToken))
                .andExpect(jsonPath("$.length()").value(1));

        mvc.perform(get("/api/v1/warranties").header("Authorization", adminToken))
                .andExpect(jsonPath("$.length()").value(2));
    }

    private Headhunter saveHeadhunter(String name, String email) {
        Headhunter hh = new Headhunter(name, email, Headhunter.Seniority.PLENO);
        hh.setFixedCost(BigDecimal.ZERO);
        hh.setVariableCost(BigDecimal.ZERO);
        return headhunterRepository.save(hh);
    }

    private Job saveJob(String title, Client client, Headhunter hh) {
        Job job = new Job(title, "descricao", client);
        job.setHeadhunter(hh);
        job.setStatus(Job.JobStatus.ACTIVE);
        return jobRepository.save(job);
    }

    private void saveWarranty(Job job, Headhunter hh, String candidateEmail) {
        Candidate candidate = candidateRepository.save(new Candidate("Candidato Escopo", candidateEmail));
        JobApplication application = jobApplicationRepository.save(new JobApplication(candidate, job));
        warrantyRepository.save(Warranty.builder()
                .job(job)
                .jobApplication(application)
                .headhunter(hh)
                .serviceCategory(Job.ServiceCategory.values()[0])
                .guaranteeDays(90)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(90))
                .build());
    }

    private String login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asText();
    }
}
