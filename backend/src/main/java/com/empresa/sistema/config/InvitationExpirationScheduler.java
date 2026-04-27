package com.empresa.sistema.config;

import com.empresa.sistema.domain.service.CandidateInvitationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class InvitationExpirationScheduler {

    private final CandidateInvitationService invitationService;

    @Scheduled(cron = "${invitation.expiration.cron:0 0 3 * * *}")
    public void expirePendingInvitations() {
        try {
            int count = invitationService.expirePendingInvitations();
            log.info("scheduled_invitation_expiration_completed expired_count={}", count);
        } catch (Exception e) {
            log.error("scheduled_invitation_expiration_failed", e);
        }
    }
}
