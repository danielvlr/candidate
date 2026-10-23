package com.empresa.sistema.security;

import com.empresa.sistema.domain.entity.AppUser;

/**
 * CPARTNER só enxerga assessorados do senior (Headhunter) vinculado ao seu usuário.
 * Demais perfis não têm escopo de senior (resultado nulo).
 */
public final class CpartnerScope {

    /** Id inexistente: CPARTNER sem vínculo não vê assessorados de ninguém. */
    static final long NO_SENIOR = -1L;

    private CpartnerScope() {
    }

    public static boolean isCpartner(AuthenticatedUser principal) {
        return principal != null && principal.role() == AppUser.UserRole.CPARTNER;
    }

    /** Senior do CPARTNER (ou id inexistente se sem vínculo); nulo para ADMIN/HEADHUNTER. */
    public static Long seniorScope(AuthenticatedUser principal) {
        if (!isCpartner(principal)) {
            return null;
        }
        return principal.headhunterId() != null ? principal.headhunterId() : NO_SENIOR;
    }
}
