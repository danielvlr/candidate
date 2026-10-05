package com.empresa.sistema.security;

import com.empresa.sistema.domain.entity.AppUser;

/** Headhunter só enxerga os próprios dados; demais perfis usam o filtro que pediram. */
public final class HeadhunterScope {

    /** Id inexistente: headhunter sem vínculo não vê dados de ninguém. */
    static final long NO_HEADHUNTER = -1L;

    private HeadhunterScope() {
    }

    public static Long resolve(AuthenticatedUser principal, Long requestedHeadhunterId) {
        if (principal == null || principal.role() != AppUser.UserRole.HEADHUNTER) {
            return requestedHeadhunterId;
        }
        return principal.headhunterId() != null ? principal.headhunterId() : NO_HEADHUNTER;
    }

    public static boolean isHeadhunter(AuthenticatedUser principal) {
        return principal != null && principal.role() == AppUser.UserRole.HEADHUNTER;
    }
}
