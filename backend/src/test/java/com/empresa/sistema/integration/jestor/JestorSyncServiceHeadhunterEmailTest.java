package com.empresa.sistema.integration.jestor;

import com.empresa.sistema.config.JestorConfig;
import com.empresa.sistema.domain.entity.Headhunter;
import com.empresa.sistema.domain.repository.*;
import com.empresa.sistema.domain.service.InvitationTokenService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.*;

import static com.empresa.sistema.integration.jestor.JestorUserDirectoryTest.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class JestorSyncServiceHeadhunterEmailTest {

    private static final String HH_TABLE = "hh_table";
    private static final String JOBS_TABLE = "jobs_table";

    private JestorClient jestorClient;
    private HeadhunterRepository headhunterRepository;
    private JestorSyncService service;

    @BeforeEach
    void setUp() {
        jestorClient = mock(JestorClient.class);
        headhunterRepository = mock(HeadhunterRepository.class);
        InvitationTokenService tokenService = mock(InvitationTokenService.class);
        when(tokenService.maskEmail(anyString())).thenReturn("***");

        JestorConfig config = new JestorConfig();
        config.setHeadhuntersTable(HH_TABLE);
        config.setJobsTable(JOBS_TABLE);

        service = new JestorSyncService(jestorClient, config,
            mock(JobRepository.class), mock(ClientRepository.class), mock(CandidateRepository.class),
            headhunterRepository, mock(WarrantyRuleRepository.class), mock(CandidateStatusLogRepository.class),
            mock(JobHistoryRepository.class), mock(JobApplicationRepository.class), mock(SyncLogRepository.class),
            new ObjectMapper(), tokenService);
    }

    private static Map<String, Object> hhRecord(int id, String nome, Map<String, Object> criadoPor) {
        Map<String, Object> r = new HashMap<>();
        r.put("id_" + HH_TABLE, id);
        r.put("name", String.valueOf(id));
        r.put("nome", nome);
        r.put("funcao", "Headhunter");
        r.put("criado_por", criadoPor);
        return r;
    }

    private static Map<String, Object> jobRecord(Map<String, Object> criadoPor) {
        Map<String, Object> r = new HashMap<>();
        r.put("id_" + JOBS_TABLE, 1);
        r.put("criado_por", criadoPor);
        return r;
    }

    private static Headhunter existing(Long id, String jestorId, String name, String email) {
        Headhunter h = new Headhunter(name, email, Headhunter.Seniority.PLENO);
        h.setId(id);
        h.setJestorId(jestorId);
        return h;
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> emailsSavedByName() {
        ArgumentCaptor<List<Headhunter>> captor = ArgumentCaptor.forClass(List.class);
        verify(headhunterRepository).saveAll(captor.capture());
        Map<String, String> out = new HashMap<>();
        captor.getValue().forEach(h -> out.put(h.getFullName(), h.getEmail()));
        return out;
    }

    @Test
    void resolvesHeadhunterEmailsFromJestorUsersInsteadOfPlaceholder() {
        Map<String, Object> alice = user(1, "Alice Andrade", "aliceandrade@grupocamarmo.com.br", "standard");
        Map<String, Object> ana = user(29, "Ana Siqueira", "ana.siqueira@grupocamarmo.com.br", "standard");
        when(jestorClient.listAllRecords(HH_TABLE)).thenReturn(List.of(
            hhRecord(12, "Devid Oliveira", alice),
            hhRecord(6, "Ana Siqueira", alice),
            hhRecord(29, "Flaviana Abreu", alice)));
        when(jestorClient.listAllRecords(JOBS_TABLE)).thenReturn(List.of(
            jobRecord(user(28, "Devid Oliveira", "devid.oliveira@grupocamarmo.com.br", "standard")),
            jobRecord(ana)));
        when(headhunterRepository.findAll()).thenReturn(new ArrayList<>(List.of(
            existing(10L, "12", "Devid Oliveira", "12@jestor-sync.local"))));

        SyncResult result = service.syncHeadhunters();

        assertThat(result.getErrors()).isZero();
        Map<String, String> emails = emailsSavedByName();
        assertThat(emails).containsEntry("Devid Oliveira", "devid.oliveira@grupocamarmo.com.br");
        assertThat(emails).containsEntry("Ana Siqueira", "ana.siqueira@grupocamarmo.com.br");
        assertThat(emails).containsEntry("Flaviana Abreu", "29@jestor-sync.local");
    }

    @Test
    void keepsManualEmailWhenNoJestorUserMatchesAndSkipsConflictingEmail() {
        Map<String, Object> devid = user(28, "Devid Oliveira", "devid.oliveira@grupocamarmo.com.br", "standard");
        when(jestorClient.listAllRecords(HH_TABLE)).thenReturn(List.of(
            hhRecord(12, "Devid Oliveira", devid),
            hhRecord(21, "Paulo Teixeira", devid)));
        when(jestorClient.listAllRecords(JOBS_TABLE)).thenReturn(List.of());
        when(headhunterRepository.findAll()).thenReturn(new ArrayList<>(List.of(
            existing(1L, null, "Devid (manual)", "devid.oliveira@grupocamarmo.com.br"),
            existing(10L, "12", "Devid Oliveira", "12@jestor-sync.local"),
            existing(11L, "21", "Paulo Teixeira", "paulo@externo.com"))));

        service.syncHeadhunters();

        Map<String, String> emails = emailsSavedByName();
        assertThat(emails).containsEntry("Devid Oliveira", "12@jestor-sync.local");
        assertThat(emails).containsEntry("Paulo Teixeira", "paulo@externo.com");
    }
}
