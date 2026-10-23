package com.empresa.sistema.api.dto.auth;

import com.empresa.sistema.domain.entity.AppUser.UserRole;
import jakarta.validation.constraints.NotNull;

/**
 * headhunterId nulo mantém o vínculo atual do usuário; clearHeadhunter=true remove o vínculo
 * (tem precedência sobre headhunterId).
 */
public record UserRoleUpdateRequest(
        @NotNull(message = "Perfil é obrigatório") UserRole role,
        Long headhunterId,
        Boolean clearHeadhunter) {

    public UserRoleUpdateRequest(UserRole role, Long headhunterId) {
        this(role, headhunterId, null);
    }

    public boolean shouldClearHeadhunter() {
        return Boolean.TRUE.equals(clearHeadhunter);
    }
}
