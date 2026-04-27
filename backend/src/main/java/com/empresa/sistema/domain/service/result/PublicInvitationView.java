package com.empresa.sistema.domain.service.result;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PublicInvitationView {

    private String fullName;
    private String email;
    private String invitedByHeadhunterName;
    private LocalDateTime expiresAt;
    private String consentVersion;
}
