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

import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** BUG-06: erros do cliente viram 4xx e nenhuma resposta expõe detalhes internos (tipos Java, assinaturas). */
@SpringBootTest(properties = {
        "jestor.api-token=",
        "spring.sql.init.mode=never",
        "app.jwt.secret=integration-test-secret-with-32-bytes-min!!",
        "app.auth.bootstrap-admin.email=admin@test.com",
        "app.auth.bootstrap-admin.password=admin-pass-123"
})
@AutoConfigureMockMvc
class ApiErrorHandlingIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GmailEmailService emailService;

    private String token;

    @BeforeEach
    void setUp() throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", "admin@test.com", "password", "admin-pass-123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        token = "Bearer " + objectMapper.readTree(body).get("token").asText();
    }

    @Test
    void invalidPathVariableTypeReturns400WithoutJavaDetails() throws Exception {
        mvc.perform(get("/api/v1/headhunters/new").header("Authorization", token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message", not(containsString("java.lang"))));
    }

    @Test
    void invalidQueryParamTypeReturns400() throws Exception {
        mvc.perform(get("/api/v1/jobs/filter").param("minSalary", "abc").header("Authorization", token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void missingBodyReturns400WithoutMethodSignature() throws Exception {
        mvc.perform(patch("/api/v1/jobs/1/status").header("Authorization", token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", not(containsString("ResponseEntity"))))
                .andExpect(jsonPath("$.message", not(containsString("JobController"))));
    }

    @Test
    void malformedJsonReturns400() throws Exception {
        mvc.perform(patch("/api/v1/jobs/1/status").header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content("{nao-e-json"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void missingRequiredParamReturns400() throws Exception {
        mvc.perform(get("/api/v1/jobs/search").header("Authorization", token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void unknownRouteReturns404() throws Exception {
        mvc.perform(get("/api/v1/rota-que-nao-existe").header("Authorization", token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void unsupportedMethodReturns405() throws Exception {
        mvc.perform(post("/api/v1/jobs/search").header("Authorization", token))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.status").value(405));
    }
}
