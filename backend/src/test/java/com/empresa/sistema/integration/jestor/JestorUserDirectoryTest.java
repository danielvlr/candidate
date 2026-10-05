package com.empresa.sistema.integration.jestor;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class JestorUserDirectoryTest {

    static Map<String, Object> user(int id, String name, String email, String type) {
        Map<String, Object> u = new HashMap<>();
        u.put("id_user", id);
        u.put("name", name);
        u.put("display_name", name);
        u.put("email", email);
        u.put("type", type);
        return u;
    }

    static Map<String, Object> record(Map<String, Object> criadoPor, Map<String, Object> atualizadoPor) {
        Map<String, Object> r = new HashMap<>();
        r.put("nome", "qualquer");
        r.put("criado_por", criadoPor);
        r.put("atualizado_por", atualizadoPor);
        return r;
    }

    @Test
    void resolvesEmailByNameIgnoringCaseAccentsAndSpaces() {
        JestorUserDirectory dir = JestorUserDirectory.from(List.of(
            record(user(28, "Devid Oliveira", "devid.oliveira@grupocamarmo.com.br", "standard"),
                   user(1, "Alice Andrade", "AliceAndrade@grupocamarmo.com.br", "standard"))));

        assertThat(dir.findEmailByName("Devid Oliveira")).contains("devid.oliveira@grupocamarmo.com.br");
        assertThat(dir.findEmailByName("  dévid   OLIVEIRA ")).contains("devid.oliveira@grupocamarmo.com.br");
        assertThat(dir.findEmailByName("Alice Andrade")).contains("aliceandrade@grupocamarmo.com.br");
        assertThat(dir.findEmailByName("Flaviana Abreu")).isEmpty();
    }

    @Test
    void derivesNameFromEmailWhenUserNameIsTheEmail() {
        JestorUserDirectory dir = JestorUserDirectory.from(List.of(
            record(user(35, "jullyane.sancho@grupocamarmo.com.br", "jullyane.sancho@grupocamarmo.com.br", "standard"), null)));

        assertThat(dir.findEmailByName("Jullyane Sancho")).contains("jullyane.sancho@grupocamarmo.com.br");
    }

    @Test
    void ignoresAutomationUsersAndAmbiguousNames() {
        JestorUserDirectory dir = JestorUserDirectory.from(List.of(
            record(user(32, "Trick", "trick.user+abc@jestor.com", "trick"), null),
            record(user(40, "Ana Lima", "ana.lima@a.com", "standard"),
                   user(41, "Ana Lima", "ana.lima@b.com", "standard"))));

        assertThat(dir.findEmailByName("Trick")).isEmpty();
        assertThat(dir.findEmailByName("Ana Lima")).isEmpty();
    }

    @Test
    void detectsPlaceholderEmails() {
        assertThat(JestorUserDirectory.isPlaceholderEmail("12@jestor-sync.local")).isTrue();
        assertThat(JestorUserDirectory.isPlaceholderEmail(null)).isTrue();
        assertThat(JestorUserDirectory.isPlaceholderEmail("devid.oliveira@grupocamarmo.com.br")).isFalse();
        assertThat(JestorUserDirectory.placeholderEmail("12")).isEqualTo("12@jestor-sync.local");
    }
}
