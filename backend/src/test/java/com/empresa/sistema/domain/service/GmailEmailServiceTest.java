package com.empresa.sistema.domain.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GmailEmailServiceTest {

    @Test
    void categoryLabelTranslatesKnownCategories() {
        assertThat(GmailEmailService.categoryLabel("NOSSO_HEADHUNTER")).isEqualTo("Nosso Headhunter");
        assertThat(GmailEmailService.categoryLabel("PROJETOS")).isEqualTo("Projetos");
        assertThat(GmailEmailService.categoryLabel("TATICAS")).isEqualTo("Táticas");
        assertThat(GmailEmailService.categoryLabel("EXECUTIVAS")).isEqualTo("Executivas");
    }

    @Test
    void categoryLabelFallsBackForUnknownOrMissing() {
        assertThat(GmailEmailService.categoryLabel(null)).isEqualTo("N/A");
        assertThat(GmailEmailService.categoryLabel("N/A")).isEqualTo("N/A");
        assertThat(GmailEmailService.categoryLabel("OUTRA_COISA")).isEqualTo("OUTRA_COISA");
    }
}
