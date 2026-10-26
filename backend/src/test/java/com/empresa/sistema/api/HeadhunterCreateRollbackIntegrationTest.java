package com.empresa.sistema.api;

import com.empresa.sistema.domain.repository.AppUserRepository;
import com.empresa.sistema.domain.repository.HeadhunterRepository;
import com.empresa.sistema.domain.service.GmailEmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Sem @Transactional no teste: a transação real do HeadhunterService precisa ser comitada ou
 * desfeita de verdade para provar o rollback quando a criação do usuário falha.
 */
@SpringBootTest(properties = {
        "jestor.api-token=",
        "spring.sql.init.mode=never",
        "app.jwt.secret=integration-test-secret-with-32-bytes-min!!",
        "app.auth.bootstrap-admin.email=admin@test.com",
        "app.auth.bootstrap-admin.password=admin-pass-123"
})
@AutoConfigureMockMvc
class HeadhunterCreateRollbackIntegrationTest {

    private static final String EMAIL = "rollback.hh@test.com";

    @Autowired
    private MockMvc mvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private HeadhunterRepository headhunterRepository;

    @SpyBean
    private AppUserRepository userRepository;

    @MockBean
    private GmailEmailService emailService;

    @Test
    void userCreationFailureRollsBackTheHeadhunter() throws Exception {
        String adminToken = loginAdmin();
        doThrow(new IllegalStateException("falha simulada"))
                .when(userRepository).save(argThat(u -> u != null && EMAIL.equals(u.getEmail())));

        mvc.perform(post("/api/v1/headhunters").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Rollback HH", "email", EMAIL, "seniority", "PLENO",
                                "fixedCost", 0, "variableCost", 0, "initialPassword", "senha-inicial-123"))))
                .andExpect(status().is5xxServerError());

        assertThat(headhunterRepository.existsByEmail(EMAIL)).isFalse();
    }

    private String loginAdmin() throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", "admin@test.com", "password", "admin-pass-123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asText();
    }
}
