package com.empresa.sistema.security;

import com.empresa.sistema.domain.entity.AppUser;

/** Principal colocado no SecurityContext após validar o JWT. */
public record AuthenticatedUser(Long id, String email, AppUser.UserRole role, Long headhunterId) {

    public static AuthenticatedUser from(AppUser user) {
        return new AuthenticatedUser(user.getId(), user.getEmail(), user.getRole(), user.getHeadhunterId());
    }
}
