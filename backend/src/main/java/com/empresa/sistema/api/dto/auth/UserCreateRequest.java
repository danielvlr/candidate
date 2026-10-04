package com.empresa.sistema.api.dto.auth;

import com.empresa.sistema.domain.entity.AppUser.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(
        @NotBlank(message = "Email é obrigatório") @Email(message = "Email inválido") String email,
        @NotBlank(message = "Nome é obrigatório") @Size(max = 150) String fullName,
        @NotBlank(message = "Senha é obrigatória")
        @Size(min = 8, max = 128, message = "A senha deve ter entre 8 e 128 caracteres") String password,
        @NotNull(message = "Perfil é obrigatório") UserRole role,
        Long headhunterId) {
}
