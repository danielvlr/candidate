package com.empresa.sistema.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InviteCandidateRequest {

    @NotBlank
    @Email
    private String email;

    private String fullName; // optional
}
