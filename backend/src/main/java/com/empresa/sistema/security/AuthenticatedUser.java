package com.empresa.sistema.security;

import com.empresa.sistema.domain.entity.AppUser;

/** Principal colocado no SecurityContext após validar o JWT. */
public record AuthenticatedUser(Long id, String email, AppUser.UserRole role, Long headhunterId,
                                boolean mustChangePassword) {

    /** Construtor de conveniência para quem não lida com a troca obrigatória de senha. */
    public AuthenticatedUser(Long id, String email, AppUser.UserRole role, Long headhunterId) {
        this(id, email, role, headhunterId, false);
    }

    public static AuthenticatedUser from(AppUser user) {
        return new AuthenticatedUser(user.getId(), user.getEmail(), user.getRole(), user.getHeadhunterId(),
                user.isMustChangePassword());
    }
}
