package com.empresa.sistema.api;

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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Valida a cadeia de segurança real: endpoints protegidos, login JWT e rotas públicas. */
@SpringBootTest(properties = {
        "jestor.api-token=",
        "spring.sql.init.mode=never",
        "app.jwt.secret=integration-test-secret-with-32-bytes-min!!",
        "app.auth.bootstrap-admin.email=admin@test.com",
        "app.auth.bootstrap-admin.password=admin-pass-123"
})
@AutoConfigureMockMvc
class AuthSecurityIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GmailEmailService emailService;

    @Test
    void protectedEndpointWithoutTokenReturns401Json() throws Exception {
        mvc.perform(get("/api/v1/candidates"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void protectedEndpointWithInvalidTokenReturns401() throws Exception {
        mvc.perform(get("/api/v1/candidates").header("Authorization", "Bearer lixo.lixo.lixo"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginWithBootstrapAdminGrantsAccess() throws Exception {
        String token = login("admin@test.com", "admin-pass-123");

        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("admin@test.com"))
                .andExpect(jsonPath("$.role").value("ADMIN"));

        mvc.perform(get("/api/v1/candidates").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mvc.perform(get("/api/v1/users").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void nonAdminCannotManageUsers() throws Exception {
        String adminToken = login("admin@test.com", "admin-pass-123");
        mvc.perform(post("/api/v1/users").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"hh@test.com","fullName":"HH","password":"hh-pass-1234","role":"HEADHUNTER"}
                                """))
                .andExpect(status().isCreated());

        String hhToken = login("hh@test.com", "hh-pass-1234");

        mvc.perform(get("/api/v1/users").header("Authorization", "Bearer " + hhToken))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/candidates").header("Authorization", "Bearer " + hhToken))
                .andExpect(status().isOk());
    }

    @Test
    void loginWithWrongPasswordReturns401() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@test.com\",\"password\":\"errada\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Email ou senha inválidos"));
    }

    @Test
    void forgotPasswordIsPublicAndDoesNotRevealAccounts() throws Exception {
        mvc.perform(post("/api/v1/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"naoexiste@test.com\"}"))
                .andExpect(status().isAccepted());

        mvc.perform(post("/api/v1/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@test.com\"}"))
                .andExpect(status().isAccepted());

        verify(emailService).sendPasswordReset(eq("admin@test.com"), anyString(), anyString(), anyLong());
    }

    @Test
    void resetPasswordWithInvalidTokenReturns400() throws Exception {
        mvc.perform(post("/api/v1/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"invalido\",\"newPassword\":\"nova-senha-123\"}"))
                .andExpect(status().isBadRequest());

        mvc.perform(get("/api/v1/auth/reset-password/validate").param("token", "invalido"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(false));
    }

    @Test
    void publicEndpointsStayOpen() throws Exception {
        mvc.perform(get("/api/health")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/public/invitations/qualquer")).andExpect(status().is(not401()));
    }

    private static org.hamcrest.Matcher<Integer> not401() {
        return org.hamcrest.Matchers.not(401);
    }

    private String login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode json = objectMapper.readTree(body);
        return json.get("token").asText();
    }
}
