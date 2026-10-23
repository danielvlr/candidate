package com.empresa.sistema.api;

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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** BUG-02: o backend aplica as regras de perfil (antes só /users era restrito a ADMIN). */
@SpringBootTest(properties = {
        "jestor.api-token=",
        "spring.sql.init.mode=never",
        "app.jwt.secret=integration-test-secret-with-32-bytes-min!!",
        "app.auth.bootstrap-admin.email=admin@test.com",
        "app.auth.bootstrap-admin.password=admin-pass-123"
})
@AutoConfigureMockMvc
@Transactional
class RoleAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GmailEmailService emailService;

    private String adminToken;
    private String headhunterToken;
    private String cpartnerToken;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = login("admin@test.com", "admin-pass-123");
        createUser("hh.roles@test.com", "HEADHUNTER");
        createUser("cp.roles@test.com", "CPARTNER");
        headhunterToken = login("hh.roles@test.com", "user-pass-123");
        cpartnerToken = login("cp.roles@test.com", "user-pass-123");
    }

    @Test
    void adminOnlyWritesAreForbiddenForHeadhunterAndCpartner() throws Exception {
        for (MockHttpServletRequestBuilder request : adminOnlyRequests()) {
            expectForbidden(request, headhunterToken);
            expectForbidden(request, cpartnerToken);
        }
    }

    @Test
    void jestorIsAdminOnlyIncludingReads() throws Exception {
        expectForbidden(get("/api/v1/jestor/sync/status"), headhunterToken);
        expectForbidden(get("/api/v1/jestor/sync/history"), cpartnerToken);

        mvc.perform(get("/api/v1/jestor/sync/status").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk());
    }

    @Test
    void assessoradosAreForAdminAndCpartnerOnly() throws Exception {
        expectForbidden(get("/api/v1/assessorados"), headhunterToken);
        expectForbidden(post("/api/v1/assessorados").contentType(MediaType.APPLICATION_JSON).content("{}"),
                headhunterToken);

        mvc.perform(get("/api/v1/assessorados").header("Authorization", bearer(cpartnerToken)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/assessorados").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk());
    }

    @Test
    void readsUsedAcrossProfilesStayOpenToLoggedUsers() throws Exception {
        for (String token : List.of(headhunterToken, cpartnerToken)) {
            mvc.perform(get("/api/v1/headhunters").header("Authorization", bearer(token)))
                    .andExpect(status().isOk());
            mvc.perform(get("/api/v1/warranty-rules").header("Authorization", bearer(token)))
                    .andExpect(status().isOk());
            mvc.perform(get("/api/v1/jobs").header("Authorization", bearer(token)))
                    .andExpect(status().isOk());
        }
    }

    @Test
    void adminKeepsAccessToAdminOnlyOperations() throws Exception {
        mvc.perform(post("/api/v1/jobs/expire-jobs").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/jobs/promote-expired-warranty").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk());
    }

    private List<MockHttpServletRequestBuilder> adminOnlyRequests() {
        return List.of(
                post("/api/v1/headhunters").contentType(MediaType.APPLICATION_JSON).content("{}"),
                put("/api/v1/headhunters/1").contentType(MediaType.APPLICATION_JSON).content("{}"),
                patch("/api/v1/headhunters/1/status").param("status", "ACTIVE"),
                delete("/api/v1/headhunters/1"),
                post("/api/v1/jestor/sync"),
                post("/api/v1/jestor/test-connection"),
                post("/api/v1/warranty-rules").contentType(MediaType.APPLICATION_JSON).content("{}"),
                put("/api/v1/warranty-rules/1").contentType(MediaType.APPLICATION_JSON).content("{}"),
                delete("/api/v1/warranty-rules/1"),
                post("/api/v1/jobs").contentType(MediaType.APPLICATION_JSON).content("{}"),
                put("/api/v1/jobs/1").contentType(MediaType.APPLICATION_JSON).content("{}"),
                delete("/api/v1/jobs/1"),
                patch("/api/v1/jobs/1/pause"),
                patch("/api/v1/jobs/1/activate"),
                patch("/api/v1/jobs/1/close"),
                post("/api/v1/jobs/1/close").contentType(MediaType.APPLICATION_JSON).content("{}"),
                patch("/api/v1/jobs/1/status").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PAUSED\"}"),
                post("/api/v1/jobs/expire-jobs"),
                post("/api/v1/jobs/promote-expired-warranty")
        );
    }

    private void expectForbidden(MockHttpServletRequestBuilder request, String token) throws Exception {
        mvc.perform(request.header("Authorization", bearer(token)))
                .andExpect(status().isForbidden());
    }

    private void createUser(String email, String role) throws Exception {
        mvc.perform(post("/api/v1/users").header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email, "fullName", "Usuario " + role,
                                "password", "user-pass-123", "role", role))))
                .andExpect(status().isCreated());
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    private String login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asText();
    }
}
