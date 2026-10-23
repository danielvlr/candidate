package com.empresa.sistema.api.dto.auth;

import com.empresa.sistema.domain.entity.AppUser.UserRole;
import jakarta.validation.constraints.NotNull;

/** headhunterId nulo mantém o vínculo atual do usuário. */
public record UserRoleUpdateRequest(
        @NotNull(message = "Perfil é obrigatório") UserRole role,
        Long headhunterId) {
}
