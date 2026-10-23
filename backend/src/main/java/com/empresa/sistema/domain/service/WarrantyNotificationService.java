package com.empresa.sistema.domain.service;

import com.empresa.sistema.domain.entity.Client;
import com.empresa.sistema.domain.entity.Headhunter;
import com.empresa.sistema.domain.entity.Warranty;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Alerta de garantia perto do vencimento. Por enquanto o e-mail vai somente para o headhunter da garantia.
 * Transacional: as associações LAZY (vaga, cliente, headhunter, candidato) são lidas durante o envio.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class WarrantyNotificationService {

    private final WarrantyService warrantyService;
    private final EmailService emailService;

    public NotificationSummary notifyExpiringWarranties(int daysBefore) {
        List<Warranty> expiring = warrantyService.findExpiringWarranties(daysBefore);
        int sent = 0;
        int skipped = 0;
        int failed = 0;

        for (Warranty warranty : expiring) {
            Headhunter headhunter = warranty.getHeadhunter();
            if (!canReceive(headhunter)) {
                log.warn("Garantia {} sem headhunter ativo com e-mail; alerta não enviado", warranty.getId());
                skipped++;
                continue;
            }
            try {
                send(warranty, headhunter);
                warrantyService.markNotificationSent(warranty.getId());
                sent++;
            } catch (Exception e) {
                log.error("Falha ao enviar alerta da garantia {}: {}", warranty.getId(), e.getMessage());
                failed++;
            }
        }

        log.info("Alertas de garantia: {} enviados, {} ignorados, {} com falha de {} expirando",
                sent, skipped, failed, expiring.size());
        return new NotificationSummary(sent, skipped, failed);
    }

    private static boolean canReceive(Headhunter headhunter) {
        return headhunter != null
                && headhunter.getEmail() != null
                && !headhunter.getEmail().isBlank()
                && headhunter.getStatus() != Headhunter.HeadhunterStatus.INACTIVE;
    }

    private void send(Warranty warranty, Headhunter headhunter) {
        Client client = warranty.getJob().getClient();
        long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), warranty.getEndDate());
        emailService.sendWarrantyExpirationAlert(
                headhunter.getEmail(),
                headhunter.getFullName(),
                warranty.getJob().getTitle(),
                client != null ? client.getCompanyName() : "N/A",
                warranty.getJobApplication().getCandidate().getFullName(),
                client != null ? client.getContactPersonName() : null,
                client != null ? client.getContactEmail() : null,
                warranty.getEndDate(),
                daysRemaining,
                warranty.getServiceCategory() != null ? warranty.getServiceCategory().name() : "N/A",
                warranty.getGuaranteeDays());
    }

    public record NotificationSummary(int sent, int skipped, int failed) {
    }
}
