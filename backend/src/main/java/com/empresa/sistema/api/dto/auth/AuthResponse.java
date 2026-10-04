package com.empresa.sistema.api.dto.auth;

import java.time.Instant;

public record AuthResponse(String token, String tokenType, Instant expiresAt, UserResponse user) {

    public static AuthResponse bearer(String token, Instant expiresAt, UserResponse user) {
        return new AuthResponse(token, "Bearer", expiresAt, user);
    }
}
