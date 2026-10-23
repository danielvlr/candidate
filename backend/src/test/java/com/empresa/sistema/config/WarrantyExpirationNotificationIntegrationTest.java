package com.empresa.sistema.config;

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
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * Roda o scheduler como em produção (fora de transação), com relacionamentos LAZY de verdade.
 * O e-mail vai somente para o headhunter da garantia.
 */
@SpringBootTest(properties = {
        "jestor.api-token=",
        "spring.sql.init.mode=never",
        "app.jwt.secret=integration-test-secret-with-32-bytes-min!!",
        "app.auth.bootstrap-admin.email=admin@test.com",
        "app.auth.bootstrap-admin.password=admin-pass-123"
})
class WarrantyExpirationNotificationIntegrationTest {

    @Autowired
    private NotificationScheduler scheduler;

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

    /** Sem rollback (o teste roda fora de transação): remove o que criou, na ordem das FKs. */
    private record Created(Long warrantyId, Long applicationId, Long candidateId, Long jobId,
                           Long headhunterId, Long clientId) {
    }

    private final List<Created> created = new ArrayList<>();

    @AfterEach
    void cleanUp() {
        created.forEach(c -> {
            warrantyRepository.deleteById(c.warrantyId());
            jobApplicationRepository.deleteById(c.applicationId());
            candidateRepository.deleteById(c.candidateId());
            jobRepository.deleteById(c.jobId());
            headhunterRepository.deleteById(c.headhunterId());
            clientRepository.deleteById(c.clientId());
        });
        created.clear();
    }

    @Test
    void sendsAlertToHeadhunterTenDaysBeforeExpiration() {
        Warranty warranty = saveWarranty("hh.alert@test.com", Headhunter.HeadhunterStatus.ACTIVE, 10, "w1");

        scheduler.checkExpiringWarranties();

        verify(emailService).sendWarrantyExpirationAlert(
                eq("hh.alert@test.com"), eq("HH w1"), eq("Vaga w1"), eq("ACME w1"), eq("Candidato w1"),
                any(), any(), eq(warranty.getEndDate()), eq(10L), anyString(), eq(90));
        assertThat(warrantyRepository.findById(warranty.getId()).orElseThrow().getNotificationSentAt()).isNotNull();
    }

    @Test
    void doesNotNotifyWarrantyFarFromExpiration() {
        Warranty warranty = saveWarranty("hh.far@test.com", Headhunter.HeadhunterStatus.ACTIVE, 20, "w2");

        scheduler.checkExpiringWarranties();

        verify(emailService, never()).sendWarrantyExpirationAlert(
                eq("hh.far@test.com"), any(), any(), any(), any(), any(), any(), any(), anyLong(), any(), anyInt());
        assertThat(warrantyRepository.findById(warranty.getId()).orElseThrow().getNotificationSentAt()).isNull();
    }

    @Test
    void inactiveHeadhunterIsSkippedWithoutFallbackRecipient() {
        Warranty warranty = saveWarranty("hh.inactive@test.com", Headhunter.HeadhunterStatus.INACTIVE, 5, "w3");

        scheduler.checkExpiringWarranties();

        verify(emailService, never()).sendWarrantyExpirationAlert(
                any(), eq("HH w3"), any(), any(), any(), any(), any(), any(), anyLong(), any(), anyInt());
        assertThat(warrantyRepository.findById(warranty.getId()).orElseThrow().getNotificationSentAt()).isNull();
    }

    private Warranty saveWarranty(String hhEmail, Headhunter.HeadhunterStatus hhStatus, int daysToExpire, String tag) {
        Client client = clientRepository.save(Client.builder().companyName("ACME " + tag).build());
        Headhunter hh = new Headhunter("HH " + tag, hhEmail, Headhunter.Seniority.PLENO);
        hh.setFixedCost(BigDecimal.ZERO);
        hh.setVariableCost(BigDecimal.ZERO);
        hh.setStatus(hhStatus);
        hh = headhunterRepository.save(hh);

        Job job = new Job("Vaga " + tag, "descricao", client);
        job.setHeadhunter(hh);
        job.setStatus(Job.JobStatus.CLOSED);
        job = jobRepository.save(job);

        Candidate candidate = candidateRepository.save(new Candidate("Candidato " + tag, tag + ".cand@test.com"));
        JobApplication application = new JobApplication(candidate, job);
        application.setStatus(JobApplication.ApplicationStatus.HIRED);
        application = jobApplicationRepository.save(application);

        LocalDate end = LocalDate.now().plusDays(daysToExpire);
        Warranty warranty = warrantyRepository.save(Warranty.builder()
                .job(job)
                .jobApplication(application)
                .headhunter(hh)
                .serviceCategory(Job.ServiceCategory.NOSSO_HEADHUNTER)
                .guaranteeDays(90)
                .startDate(end.minusDays(90))
                .endDate(end)
                .build());
        created.add(new Created(warranty.getId(), application.getId(), candidate.getId(), job.getId(),
                hh.getId(), client.getId()));
        return warranty;
    }
}
