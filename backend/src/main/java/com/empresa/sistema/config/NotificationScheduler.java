package com.empresa.sistema.config;

import com.empresa.sistema.domain.entity.Headhunter;
import com.empresa.sistema.domain.entity.Warranty;
import com.empresa.sistema.domain.service.EmailService;
import com.empresa.sistema.domain.service.WarrantyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private final WarrantyService warrantyService;
    private final EmailService emailService;

    @Value("${warranty.notification.days-before:10}")
    private int daysBefore;

    @Scheduled(cron = "${warranty.notification.cron:0 0 8 * * MON-FRI}")
    public void checkExpiringWarranties() {
        log.info("Running warranty expiration check...");
        List<Warranty> expiring = warrantyService.findExpiringWarranties(daysBefore);

        int sent = 0;
        int failed = 0;

        for (Warranty warranty : expiring) {
            try {
                String recipientEmail = resolveRecipientEmail(warranty);
                String recipientName = resolveRecipientName(warranty);

                long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), warranty.getEndDate());

                String clientName = warranty.getJob().getClient().getCompanyName();
                String contactPersonName = warranty.getJob().getClient().getContactPersonName();
                String contactEmail = warranty.getJob().getClient().getContactEmail();

                String candidateName = warranty.getJobApplication().getCandidate().getFullName();

                emailService.sendWarrantyExpirationAlert(
                        recipientEmail,
                        recipientName,
                        warranty.getJob().getTitle(),
                        clientName,
                        candidateName,
                        contactPersonName,
                        contactEmail,
                        warranty.getEndDate(),
                        daysRemaining,
                        warranty.getServiceCategory() != null ? warranty.getServiceCategory().name() : "N/A",
                        warranty.getGuaranteeDays()
                );

                warrantyService.markNotificationSent(warranty.getId());
                sent++;
            } catch (Exception e) {
                log.error("Failed to process warranty {}: {}", warranty.getId(), e.getMessage());
                failed++;
            }
        }

        log.info("Warranty check completed: {} sent, {} failed out of {} expiring", sent, failed, expiring.size());
    }

    @Scheduled(cron = "${warranty.expiration.cron:0 0 0 * * *}")
    public void expireWarranties() {
        log.info("Running warranty expiration update...");
        warrantyService.expireWarranties();
    }

    private String resolveRecipientEmail(Warranty warranty) {
        Headhunter headhunter = warranty.getHeadhunter();
        if (headhunter != null && headhunter.getEmail() != null
                && headhunter.getStatus() != Headhunter.HeadhunterStatus.INACTIVE) {
            return headhunter.getEmail();
        }
        log.warn("Headhunter inactive or not found for warranty {}, using fallback", warranty.getId());
        return "admin@camarmo.com.br";
    }

    private String resolveRecipientName(Warranty warranty) {
        Headhunter headhunter = warranty.getHeadhunter();
        if (headhunter != null && headhunter.getFullName() != null) {
            return headhunter.getFullName();
        }
        return "Administrador";
    }
}
