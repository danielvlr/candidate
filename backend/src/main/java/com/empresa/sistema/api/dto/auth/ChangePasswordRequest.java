package com.empresa.sistema.api.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Senha atual é obrigatória") @Size(max = PasswordRules.MAX_LENGTH) String currentPassword,
        @NotBlank(message = "Nova senha é obrigatória")
        @Size(min = PasswordRules.MIN_LENGTH, max = PasswordRules.MAX_LENGTH,
                message = PasswordRules.SIZE_MESSAGE) String newPassword) {
}
