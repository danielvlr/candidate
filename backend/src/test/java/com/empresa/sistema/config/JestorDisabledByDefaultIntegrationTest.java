package com.empresa.sistema.config;

import com.empresa.sistema.domain.service.GmailEmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.DisabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * BUG-01: com a configuração padrão (sem JESTOR_API_URL/JESTOR_API_TOKEN) a aplicação sobe
 * com a integração desligada — nada de credencial embutida no application.yml.
 */
@SpringBootTest(properties = {
        "spring.sql.init.mode=never",
        "app.jwt.secret=integration-test-secret-with-32-bytes-min!!",
        "app.auth.bootstrap-admin.email=admin@test.com",
        "app.auth.bootstrap-admin.password=admin-pass-123"
})
@AutoConfigureMockMvc
@DisabledIfEnvironmentVariable(named = "JESTOR_API_TOKEN", matches = ".+")
class JestorDisabledByDefaultIntegrationTest {

    @Autowired
    private ApplicationContext context;

    @Autowired
    private JestorConfig jestorConfig;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GmailEmailService emailService;

    @Test
    void integrationIsUnconfiguredAndSchedulerIsOff() {
        assertThat(jestorConfig.getApiToken()).isNullOrEmpty();
        assertThat(jestorConfig.getApiUrl()).isNullOrEmpty();
        assertThat(jestorConfig.isConfigured()).isFalse();
        assertThat(context.getBeansOfType(JestorSyncScheduler.class)).isEmpty();
    }

    @Test
    void manualSyncIsRefusedWhileUnconfigured() throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", "admin@test.com", "password", "admin-pass-123"))))
                .andReturn().getResponse().getContentAsString();
        String token = "Bearer " + objectMapper.readTree(body).get("token").asText();

        mvc.perform(post("/api/v1/jestor/sync").header("Authorization", token))
                .andExpect(status().isConflict());
    }
}
