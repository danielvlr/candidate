package com.empresa.sistema.domain.service;

import com.empresa.sistema.domain.entity.AppUser;
import com.empresa.sistema.domain.entity.PasswordResetToken;
import com.empresa.sistema.domain.repository.AppUserRepository;
import com.empresa.sistema.domain.repository.PasswordResetTokenRepository;
import com.empresa.sistema.domain.service.exception.BusinessException;
import com.empresa.sistema.security.AuthRateLimiter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailSendException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PasswordResetServiceTest {

    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private final InvitationTokenService tokenService = new InvitationTokenService();
    private AppUserRepository userRepository;
    private PasswordResetTokenRepository tokenRepository;
    private GmailEmailService emailService;
    private PasswordResetService service;

    private final AppUser user = AppUser.builder().id(7L).email("ana@camarmo.com").fullName("Ana")
            .passwordHash("old-hash").role(AppUser.UserRole.ADMIN).active(true).build();

    @BeforeEach
    void setUp() {
        userRepository = mock(AppUserRepository.class);
        tokenRepository = mock(PasswordResetTokenRepository.class);
        emailService = mock(GmailEmailService.class);
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());
        service = new PasswordResetService(userRepository, tokenRepository, tokenService, encoder,
                emailService, new AuthRateLimiter(), "http://front/", 30, false);
    }

    @Test
    void requestResetForUnknownEmailSendsNothing() {
        service.requestReset("ninguem@camarmo.com");

        verifyNoInteractions(emailService);
        verify(tokenRepository, never()).save(any());
    }

    @Test
    void requestResetStoresOnlyHashAndEmailsLinkWithRawToken() {
        when(userRepository.findByEmailIgnoreCase("ana@camarmo.com")).thenReturn(Optional.of(user));

        service.requestReset(" ANA@camarmo.com ");

        ArgumentCaptor<PasswordResetToken> saved = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository).invalidateOpenTokens(eq(7L), any());
        verify(tokenRepository).save(saved.capture());
        ArgumentCaptor<String> url = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendPasswordReset(eq("ana@camarmo.com"), eq("Ana"), url.capture(), eq(30L));

        assertThat(url.getValue()).startsWith("http://front/reset-password?token=");
        String rawToken = url.getValue().substring(url.getValue().indexOf('=') + 1);
        assertThat(saved.getValue().getTokenHash()).isEqualTo(tokenService.hash(rawToken)).isNotEqualTo(rawToken);
        assertThat(saved.getValue().getExpiresAt()).isAfter(LocalDateTime.now().plusMinutes(29));
    }

    @Test
    void requestResetSwallowsEmailFailures() {
        when(userRepository.findByEmailIgnoreCase("ana@camarmo.com")).thenReturn(Optional.of(user));
        doThrow(new MailSendException("smtp down")).when(emailService)
                .sendPasswordReset(anyString(), anyString(), anyString(), anyLong());

        assertThatCode(() -> service.requestReset("ana@camarmo.com")).doesNotThrowAnyException();
    }

    @Test
    void requestResetIsRateLimitedPerEmail() {
        when(userRepository.findByEmailIgnoreCase("ana@camarmo.com")).thenReturn(Optional.of(user));

        for (int i = 0; i < PasswordResetService.MAX_REQUESTS_PER_WINDOW + 2; i++) {
            service.requestReset("ana@camarmo.com");
        }

        verify(emailService, times(PasswordResetService.MAX_REQUESTS_PER_WINDOW))
                .sendPasswordReset(anyString(), anyString(), anyString(), anyLong());
    }

    @Test
    void resetPasswordWithValidTokenUpdatesHashAndInvalidatesTokens() {
        stubToken("raw-token", LocalDateTime.now().plusMinutes(10), null);

        service.resetPassword("raw-token", "nova-senha-123");

        ArgumentCaptor<AppUser> savedUser = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository).save(savedUser.capture());
        assertThat(encoder.matches("nova-senha-123", savedUser.getValue().getPasswordHash())).isTrue();
        verify(tokenRepository).invalidateOpenTokens(eq(7L), any());
    }

    @Test
    void resetPasswordRejectsExpiredToken() {
        stubToken("raw-token", LocalDateTime.now().minusMinutes(1), null);

        assertThatThrownBy(() -> service.resetPassword("raw-token", "nova-senha-123"))
                .isInstanceOf(BusinessException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void resetPasswordRejectsAlreadyUsedToken() {
        stubToken("raw-token", LocalDateTime.now().plusMinutes(10), LocalDateTime.now().minusMinutes(1));

        assertThatThrownBy(() -> service.resetPassword("raw-token", "nova-senha-123"))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void resetPasswordRejectsUnknownToken() {
        assertThatThrownBy(() -> service.resetPassword("nao-existe", "nova-senha-123"))
                .isInstanceOf(BusinessException.class);
        assertThat(service.isTokenValid("nao-existe")).isFalse();
    }

    @Test
    void isTokenValidForUsableToken() {
        stubToken("raw-token", LocalDateTime.now().plusMinutes(10), null);

        assertThat(service.isTokenValid("raw-token")).isTrue();
    }

    private void stubToken(String raw, LocalDateTime expiresAt, LocalDateTime usedAt) {
        PasswordResetToken token = PasswordResetToken.builder().id(1L).user(user)
                .tokenHash(tokenService.hash(raw)).createdAt(LocalDateTime.now().minusMinutes(5))
                .expiresAt(expiresAt).usedAt(usedAt).build();
        when(tokenRepository.findByTokenHash(tokenService.hash(raw))).thenReturn(Optional.of(token));
    }
}
