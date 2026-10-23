package com.empresa.sistema.api;

import com.empresa.sistema.domain.entity.Candidate;
import com.empresa.sistema.domain.repository.CandidateRepository;
import com.empresa.sistema.domain.service.GmailEmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mail.MailSendException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Aprovar/rejeitar cadastro por convite avisa o candidato por e-mail (BUG-33). */
@SpringBootTest(properties = {
        "jestor.api-token=",
        "spring.sql.init.mode=never",
        "app.jwt.secret=integration-test-secret-with-32-bytes-min!!",
        "app.auth.bootstrap-admin.email=admin@test.com",
        "app.auth.bootstrap-admin.password=admin-pass-123"
})
@AutoConfigureMockMvc
@Transactional
class CandidateDecisionEmailIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private EntityManager entityManager;

    @MockBean
    private GmailEmailService emailService;

    @Test
    void approveSendsApprovalEmail() throws Exception {
        Candidate candidate = pendingCandidate("aprova.ok@test.com");

        mvc.perform(decision("approve", candidate.getId(), null))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        verify(emailService).sendCandidateApproved("aprova.ok@test.com", "Cand Pendente");
    }

    @Test
    void approvalPersistsEvenWhenEmailFails() throws Exception {
        Candidate candidate = pendingCandidate("aprova.falha@test.com");
        doThrow(new MailSendException("smtp fora do ar"))
                .when(emailService).sendCandidateApproved(any(), any());

        mvc.perform(decision("approve", candidate.getId(), null))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        entityManager.clear();
        assertThat(candidateRepository.findById(candidate.getId()).orElseThrow().getStatus())
                .isEqualTo(Candidate.CandidateStatus.ACTIVE);
    }

    @Test
    void rejectSendsRejectionEmailWithReason() throws Exception {
        Candidate candidate = pendingCandidate("rejeita.ok@test.com");

        mvc.perform(decision("reject", candidate.getId(), Map.of("reason", "Perfil fora da vaga")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));

        verify(emailService).sendCandidateRejected(
                eq("rejeita.ok@test.com"), eq("Cand Pendente"), eq("Perfil fora da vaga"));
    }

    @Test
    void rejectionPersistsEvenWhenEmailFails() throws Exception {
        Candidate candidate = pendingCandidate("rejeita.falha@test.com");
        doThrow(new MailSendException("smtp fora do ar"))
                .when(emailService).sendCandidateRejected(any(), any(), any());

        mvc.perform(decision("reject", candidate.getId(), Map.of("reason", "x")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));

        entityManager.flush();
        entityManager.clear();
        assertThat(candidateRepository.findById(candidate.getId()).orElseThrow().getStatus())
                .isEqualTo(Candidate.CandidateStatus.REJECTED);
    }

    @Test
    void approveOfNonPendingCandidateSendsNoEmail() throws Exception {
        Candidate candidate = candidateRepository.save(new Candidate("Cand Ativo", "ativo@test.com"));
        entityManager.flush();
        entityManager.clear();

        mvc.perform(decision("approve", candidate.getId(), null))
                .andExpect(status().is4xxClientError());

        verifyNoInteractions(emailService);
    }

    private Candidate pendingCandidate(String email) {
        Candidate candidate = new Candidate("Cand Pendente", email);
        candidate.setStatus(Candidate.CandidateStatus.PENDING_APPROVAL);
        candidate = candidateRepository.save(candidate);
        entityManager.flush();
        entityManager.clear();
        return candidate;
    }

    private org.springframework.test.web.servlet.RequestBuilder decision(
            String action, Long candidateId, Map<String, String> body) throws Exception {
        return post("/api/v1/candidate-invitations/candidates/{id}/" + action, candidateId)
                .header("Authorization", "Bearer " + login())
                .header("X-Headhunter-Id", 1L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body != null ? body : Map.of()));
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
