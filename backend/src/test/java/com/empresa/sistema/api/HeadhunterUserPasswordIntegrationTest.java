package com.empresa.sistema.api;

import com.empresa.sistema.domain.entity.AppUser;
import com.empresa.sistema.domain.entity.Headhunter;
import com.empresa.sistema.domain.repository.AppUserRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Criação de usuário junto com o headhunter, senha definida pelo admin e troca obrigatória/própria de senha. */
@SpringBootTest(properties = {
        "jestor.api-token=",
        "spring.sql.init.mode=never",
        "app.jwt.secret=integration-test-secret-with-32-bytes-min!!",
        "app.auth.bootstrap-admin.email=admin@test.com",
        "app.auth.bootstrap-admin.password=admin-pass-123"
})
@AutoConfigureMockMvc
@Transactional
class HeadhunterUserPasswordIntegrationTest {

    private static final String ADMIN_EMAIL = "admin@test.com";
    private static final String ADMIN_PASSWORD = "admin-pass-123";
    private static final String TEMP_PASSWORD = "senha-inicial-123";
    private static final String NEW_PASSWORD = "senha-nova-4567";

    @Autowired
    private MockMvc mvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private HeadhunterRepository headhunterRepository;
    @Autowired
    private AppUserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private GmailEmailService emailService;

    // ---------- criação do headhunter cria o usuário ----------

    @Test
    void creatingHeadhunterCreatesLinkedUserWithMustChangeFlag() throws Exception {
        String adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD).get("token").asText();

        long hhId = createHeadhunter(adminToken, "novo.hh@test.com", TEMP_PASSWORD)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.hasAccess").value(true))
                .andReturn().getResponse().getContentAsString().transform(this::idOf);

