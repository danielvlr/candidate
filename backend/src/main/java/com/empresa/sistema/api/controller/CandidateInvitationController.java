package com.empresa.sistema.api.controller;

import com.empresa.sistema.security.AuthenticatedUser;
import com.empresa.sistema.security.HeadhunterScope;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.empresa.sistema.api.dto.request.InviteCandidateRequest;
import com.empresa.sistema.api.dto.response.CandidateResponse;
import com.empresa.sistema.api.dto.response.InvitationCreatedResponse;
import com.empresa.sistema.domain.service.CandidateApprovalService;
import com.empresa.sistema.domain.service.CandidateInvitationService;
import com.empresa.sistema.domain.service.GmailEmailService;
import com.empresa.sistema.domain.service.InvitationTokenService;
import com.empresa.sistema.domain.service.result.InvitationCreatedResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/candidate-invitations")
@RequiredArgsConstructor
@Slf4j
public class CandidateInvitationController {

    private final CandidateInvitationService invitationService;
    private final CandidateApprovalService approvalService;
    private final InvitationTokenService tokenService;
    private final GmailEmailService emailService;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @PostMapping
    public ResponseEntity<InvitationCreatedResponse> invite(
            @Valid @RequestBody InviteCandidateRequest req,
            @RequestHeader(value = "X-Headhunter-Id") Long headhunterId,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        InvitationCreatedResult result = invitationService.invitePersist(req, HeadhunterScope.resolve(principal, headhunterId));
        return sendAndRespond(result);
    }

    @PostMapping("/resend")
    public ResponseEntity<InvitationCreatedResponse> resend(
            @RequestParam Long candidateId,
            @RequestHeader(value = "X-Headhunter-Id") Long headhunterId,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        InvitationCreatedResult result = invitationService.resend(candidateId, HeadhunterScope.resolve(principal, headhunterId));
        return sendAndRespond(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> revoke(
            @PathVariable Long id,
            @RequestHeader(value = "X-Headhunter-Id") Long headhunterId,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        invitationService.revoke(id, HeadhunterScope.resolve(principal, headhunterId));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/candidates/{candidateId}/approve")
    public ResponseEntity<CandidateResponse> approve(
            @PathVariable Long candidateId,
            @RequestHeader(value = "X-Headhunter-Id") Long headhunterId,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return ResponseEntity.ok(approvalService.approve(candidateId, HeadhunterScope.resolve(principal, headhunterId)));
    }

    @PostMapping("/candidates/{candidateId}/reject")
    public ResponseEntity<CandidateResponse> reject(
            @PathVariable Long candidateId,
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "X-Headhunter-Id") Long headhunterId,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        String reason = body.getOrDefault("reason", "");
        return ResponseEntity.ok(approvalService.reject(candidateId, reason, HeadhunterScope.resolve(principal, headhunterId)));
    }

    private ResponseEntity<InvitationCreatedResponse> sendAndRespond(InvitationCreatedResult result) {
        String maskedEmail = tokenService.maskEmail(result.getEmail());
        String url = frontendBaseUrl + "/register/" + result.getRawToken();
        try {
            emailService.sendInvite(
                result.getEmail(),
                result.getCandidateName(),
                url,
                result.getInvitation().getExpiresAt(),
                result.getHeadhunterName()
            );
            log.info("invitation_email_sent invitation_id={} email={}",
                     result.getInvitation().getId(), maskedEmail);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(InvitationCreatedResponse.success(result, maskedEmail));
        } catch (MailException e) {
            log.error("invitation_email_send_failed invitation_id={} email={}",
                      result.getInvitation().getId(), maskedEmail, e);
            invitationService.markEmailFailed(result.getInvitation().getId());
            return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(InvitationCreatedResponse.emailFailed(result, maskedEmail));
        }
    }
}
