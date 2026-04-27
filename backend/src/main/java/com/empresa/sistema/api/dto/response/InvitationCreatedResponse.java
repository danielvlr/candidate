package com.empresa.sistema.api.dto.response;

import com.empresa.sistema.domain.service.result.InvitationCreatedResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvitationCreatedResponse {

    private Long invitationId;
    private String status;     // PENDING | EMAIL_FAILED
    private String email;      // masked
    private LocalDateTime expiresAt;
    private String message;

    public static InvitationCreatedResponse success(InvitationCreatedResult r, String maskedEmail) {
        return InvitationCreatedResponse.builder()
            .invitationId(r.getInvitation().getId())
            .status("PENDING")
            .email(maskedEmail)
            .expiresAt(r.getInvitation().getExpiresAt())
            .message("Convite enviado com sucesso.")
            .build();
    }

    public static InvitationCreatedResponse emailFailed(InvitationCreatedResult r, String maskedEmail) {
        return InvitationCreatedResponse.builder()
            .invitationId(r.getInvitation().getId())
            .status("EMAIL_FAILED")
            .email(maskedEmail)
            .expiresAt(r.getInvitation().getExpiresAt())
            .message("Convite criado mas email não foi entregue. Use 'Reenviar'.")
            .build();
    }
}
