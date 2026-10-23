package com.empresa.sistema.api;

import com.empresa.sistema.domain.entity.Client;
import com.empresa.sistema.domain.entity.Headhunter;
import com.empresa.sistema.domain.entity.Job;
import com.empresa.sistema.domain.repository.ClientRepository;
import com.empresa.sistema.domain.repository.HeadhunterRepository;
import com.empresa.sistema.domain.repository.JobRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.RequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Criar e editar vaga permite atribuir o headhunter responsável, categoria, valor e garantia. */
@SpringBootTest(properties = {
        "jestor.api-token=",
        "spring.sql.init.mode=never",
        "app.jwt.secret=integration-test-secret-with-32-bytes-min!!",
        "app.auth.bootstrap-admin.email=admin@test.com",
        "app.auth.bootstrap-admin.password=admin-pass-123"
})
@AutoConfigureMockMvc
@Transactional
class JobHeadhunterAssignmentIntegrationTest {

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

    @Test
    void createJobWithHeadhunterPersistsAssignmentAndCommercialFields() throws Exception {
        Client client = saveClient();
        Headhunter hh = saveHeadhunter("assign.create@test.com");

        String response = mvc.perform(create(createBody(client.getId(), hh.getId())))
                .andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$.headhunterId").value(hh.getId()))
                .andExpect(jsonPath("$.serviceCategory").value("PROJETOS"))
                .andExpect(jsonPath("$.guaranteeDays").value(60))
                .andReturn().getResponse().getContentAsString();

        Long jobId = objectMapper.readTree(response).get("id").asLong();
        Job saved = jobRepository.findById(jobId).orElseThrow();
        assertThat(saved.getHeadhunter().getId()).isEqualTo(hh.getId());
        assertThat(saved.getJobValue()).isEqualByComparingTo(new BigDecimal("12000"));
    }

    @Test
    void createJobWithoutHeadhunterStillWorks() throws Exception {
        Client client = saveClient();

        mvc.perform(create(createBody(client.getId(), null)))
                .andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$.headhunterId").doesNotExist());
    }

    @Test
    void createJobWithUnknownHeadhunterReturns400() throws Exception {
        Client client = saveClient();

        mvc.perform(create(createBody(client.getId(), 999_999L)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateJobAssignsHeadhunterAndKeepsItWhenOmitted() throws Exception {
        Client client = saveClient();
        Headhunter hh = saveHeadhunter("assign.update@test.com");
        Job job = jobRepository.save(new Job("Vaga Edicao", "descricao", client));

        mvc.perform(update(job.getId(), Map.of("headhunterId", hh.getId(), "serviceCategory", "TATICAS")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headhunterId").value(hh.getId()))
                .andExpect(jsonPath("$.serviceCategory").value("TATICAS"));

        mvc.perform(update(job.getId(), Map.of("title", "Titulo novo")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Titulo novo"))
                .andExpect(jsonPath("$.headhunterId").value(hh.getId()));
    }

    @Test
    void updateJobWithUnknownHeadhunterReturns400() throws Exception {
        Client client = saveClient();
        Job job = jobRepository.save(new Job("Vaga Edicao 2", "descricao", client));

        mvc.perform(update(job.getId(), Map.of("headhunterId", 999_999L)))
                .andExpect(status().isBadRequest());
    }

    private Map<String, Object> createBody(Long clientId, Long headhunterId) {
        Map<String, Object> body = new HashMap<>();
        body.put("title", "Vaga Atribuida");
        body.put("description", "descricao");
        body.put("clientId", clientId);
        body.put("serviceCategory", "PROJETOS");
        body.put("jobValue", 12000);
        body.put("guaranteeDays", 60);
        if (headhunterId != null) {
            body.put("headhunterId", headhunterId);
        }
        return body;
    }

    private RequestBuilder create(Map<String, Object> body) throws Exception {
        return post("/api/v1/jobs")
                .header("Authorization", "Bearer " + login())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body));
    }

    private RequestBuilder update(Long jobId, Map<String, Object> body) throws Exception {
        return put("/api/v1/jobs/{id}", jobId)
                .header("Authorization", "Bearer " + login())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body));
    }

    private Client saveClient() {
        return clientRepository.save(Client.builder().companyName("ACME").build());
    }

    private Headhunter saveHeadhunter(String email) {
        Headhunter hh = new Headhunter("HH Atribuicao", email, Headhunter.Seniority.PLENO);
        hh.setFixedCost(BigDecimal.ZERO);
        hh.setVariableCost(BigDecimal.ZERO);
        return headhunterRepository.save(hh);
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
