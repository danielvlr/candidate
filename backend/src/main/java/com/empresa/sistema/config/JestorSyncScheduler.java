package com.empresa.sistema.config;

import com.empresa.sistema.integration.jestor.JestorSyncService;
import com.empresa.sistema.integration.jestor.SyncResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Conditional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Conditional(JestorTokenConfiguredCondition.class)
public class JestorSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(JestorSyncScheduler.class);
    private final JestorSyncService syncService;

    public JestorSyncScheduler(JestorSyncService syncService) {
        this.syncService = syncService;
    }

    // Padrão: 2x ao dia (08h e 18h de Brasília); o Render roda em UTC, por isso o zone explícito.
    @Scheduled(cron = "${jestor.sync-cron:0 0 8,18 * * *}", zone = "${jestor.sync-zone:America/Sao_Paulo}")
    public void scheduledSync() {
        log.info("Starting scheduled Jestor sync...");
        try {
            List<SyncResult> results = syncService.fullSync();
            for (SyncResult r : results) {
                log.info("Sync {}: created={}, updated={}, errors={}",
                    r.getEntity(), r.getCreated(), r.getUpdated(), r.getErrors());
            }
        } catch (Exception e) {
            log.error("Scheduled Jestor sync failed", e);
        }
    }
}
