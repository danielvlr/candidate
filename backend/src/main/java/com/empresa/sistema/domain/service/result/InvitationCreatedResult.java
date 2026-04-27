package com.empresa.sistema.domain.service.result;

import com.empresa.sistema.domain.entity.CandidateInvitation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InvitationCreatedResult {

    private CandidateInvitation invitation;
    private String rawToken;        // ephemeral — controller uses to build URL
    private String candidateName;
    private String email;           // raw, for SMTP
    private String headhunterName;
}
