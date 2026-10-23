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
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Fechar vaga exige o candidato aprovado: registra a contratação e abre a garantia. */
@SpringBootTest(properties = {
        "jestor.api-token=",
        "spring.sql.init.mode=never",
        "app.jwt.secret=integration-test-secret-with-32-bytes-min!!",
        "app.auth.bootstrap-admin.email=admin@test.com",
        "app.auth.bootstrap-admin.password=admin-pass-123"
})
@AutoConfigureMockMvc
@Transactional
class JobCloseApprovedCandidateIntegrationTest {

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

    @Test
    void closingWithShortlistedCandidateHiresAndOpensWarranty() throws Exception {
        Job job = saveActiveJob("close.ok@test.com");
        Candidate candidate = candidateRepository.save(new Candidate("Ana Aprovada", "ana.close@test.com"));
        JobApplication application = new JobApplication(candidate, job);
        application.setStatus(JobApplication.ApplicationStatus.SHORTLISTED);
        jobApplicationRepository.save(application);

        mvc.perform(close(job.getId(), Map.of(
                        "finalValue", 15000,
                        "closedAt", "2026-10-01T10:00:00",
                        "approvedCandidateId", candidate.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.approvedCandidateId").value(candidate.getId()))
                .andExpect(jsonPath("$.approvedCandidateName").value("Ana Aprovada"));

        JobApplication hired = jobApplicationRepository.findByCandidateIdAndJobId(candidate.getId(), job.getId())
                .orElseThrow();
        assertThat(hired.getStatus()).isEqualTo(JobApplication.ApplicationStatus.HIRED);
        assertThat(candidateRepository.findById(candidate.getId()).orElseThrow().getStatus())
                .isEqualTo(Candidate.CandidateStatus.HIRED);

        List<Warranty> warranties = warrantyRepository.findByJobId(job.getId());
        assertThat(warranties).hasSize(1);
        Warranty warranty = warranties.get(0);
        assertThat(warranty.getStartDate()).isEqualTo(LocalDate.of(2026, 10, 1));
        assertThat(warranty.getEndDate()).isEqualTo(LocalDate.of(2026, 10, 1).plusDays(90));
        assertThat(warranty.getHeadhunter().getId()).isEqualTo(job.getHeadhunter().getId());
    }

    @Test
    void closingWithCandidateWithoutApplicationCreatesHiredApplication() throws Exception {
        Job job = saveActiveJob("close.noapp@test.com");
        Candidate candidate = candidateRepository.save(new Candidate("Bruno Externo", "bruno.close@test.com"));

        mvc.perform(close(job.getId(), Map.of("finalValue", 9000, "approvedCandidateId", candidate.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approvedCandidateId").value(candidate.getId()));

        assertThat(jobApplicationRepository.findByCandidateIdAndJobId(candidate.getId(), job.getId()))
                .get()
                .extracting(JobApplication::getStatus)
                .isEqualTo(JobApplication.ApplicationStatus.HIRED);
        assertThat(warrantyRepository.findByJobId(job.getId())).hasSize(1);
    }

    @Test
    void closingWithoutApprovedCandidateReturns400() throws Exception {
        Job job = saveActiveJob("close.missing@test.com");

        mvc.perform(close(job.getId(), Map.of("finalValue", 1000)))
                .andExpect(status().isBadRequest());

        assertThat(jobRepository.findById(job.getId()).orElseThrow().getStatus()).isEqualTo(Job.JobStatus.ACTIVE);
    }

    @Test
    void closingWithUnknownCandidateReturns404() throws Exception {
        Job job = saveActiveJob("close.unknown@test.com");

        mvc.perform(close(job.getId(), Map.of("finalValue", 1000, "approvedCandidateId", 999_999L)))
                .andExpect(status().isNotFound());

        assertThat(jobRepository.findById(job.getId()).orElseThrow().getStatus()).isEqualTo(Job.JobStatus.ACTIVE);
    }

    private org.springframework.test.web.servlet.RequestBuilder close(Long jobId, Map<String, Object> body)
            throws Exception {
        return post("/api/v1/jobs/{id}/close", jobId)
                .header("Authorization", "Bearer " + login())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body));
    }

    private Job saveActiveJob(String headhunterEmail) {
        Client client = clientRepository.save(Client.builder().companyName("ACME").build());
        Headhunter hh = new Headhunter("HH Fechamento", headhunterEmail, Headhunter.Seniority.PLENO);
        hh.setFixedCost(BigDecimal.ZERO);
        hh.setVariableCost(BigDecimal.ZERO);
        hh = headhunterRepository.save(hh);
        Job job = new Job("Vaga Fechamento", "descricao", client);
        job.setHeadhunter(hh);
        job.setStatus(Job.JobStatus.ACTIVE);
        job.setGuaranteeDays(90);
        return jobRepository.save(job);
    }

    private String login() throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", "admin@test.com", "password", "admin-pass-123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asText();
    }
}
