package com.empresa.sistema.api;

import com.empresa.sistema.domain.entity.Headhunter;
import com.empresa.sistema.domain.repository.HeadhunterRepository;
import com.empresa.sistema.domain.service.GmailEmailService;
import com.fasterxml.jackson.databind.JsonNode;
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
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Admin define o perfil (ADMIN/HEADHUNTER/CPARTNER) de cada usuário. */
@SpringBootTest(properties = {
        "jestor.api-token=",
        "spring.sql.init.mode=never",
        "app.jwt.secret=integration-test-secret-with-32-bytes-min!!",
        "app.auth.bootstrap-admin.email=admin@test.com",
        "app.auth.bootstrap-admin.password=admin-pass-123"
})
@AutoConfigureMockMvc
@Transactional
class UserRoleManagementIntegrationTest {

    private static final String ADMIN_EMAIL = "admin@test.com";
    private static final String ADMIN_PASSWORD = "admin-pass-123";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private HeadhunterRepository headhunterRepository;

    @MockBean
    private GmailEmailService emailService;

    @Test
    void adminPromotesHeadhunterToAdmin() throws Exception {
        String adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        long userId = createUser(adminToken, "promo.role@test.com", "HEADHUNTER");

        mvc.perform(patchRole(adminToken, userId, Map.of("role", "ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userId))
                .andExpect(jsonPath("$.role").value("ADMIN"));

        String promotedToken = login("promo.role@test.com", "user-pass-1234");
        mvc.perform(get("/api/v1/users").header("Authorization", "Bearer " + promotedToken))
                .andExpect(status().isOk());
    }

    @Test
    void adminDemotesAdminToHeadhunterLinkedToHeadhunter() throws Exception {
        String adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        long userId = createUser(adminToken, "demote.role@test.com", "ADMIN");
        Headhunter hh = saveHeadhunter("Pessoa Rebaixada", "outro.email.role@test.com");

        mvc.perform(patchRole(adminToken, userId, Map.of("role", "HEADHUNTER", "headhunterId", hh.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("HEADHUNTER"))
                .andExpect(jsonPath("$.headhunterId").value(hh.getId()));

        String demotedToken = login("demote.role@test.com", "user-pass-1234");
        mvc.perform(get("/api/v1/users").header("Authorization", "Bearer " + demotedToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCannotRemoveOwnAdminRole() throws Exception {
        String adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        long adminId = currentUserId(adminToken);

        mvc.perform(patchRole(adminToken, adminId, Map.of("role", "HEADHUNTER")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Você não pode remover o seu próprio perfil de administrador"));
    }

    @Test
    void headhunterCannotChangeRoles() throws Exception {
        String adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        long userId = createUser(adminToken, "hh.role@test.com", "HEADHUNTER");
        String hhToken = login("hh.role@test.com", "user-pass-1234");

        mvc.perform(patchRole(hhToken, userId, Map.of("role", "ADMIN")))
                .andExpect(status().isForbidden());
    }

    @Test
    void missingRoleReturns400() throws Exception {
        String adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        long userId = createUser(adminToken, "norole.role@test.com", "HEADHUNTER");

        mvc.perform(patchRole(adminToken, userId, Map.of()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unknownUserReturns404() throws Exception {
        String adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);

        mvc.perform(patchRole(adminToken, 999_999L, Map.of("role", "ADMIN")))
                .andExpect(status().isNotFound());
    }

    @Test
    void unknownHeadhunterReturns400() throws Exception {
        String adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        long userId = createUser(adminToken, "badhh.role@test.com", "ADMIN");

        mvc.perform(patchRole(adminToken, userId, Map.of("role", "HEADHUNTER", "headhunterId", 999_999L)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Headhunter não encontrado"));
    }

    private org.springframework.test.web.servlet.RequestBuilder patchRole(
            String token, long userId, Map<String, Object> body) throws Exception {
        return patch("/api/v1/users/{id}/role", userId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body));
    }

    private long createUser(String adminToken, String email, String role) throws Exception {
        String body = mvc.perform(post("/api/v1/users").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email, "fullName", "Usuário Teste",
                                "password", "user-pass-1234", "role", role))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("id").asLong();
    }

    private long currentUserId(String token) throws Exception {
        String body = mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("id").asLong();
    }

    private Headhunter saveHeadhunter(String name, String email) {
        Headhunter hh = new Headhunter(name, email, Headhunter.Seniority.PLENO);
        hh.setFixedCost(BigDecimal.ZERO);
        hh.setVariableCost(BigDecimal.ZERO);
        return headhunterRepository.save(hh);
    }

    private String login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode json = objectMapper.readTree(body);
        return json.get("token").asText();
    }
}
