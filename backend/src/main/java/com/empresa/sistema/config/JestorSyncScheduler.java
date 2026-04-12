package com.empresa.sistema.config;

import com.empresa.sistema.integration.jestor.JestorSyncService;
import com.empresa.sistema.integration.jestor.SyncResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ConditionalOnProperty(name = "jestor.api-token")
public class JestorSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(JestorSyncScheduler.class);
    private final JestorSyncService syncService;

    public JestorSyncScheduler(JestorSyncService syncService) {
        this.syncService = syncService;
    }

    @Scheduled(cron = "${jestor.sync-cron:0 */30 * * * *}")
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
