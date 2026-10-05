package com.empresa.sistema.api;

import com.empresa.sistema.domain.entity.Client;
import com.empresa.sistema.domain.entity.Headhunter;
import com.empresa.sistema.domain.entity.Job;
import com.empresa.sistema.domain.repository.ClientRepository;
import com.empresa.sistema.domain.repository.HeadhunterRepository;
import com.empresa.sistema.domain.repository.JobRepository;
import com.empresa.sistema.domain.service.GmailEmailService;
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

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Fluxo do headhunter logado: as vagas dele aparecem mesmo quando há muitas vagas mais recentes de outros. */
@SpringBootTest(properties = {
        "jestor.api-token=",
        "spring.sql.init.mode=never",
        "app.jwt.secret=integration-test-secret-with-32-bytes-min!!",
        "app.auth.bootstrap-admin.email=admin@test.com",
        "app.auth.bootstrap-admin.password=admin-pass-123"
})
@AutoConfigureMockMvc
@Transactional
class HeadhunterJobsVisibilityIntegrationTest {

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

    @MockBean
    private GmailEmailService emailService;

    @Test
    void loggedHeadhunterSeesOwnJobsBeyondFirstPageOfAllJobs() throws Exception {
        Client client = clientRepository.save(Client.builder().companyName("ACME").build());
        Headhunter devid = saveHeadhunter("Devid Oliveira", "devid.it@test.com");
        Headhunter other = saveHeadhunter("Outra Pessoa", "outra.it@test.com");

        saveJob("Vaga Devid A", client, devid);
        saveJob("Vaga Devid B", client, devid);
        for (int i = 0; i < 5; i++) {
            saveJob("Vaga Outra " + i, client, other);
        }

        String adminToken = login("admin@test.com", "admin-pass-123");
        mvc.perform(post("/api/v1/users").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "devid.it@test.com", "fullName", "Devid Oliveira",
                                "password", "devid-pass-123", "role", "HEADHUNTER",
                                "headhunterId", devid.getId()))))
                .andExpect(status().isCreated());

        String devidToken = login("devid.it@test.com", "devid-pass-123");

        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + devidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("HEADHUNTER"))
                .andExpect(jsonPath("$.headhunterId").value(devid.getId()));

        // Página pequena: antes da correção a 1ª página só trazia vagas de outros e o front filtrava localmente.
        mvc.perform(get("/api/v1/jobs/filter").header("Authorization", "Bearer " + devidToken)
                        .param("headhunterId", String.valueOf(devid.getId()))
                        .param("page", "0").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[*].headhunterId", everyItem(is(devid.getId().intValue()))));
    }

    @Test
    void headhunterCannotSeeAnotherHeadhuntersJobsEvenWhenAskingForThem() throws Exception {
        Client client = clientRepository.save(Client.builder().companyName("ACME").build());
        Headhunter devid = saveHeadhunter("Devid Oliveira", "devid.scope@test.com");
        Headhunter other = saveHeadhunter("Outra Pessoa", "outra.scope@test.com");
        saveJob("Vaga Devid", client, devid);
        saveJob("Vaga Outra 1", client, other);
        saveJob("Vaga Outra 2", client, other);

        // Conta criada sem vínculo: o login vincula pelo e-mail.
        String adminToken = login("admin@test.com", "admin-pass-123");
        mvc.perform(post("/api/v1/users").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "devid.scope@test.com", "fullName", "Devid Oliveira",
                                "password", "devid-pass-123", "role", "HEADHUNTER"))))
                .andExpect(status().isCreated());
        String token = "Bearer " + login("devid.scope@test.com", "devid-pass-123");

        mvc.perform(get("/api/v1/auth/me").header("Authorization", token))
                .andExpect(jsonPath("$.headhunterId").value(devid.getId()));

        mvc.perform(get("/api/v1/jobs/filter").header("Authorization", token)
                        .param("headhunterId", String.valueOf(other.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Vaga Devid"));

        mvc.perform(get("/api/v1/jobs").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));

        mvc.perform(get("/api/v1/jobs/kanban/headhunter/" + other.getId()).header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.*[*].headhunterId", everyItem(is(devid.getId().intValue()))));

        // Admin continua vendo o filtro que pediu.
        mvc.perform(get("/api/v1/jobs/filter").header("Authorization", "Bearer " + adminToken)
                        .param("headhunterId", String.valueOf(other.getId())))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    private Headhunter saveHeadhunter(String name, String email) {
        Headhunter hh = new Headhunter(name, email, Headhunter.Seniority.PLENO);
        hh.setFixedCost(BigDecimal.ZERO);
        hh.setVariableCost(BigDecimal.ZERO);
        return headhunterRepository.save(hh);
    }

    private void saveJob(String title, Client client, Headhunter hh) {
        Job job = new Job(title, "descricao", client);
        job.setHeadhunter(hh);
        jobRepository.save(job);
    }

    private String login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asText();
    }
}
