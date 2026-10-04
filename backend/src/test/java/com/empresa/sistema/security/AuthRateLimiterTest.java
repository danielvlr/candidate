package com.empresa.sistema.security;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class AuthRateLimiterTest {

    @Test
    void blocksAfterMaxAttemptsAndReleasesAfterWindow() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T10:00:00Z"));
        AuthRateLimiter limiter = new AuthRateLimiter(clock);

        for (int i = 0; i < 3; i++) {
            assertThat(limiter.isAllowed("k", 3)).isTrue();
            limiter.recordAttempt("k");
        }
        assertThat(limiter.isAllowed("k", 3)).isFalse();
        assertThat(limiter.isAllowed("other", 3)).isTrue();

        clock.advance(Duration.ofMinutes(16));
        assertThat(limiter.isAllowed("k", 3)).isTrue();
    }

    @Test
    void resetClearsAttempts() {
        AuthRateLimiter limiter = new AuthRateLimiter();
        limiter.recordAttempt("k");
        limiter.recordAttempt("k");

        limiter.reset("k");

        assertThat(limiter.isAllowed("k", 1)).isTrue();
    }

    private static final class MutableClock extends Clock {
        private Instant now;

        MutableClock(Instant now) {
            this.now = now;
        }

        void advance(Duration d) {
            now = now.plus(d);
        }

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}
