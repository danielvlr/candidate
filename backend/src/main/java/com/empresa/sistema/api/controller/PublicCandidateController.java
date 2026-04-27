package com.empresa.sistema.api.controller;

import com.empresa.sistema.api.dto.request.SelfRegisterRequest;
import com.empresa.sistema.api.dto.response.PublicInvitationResponse;
import com.empresa.sistema.domain.service.CandidateInvitationService;
import com.empresa.sistema.domain.service.result.PublicInvitationView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public/invitations")
@RequiredArgsConstructor
@Slf4j
public class PublicCandidateController {

    private final CandidateInvitationService invitationService;

    @GetMapping("/{token}")
    public ResponseEntity<PublicInvitationResponse> lookup(@PathVariable String token) {
        PublicInvitationView v = invitationService.lookupByToken(token);
        return ResponseEntity.ok(PublicInvitationResponse.builder()
            .fullName(v.getFullName())
            .email(v.getEmail())
            .invitedByHeadhunterName(v.getInvitedByHeadhunterName())
            .expiresAt(v.getExpiresAt())
            .consentVersion(v.getConsentVersion())
            .build());
    }

    @PostMapping("/{token}/register")
    public ResponseEntity<Void> register(
            @PathVariable String token,
            @Valid @RequestBody SelfRegisterRequest req) {
        invitationService.register(token, req);
        return ResponseEntity.noContent().build();
    }
}
