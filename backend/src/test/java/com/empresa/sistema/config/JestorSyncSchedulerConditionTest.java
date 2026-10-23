package com.empresa.sistema.config;

import com.empresa.sistema.integration.jestor.JestorSyncService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/** BUG-01: sem token do Jestor a sincronização agendada não pode existir. */
class JestorSyncSchedulerConditionTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withBean(JestorSyncService.class, () -> mock(JestorSyncService.class))
            .withUserConfiguration(JestorSyncScheduler.class);

    @Test
    void schedulerIsOffWhenTokenIsMissing() {
        runner.run(ctx -> assertThat(ctx).doesNotHaveBean(JestorSyncScheduler.class));
    }

    @Test
    void schedulerIsOffWhenTokenIsBlank() {
        runner.withPropertyValues("jestor.api-token=")
                .run(ctx -> assertThat(ctx).doesNotHaveBean(JestorSyncScheduler.class));
        runner.withPropertyValues("jestor.api-token=   ")
                .run(ctx -> assertThat(ctx).doesNotHaveBean(JestorSyncScheduler.class));
    }

    @Test
    void schedulerIsOnWhenTokenIsConfigured() {
        runner.withPropertyValues("jestor.api-token=token-de-teste")
                .run(ctx -> assertThat(ctx).hasSingleBean(JestorSyncScheduler.class));
    }
}
