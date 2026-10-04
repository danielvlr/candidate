package com.empresa.sistema.api.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "Token é obrigatório") @Size(max = 128) String token,
        @NotBlank(message = "Nova senha é obrigatória")
        @Size(min = 8, max = 128, message = "A senha deve ter entre 8 e 128 caracteres") String newPassword) {
}
