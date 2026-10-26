package com.empresa.sistema.api.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Nova senha definida por um administrador (o usuário precisará trocá-la no próximo acesso). */
public record AdminPasswordRequest(
        @NotBlank(message = "Nova senha é obrigatória")
        @Size(min = PasswordRules.MIN_LENGTH, max = PasswordRules.MAX_LENGTH,
                message = PasswordRules.SIZE_MESSAGE) String newPassword) {
}
