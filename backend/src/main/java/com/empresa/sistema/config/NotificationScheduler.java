package com.empresa.sistema.config;

import com.empresa.sistema.domain.service.JobService;
import com.empresa.sistema.domain.service.WarrantyNotificationService;
import com.empresa.sistema.domain.service.WarrantyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private final WarrantyService warrantyService;
    private final WarrantyNotificationService warrantyNotificationService;
    private final JobService jobService;

    @Value("${warranty.notification.days-before:10}")
    private int daysBefore;

    @Scheduled(cron = "${warranty.notification.cron:0 0 8 * * MON-FRI}")
    public void checkExpiringWarranties() {
        log.info("Running warranty expiration check...");
        warrantyNotificationService.notifyExpiringWarranties(daysBefore);
    }

    @Scheduled(cron = "${warranty.expiration.cron:0 0 0 * * *}")
    public void expireWarranties() {
        log.info("Running warranty expiration update...");
        warrantyService.expireWarranties();
        jobService.promoteExpiredWarrantyJobs();
    }
}
