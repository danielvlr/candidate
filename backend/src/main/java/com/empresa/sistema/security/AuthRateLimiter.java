package com.empresa.sistema.security;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limit em memória (janela fixa) para endpoints de autenticação.
 * Suficiente para instância única (Render free); trocar por store compartilhado se escalar horizontalmente.
 */
@Component
public class AuthRateLimiter {

    private static final Duration WINDOW = Duration.ofMinutes(15);
    private static final int MAX_ENTRIES = 10_000;

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final Clock clock;

    public AuthRateLimiter() {
        this(Clock.systemUTC());
    }

    AuthRateLimiter(Clock clock) {
        this.clock = clock;
    }

    /** true se a chave ainda está dentro do limite (não incrementa). */
    public boolean isAllowed(String key, int maxAttempts) {
        Window w = windows.get(key);
        return w == null || w.isExpired(clock.instant()) || w.count() < maxAttempts;
    }

    public void recordAttempt(String key) {
        Instant now = clock.instant();
        if (windows.size() > MAX_ENTRIES) {
            windows.entrySet().removeIf(e -> e.getValue().isExpired(now));
        }
        windows.compute(key, (k, w) -> (w == null || w.isExpired(now))
                ? new Window(now.plus(WINDOW), 1)
                : new Window(w.resetAt(), w.count() + 1));
    }

    public void reset(String key) {
        windows.remove(key);
    }

    private record Window(Instant resetAt, int count) {
        boolean isExpired(Instant now) {
            return !now.isBefore(resetAt);
        }
    }
}