        AppUser user = userRepository.findByEmailIgnoreCase("novo.hh@test.com").orElseThrow();
        assertThat(user.getRole()).isEqualTo(AppUser.UserRole.HEADHUNTER);
        assertThat(user.getHeadhunterId()).isEqualTo(hhId);
        assertThat(user.isActive()).isTrue();
        assertThat(user.isMustChangePassword()).isTrue();
        assertThat(passwordEncoder.matches(TEMP_PASSWORD, user.getPasswordHash())).isTrue();
        assertThat(login("novo.hh@test.com", TEMP_PASSWORD).at("/user/mustChangePassword").asBoolean()).isTrue();
    }

    @Test
    void creatingHeadhunterRequiresInitialPasswordFollowingThePolicy() throws Exception {
        String adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD).get("token").asText();

        createHeadhunter(adminToken, "sem.senha@test.com", null).andExpect(status().isBadRequest());
        createHeadhunter(adminToken, "senha.curta@test.com", "curta").andExpect(status().isBadRequest());
        assertThat(headhunterRepository.existsByEmail("sem.senha@test.com")).isFalse();
    }

    @Test
    void existingUnlinkedUserWithSameEmailIsLinkedWithoutDuplicating() throws Exception {
        String adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD).get("token").asText();
        AppUser existing = userRepository.save(AppUser.builder().email("ja.existe@test.com").fullName("Já Existe")
                .passwordHash(passwordEncoder.encode("senha-antiga-123")).role(AppUser.UserRole.HEADHUNTER)
                .active(true).build());

        long hhId = createHeadhunter(adminToken, "ja.existe@test.com", TEMP_PASSWORD)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString().transform(this::idOf);

        AppUser linked = userRepository.findByEmailIgnoreCase("ja.existe@test.com").orElseThrow();
        assertThat(linked.getId()).isEqualTo(existing.getId());
        assertThat(linked.getHeadhunterId()).isEqualTo(hhId);
        assertThat(passwordEncoder.matches("senha-antiga-123", linked.getPasswordHash())).isTrue();
        assertThat(linked.isMustChangePassword()).isFalse();
    }

    @Test
    void existingUserLinkedToAnotherHeadhunterReturns400() throws Exception {
        String adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD).get("token").asText();
        Headhunter other = saveHeadhunter("Outro HH", "outro.hh@test.com");
        userRepository.save(AppUser.builder().email("ocupado@test.com").fullName("Ocupado")
                .passwordHash(passwordEncoder.encode("senha-antiga-123")).role(AppUser.UserRole.HEADHUNTER)
                .headhunterId(other.getId()).active(true).build());

        createHeadhunter(adminToken, "ocupado@test.com", TEMP_PASSWORD)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "Já existe um usuário com este e-mail vinculado a outro headhunter"));
    }

    // ---------- admin altera a senha ----------

    @Test
    void adminSetsUserPasswordAndForcesChange() throws Exception {
        String adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD).get("token").asText();
        AppUser target = saveUser("alvo.user@test.com", AppUser.UserRole.CPARTNER, null);

        patchJson("/api/v1/users/" + target.getId() + "/password", adminToken, Map.of("newPassword", NEW_PASSWORD))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword").value(true));

        assertThat(login("alvo.user@test.com", NEW_PASSWORD).at("/user/mustChangePassword").asBoolean()).isTrue();
    }

    @Test
    void adminSetsPasswordOfHeadhunterWithAccess() throws Exception {
        String adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD).get("token").asText();
        Headhunter hh = saveHeadhunter("Com Acesso", "com.acesso@test.com");
        saveUser("com.acesso@test.com", AppUser.UserRole.HEADHUNTER, hh.getId());

        patchJson("/api/v1/headhunters/" + hh.getId() + "/password", adminToken, Map.of("newPassword", NEW_PASSWORD))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessCreated").value(false))
                .andExpect(jsonPath("$.user.mustChangePassword").value(true));

        assertThat(login("com.acesso@test.com", NEW_PASSWORD).at("/user/headhunterId").asLong()).isEqualTo(hh.getId());
    }

    @Test
    void adminSetsPasswordOfLegacyHeadhunterCreatingAccess() throws Exception {
        String adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD).get("token").asText();
        Headhunter hh = saveHeadhunter("Sem Acesso", "sem.acesso@test.com");

        mvc.perform(get("/api/v1/headhunters/{id}", hh.getId()).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasAccess").value(false));

        patchJson("/api/v1/headhunters/" + hh.getId() + "/password", adminToken, Map.of("newPassword", NEW_PASSWORD))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessCreated").value(true))
                .andExpect(jsonPath("$.user.role").value("HEADHUNTER"))
                .andExpect(jsonPath("$.user.headhunterId").value(hh.getId()));

        AppUser created = userRepository.findFirstByHeadhunterId(hh.getId()).orElseThrow();
        assertThat(created.isMustChangePassword()).isTrue();
        mvc.perform(get("/api/v1/headhunters").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[?(@.id==" + hh.getId() + ")].hasAccess").value(true));
    }

    @Test
    void headhunterAndCpartnerCannotUseAdminPasswordEndpoints() throws Exception {
        Headhunter hh = saveHeadhunter("Alvo HH", "alvo.hh@test.com");
        AppUser hhUser = saveUser("hh.user@test.com", AppUser.UserRole.HEADHUNTER, hh.getId());
        saveUser("cp.user@test.com", AppUser.UserRole.CPARTNER, null);

        for (String email : new String[]{"hh.user@test.com", "cp.user@test.com"}) {
            String token = login(email, TEMP_PASSWORD).get("token").asText();
            patchJson("/api/v1/users/" + hhUser.getId() + "/password", token, Map.of("newPassword", NEW_PASSWORD))
                    .andExpect(status().isForbidden());
            patchJson("/api/v1/headhunters/" + hh.getId() + "/password", token, Map.of("newPassword", NEW_PASSWORD))
                    .andExpect(status().isForbidden());
        }
    }

    // ---------- troca obrigatória e troca da própria senha ----------

    @Test
    void mustChangeFlagBlocksEndpointsExceptMeAndChangePassword() throws Exception {
        saveUserWithFlag("flag@test.com");
        String token = login("flag@test.com", TEMP_PASSWORD).get("token").asText();

        mvc.perform(get("/api/v1/headhunters").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("PASSWORD_CHANGE_REQUIRED"));
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword").value(true));
        changePassword(token, TEMP_PASSWORD, NEW_PASSWORD).andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword").value(false));
    }

    @Test
    void changePasswordWithWrongCurrentPasswordReturns400() throws Exception {
        saveUserWithFlag("errada@test.com");
        String token = login("errada@test.com", TEMP_PASSWORD).get("token").asText();

        changePassword(token, "senha-errada-999", NEW_PASSWORD)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("A senha atual está incorreta"));
        mvc.perform(get("/api/v1/headhunters").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void changePasswordRejectsSamePasswordAndWeakPassword() throws Exception {
        saveUserWithFlag("igual@test.com");
        String token = login("igual@test.com", TEMP_PASSWORD).get("token").asText();

        changePassword(token, TEMP_PASSWORD, TEMP_PASSWORD).andExpect(status().isBadRequest());
        changePassword(token, TEMP_PASSWORD, "curta").andExpect(status().isBadRequest());
    }

    @Test
    void changePasswordTurnsOffFlagAndReleasesEndpoints() throws Exception {
        saveUserWithFlag("libera@test.com");
        String token = login("libera@test.com", TEMP_PASSWORD).get("token").asText();

        changePassword(token, TEMP_PASSWORD, NEW_PASSWORD).andExpect(status().isOk());

        mvc.perform(get("/api/v1/headhunters").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        assertThat(login("libera@test.com", NEW_PASSWORD).at("/user/mustChangePassword").asBoolean()).isFalse();
    }

    @Test
    void anyRoleCanChangeOwnPasswordWithoutFlag() throws Exception {
        saveUser("cp.proprio@test.com", AppUser.UserRole.CPARTNER, null);
        String token = login("cp.proprio@test.com", TEMP_PASSWORD).get("token").asText();

        changePassword(token, TEMP_PASSWORD, NEW_PASSWORD).andExpect(status().isOk());
        login("cp.proprio@test.com", NEW_PASSWORD);
    }

    // ---------- helpers ----------

    private ResultActions createHeadhunter(String token, String email, String initialPassword) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("fullName", "Headhunter Teste");
        body.put("email", email);
        body.put("seniority", "PLENO");
        body.put("fixedCost", 0);
        body.put("variableCost", 0);
        if (initialPassword != null) {
            body.put("initialPassword", initialPassword);
        }
        return mvc.perform(post("/api/v1/headhunters").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(body)));
    }

    private ResultActions patchJson(String url, String token, Map<String, Object> body) throws Exception {
        return mvc.perform(patch(url).header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(body)));
    }

    private ResultActions changePassword(String token, String current, String next) throws Exception {
        return mvc.perform(post("/api/v1/auth/change-password").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("currentPassword", current, "newPassword", next))));
    }

    private long idOf(String json) {
        try {
            return objectMapper.readTree(json).get("id").asLong();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private AppUser saveUser(String email, AppUser.UserRole role, Long headhunterId) {
        return userRepository.save(AppUser.builder().email(email).fullName("Usuário Teste")
                .passwordHash(passwordEncoder.encode(TEMP_PASSWORD)).role(role).headhunterId(headhunterId)
                .active(true).build());
    }

    private void saveUserWithFlag(String email) {
        AppUser user = saveUser(email, AppUser.UserRole.ADMIN, null);
        userRepository.save(user.toBuilder().mustChangePassword(true).build());
    }

    private Headhunter saveHeadhunter(String name, String email) {
        Headhunter hh = new Headhunter(name, email, Headhunter.Seniority.PLENO);
        hh.setFixedCost(BigDecimal.ZERO);
        hh.setVariableCost(BigDecimal.ZERO);
        return headhunterRepository.save(hh);
    }

    private JsonNode login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body);
    }
}
