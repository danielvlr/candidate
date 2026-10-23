package com.empresa.sistema.api;

import com.empresa.sistema.domain.entity.Candidate;
import com.empresa.sistema.domain.entity.Client;
import com.empresa.sistema.domain.entity.Headhunter;
import com.empresa.sistema.domain.entity.Job;
import com.empresa.sistema.domain.repository.CandidateRepository;
import com.empresa.sistema.domain.repository.ClientRepository;
import com.empresa.sistema.domain.repository.HeadhunterRepository;
import com.empresa.sistema.domain.repository.JobRepository;
import com.empresa.sistema.domain.service.GmailEmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * BUG-27: no Postgres, Client.description/notes ({@code @Lob}) viram colunas oid, que só podem ser lidas
 * dentro de transação. O H2 não reproduz, então este teste roda contra um Postgres descartável e é
 * ignorado quando ele não está no ar:
 * {@code docker run -d --rm --name camarmo-f-pg -e POSTGRES_PASSWORD=qa -e POSTGRES_DB=camarmo -p 55434:5432 postgres:16}
 * Sem {@code @Transactional} de propósito: cada requisição precisa abrir e fechar a própria transação.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:postgresql://localhost:55434/camarmo",
        "spring.datasource.driver-class-name=org.postgresql.Driver",
        "spring.datasource.username=postgres",
        "spring.datasource.password=qa",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect",
        "jestor.api-token=",
        "spring.sql.init.mode=never",
        "app.jwt.secret=integration-test-secret-with-32-bytes-min!!",
        "app.auth.bootstrap-admin.email=admin@test.com",
        "app.auth.bootstrap-admin.password=admin-pass-123"
})
@AutoConfigureMockMvc
class ClientLobPostgresIntegrationTest {

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

    @Autowired
    private CandidateRepository candidateRepository;

    @MockBean
    private GmailEmailService emailService;

    @BeforeAll
    static void requirePostgres() {
        Assumptions.assumeTrue(isPostgresUp(), "Postgres de teste indisponível em localhost:55434");
    }

    private static boolean isPostgresUp() {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress("localhost", 55434), 500);
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    @Test
    void closingJobOfClientWithDescriptionAndNotesReturns200AndWarrantyIsReadable() throws Exception {
        Client client = clientRepository.save(Client.builder()
                .companyName("ACME Lob")
                .description("Descrição longa da empresa")
                .notes("Notas internas da empresa")
                .build());
        Headhunter hh = new Headhunter("HH Lob", "hh.lob@test.com", Headhunter.Seniority.PLENO);
        hh.setFixedCost(BigDecimal.ZERO);
        hh.setVariableCost(BigDecimal.ZERO);
        hh = headhunterRepository.save(hh);
        Job job = new Job("Vaga Lob", "descricao", client);
        job.setHeadhunter(hh);
        job.setStatus(Job.JobStatus.ACTIVE);
        job.setGuaranteeDays(90);
        job = jobRepository.save(job);
        Candidate candidate = candidateRepository.save(new Candidate("Ana Lob", "ana.lob@test.com"));
        String token = login();

        mvc.perform(post("/api/v1/jobs/{id}/close", job.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("finalValue", 15000, "approvedCandidateId", candidate.getId()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.client.companyName").value("ACME Lob"));

        mvc.perform(get("/api/v1/warranties/job/{id}", job.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].clientName").value("ACME Lob"))
                .andExpect(jsonPath("$[0].candidateName").value("Ana Lob"));
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
