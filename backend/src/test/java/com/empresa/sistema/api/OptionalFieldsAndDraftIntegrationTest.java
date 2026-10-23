package com.empresa.sistema.api;

import com.empresa.sistema.domain.entity.Client;
import com.empresa.sistema.domain.entity.Job;
import com.empresa.sistema.domain.repository.ClientRepository;
import com.empresa.sistema.domain.service.GmailEmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Rodada 2 de QA: campos opcionais vazios (BUG-23), erro de PDF (BUG-24) e rascunho de vaga (BUG-25). */
@SpringBootTest(properties = {
        "jestor.api-token=",
        "spring.sql.init.mode=never",
        "app.jwt.secret=integration-test-secret-with-32-bytes-min!!",
        "app.auth.bootstrap-admin.email=admin@test.com",
        "app.auth.bootstrap-admin.password=admin-pass-123"
})
@AutoConfigureMockMvc
@Transactional
class OptionalFieldsAndDraftIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ClientRepository clientRepository;

    @MockBean
    private GmailEmailService emailService;

    @Test
    void createClientWithEmptyCnpjAndZipCodeReturns201() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("companyName", "Empresa Sem CNPJ");
        body.put("cnpj", "");
        body.put("zipCode", "");
        body.put("contactPhone", "");
        body.put("contactPersonName", "Maria");
        body.put("contactEmail", "maria@empresa.test");

        mvc.perform(json(post("/api/v1/clients"), body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cnpj").doesNotExist());
    }

    @Test
    void createClientWithInvalidCnpjStillReturns400() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("companyName", "Empresa CNPJ Ruim");
        body.put("cnpj", "123");
        body.put("contactPersonName", "Maria");
        body.put("contactEmail", "maria2@empresa.test");

        mvc.perform(json(post("/api/v1/clients"), body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.cnpj").exists());
    }

    @Test
    void createCandidateWithEmptyZipCodeReturns201() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("fullName", "Candidato Sem CEP");
        body.put("email", "sem.cep@test.com");
        body.put("zipCode", "");

        mvc.perform(json(post("/api/v1/candidates"), body))
                .andExpect(status().isCreated());
    }

    @Test
    void importLinkedInPdfWithInvalidFileReturnsBusinessErrorMessage() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "perfil.pdf", "application/pdf", "isto nao e um pdf".getBytes());

        mvc.perform(multipart("/api/v1/candidates/import-linkedin-pdf").file(file)
                        .header("Authorization", "Bearer " + login()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("O arquivo enviado não é um PDF válido"));
    }

    @Test
    void createJobAsDraftKeepsDraftStatus() throws Exception {
        Long clientId = saveClient();

        mvc.perform(json(post("/api/v1/jobs"), jobBody(clientId, "DRAFT")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    void createJobWithoutStatusIsActive() throws Exception {
        Long clientId = saveClient();

        mvc.perform(json(post("/api/v1/jobs"), jobBody(clientId, null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void createJobAsClosedIsRejected() throws Exception {
        Long clientId = saveClient();

        mvc.perform(json(post("/api/v1/jobs"), jobBody(clientId, "CLOSED")))
                .andExpect(status().isBadRequest());
    }

    private Map<String, Object> jobBody(Long clientId, String status) {
        Map<String, Object> body = new HashMap<>();
        body.put("title", "Vaga Rascunho");
        body.put("description", "descricao");
        body.put("clientId", clientId);
        if (status != null) {
            body.put("status", status);
        }
        return body;
    }

    private Long saveClient() {
        return clientRepository.save(Client.builder().companyName("ACME").build()).getId();
    }

    private MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder builder, Map<String, Object> body)
            throws Exception {
        return builder
                .header("Authorization", "Bearer " + login())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body));
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
