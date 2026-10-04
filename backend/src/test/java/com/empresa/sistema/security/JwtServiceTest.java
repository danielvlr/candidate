package com.empresa.sistema.security;

import com.empresa.sistema.domain.entity.AppUser;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "test-secret-with-at-least-32-bytes-1234567890";

    private final AppUser user = AppUser.builder()
            .id(42L).email("a@b.com").fullName("A").role(AppUser.UserRole.ADMIN).passwordHash("x").build();

    @Test
    void generatesTokenThatParsesBackToUserId() {
        JwtService service = new JwtService(SECRET, 60, 7);

        JwtService.IssuedToken issued = service.generate(user, false);

        assertThat(service.parseUserId(issued.token())).contains(42L);
        assertThat(issued.expiresAt()).isAfter(Instant.now().plusSeconds(3500));
    }

    @Test
    void rememberMeIssuesLongerToken() {
        JwtService service = new JwtService(SECRET, 60, 7);

        Instant expiresAt = service.generate(user, true).expiresAt();

        assertThat(expiresAt).isAfter(Instant.now().plusSeconds(6 * 24 * 3600));
    }

    @Test
    void rejectsTamperedToken() {
        JwtService service = new JwtService(SECRET, 60, 7);
        String token = service.generate(user, false).token();
        String tampered = token.substring(0, token.length() - 2) + (token.endsWith("A") ? "BB" : "AA");

        assertThat(service.parseUserId(tampered)).isEmpty();
    }

    @Test
    void rejectsTokenSignedWithAnotherKey() {
        JwtService issuer = new JwtService("another-secret-with-at-least-32-bytes-xyz", 60, 7);
        JwtService verifier = new JwtService(SECRET, 60, 7);

        assertThat(verifier.parseUserId(issuer.generate(user, false).token())).isEmpty();
    }

    @Test
    void rejectsExpiredToken() {
        JwtService service = new JwtService(SECRET, -1, 7);

        assertThat(service.parseUserId(service.generate(user, false).token())).isEmpty();
    }

    @Test
    void rejectsGarbage() {
        JwtService service = new JwtService(SECRET, 60, 7);

        assertThat(service.parseUserId("not-a-jwt")).isEmpty();
        assertThat(service.parseUserId("")).isEmpty();
    }

    @Test
    void failsFastOnShortSecret() {
        assertThatThrownBy(() -> new JwtService("short", 60, 7))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void blankSecretFallsBackToRandomKey() {
        JwtService service = new JwtService("", 60, 7);

        assertThat(service.parseUserId(service.generate(user, false).token())).contains(42L);
    }
}
