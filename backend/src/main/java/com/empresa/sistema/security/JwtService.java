package com.empresa.sistema.security;

import com.empresa.sistema.domain.entity.AppUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

@Service
@Slf4j
public class JwtService {

    private static final String ISSUER = "camarmo";
    private static final int MIN_SECRET_BYTES = 32;

    private final SecretKey key;
    private final Duration defaultTtl;
    private final Duration rememberMeTtl;

    public JwtService(
            @Value("${app.jwt.secret:}") String secret,
            @Value("${app.jwt.expiration-minutes:480}") long expirationMinutes,
            @Value("${app.jwt.remember-me-days:7}") long rememberMeDays) {
        this.key = buildKey(secret);
        this.defaultTtl = Duration.ofMinutes(expirationMinutes);
        this.rememberMeTtl = Duration.ofDays(rememberMeDays);
    }

    public IssuedToken generate(AppUser user, boolean rememberMe) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(rememberMe ? rememberMeTtl : defaultTtl);
        String token = Jwts.builder()
                .issuer(ISSUER)
                .subject(String.valueOf(user.getId()))
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(key)
                .compact();
        return new IssuedToken(token, expiresAt);
    }

    /** Retorna o id do usuário (subject) se o token for válido, assinado e não expirado. */
    public Optional<Long> parseUserId(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(ISSUER)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(Long.parseLong(claims.getSubject()));
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("jwt_invalid: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private static SecretKey buildKey(String secret) {
        if (secret == null || secret.isBlank()) {
            log.warn("app.jwt.secret (JWT_SECRET) não configurado — usando chave aleatória. "
                    + "Tokens serão invalidados a cada restart.");
            return Jwts.SIG.HS256.key().build();
        }
        byte[] bytes = decodeSecret(secret.trim());
        if (bytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException("app.jwt.secret deve ter pelo menos 32 bytes (256 bits)");
        }
        return Keys.hmacShaKeyFor(bytes);
    }

    private static byte[] decodeSecret(String secret) {
        try {
            return Decoders.BASE64.decode(secret);
        } catch (RuntimeException notBase64) {
            return secret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        }
    }

    public record IssuedToken(String token, Instant expiresAt) {
    }
}
