package com.empresa.sistema.security;

import com.empresa.sistema.domain.entity.AppUser;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class HeadhunterScopeTest {

    private static AuthenticatedUser user(AppUser.UserRole role, Long headhunterId) {
        return new AuthenticatedUser(1L, "x@camarmo.com", role, headhunterId);
    }

    @Test
    void headhunterAlwaysGetsOwnIdRegardlessOfRequest() {
        assertThat(HeadhunterScope.resolve(user(AppUser.UserRole.HEADHUNTER, 17L), 1L)).isEqualTo(17L);
        assertThat(HeadhunterScope.resolve(user(AppUser.UserRole.HEADHUNTER, 17L), null)).isEqualTo(17L);
    }

    @Test
    void unlinkedHeadhunterSeesNobodysData() {
        assertThat(HeadhunterScope.resolve(user(AppUser.UserRole.HEADHUNTER, null), 1L))
                .isEqualTo(HeadhunterScope.NO_HEADHUNTER);
    }

    @Test
    void otherRolesKeepRequestedFilter() {
        assertThat(HeadhunterScope.resolve(user(AppUser.UserRole.ADMIN, null), 5L)).isEqualTo(5L);
        assertThat(HeadhunterScope.resolve(user(AppUser.UserRole.CPARTNER, null), null)).isNull();
        assertThat(HeadhunterScope.resolve(null, 5L)).isEqualTo(5L);
    }
}
