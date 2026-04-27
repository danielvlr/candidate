package com.empresa.sistema.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicInvitationResponse {

    private String fullName;
    private String email; // not masked — candidate confirms
    private String invitedByHeadhunterName;
    private LocalDateTime expiresAt;
    private String consentVersion;
}
