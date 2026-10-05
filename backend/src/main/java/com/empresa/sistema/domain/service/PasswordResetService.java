package com.empresa.sistema.domain.service;

import com.empresa.sistema.domain.entity.AppUser;
import com.empresa.sistema.domain.entity.Headhunter;
import com.empresa.sistema.domain.entity.PasswordResetToken;
import com.empresa.sistema.domain.repository.AppUserRepository;
import com.empresa.sistema.domain.repository.HeadhunterRepository;
import com.empresa.sistema.domain.repository.PasswordResetTokenRepository;
import com.empresa.sistema.domain.service.exception.BusinessException;
import com.empresa.sistema.security.AuthRateLimiter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Fluxo "esqueci minha senha": gera token de uso único (só o hash é persistido),
 * envia link por email e troca a senha mediante token válido.
 * Headhunters ativos (com e-mail real) que ainda não têm conta recebem uma conta
 * HEADHUNTER vinculada no primeiro pedido — a senha só é definida pelo link enviado ao e-mail.
 */
@Service
@Slf4j
public class PasswordResetService {

    static final int MAX_REQUESTS_PER_WINDOW = 3;
    static final String JESTOR_PLACEHOLDER_DOMAIN = "@jestor-sync.local";
    static final String INVALID_TOKEN_MESSAGE = "Link de redefinição inválido ou expirado. Solicite um novo.";

    private final AppUserRepository userRepository;
    private final HeadhunterRepository headhunterRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final InvitationTokenService tokenService;
    private final PasswordEncoder passwordEncoder;
    private final GmailEmailService emailService;
    private final AuthRateLimiter rateLimiter;
    private final String frontendBaseUrl;
    private final long ttlMinutes;
    private final boolean logResetLinks;

    public PasswordResetService(AppUserRepository userRepository,
                                HeadhunterRepository headhunterRepository,
                                PasswordResetTokenRepository tokenRepository,
                                InvitationTokenService tokenService,
                                PasswordEncoder passwordEncoder,
                                GmailEmailService emailService,
                                AuthRateLimiter rateLimiter,
                                @Value("${app.frontend-base-url:http://localhost:5173}") String frontendBaseUrl,
                                @Value("${app.auth.reset-token-ttl-minutes:30}") long ttlMinutes,
                                @Value("${app.auth.log-reset-links:false}") boolean logResetLinks) {
        this.userRepository = userRepository;
        this.headhunterRepository = headhunterRepository;
        this.tokenRepository = tokenRepository;
        this.tokenService = tokenService;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.rateLimiter = rateLimiter;
        this.frontendBaseUrl = frontendBaseUrl.replaceAll("/+$", "");
        this.ttlMinutes = ttlMinutes;
        this.logResetLinks = logResetLinks;
    }

    /**
     * Sempre retorna sem erro, exista ou não a conta — evita enumeração de emails.
     */
    @Transactional
    public void requestReset(String rawEmail) {
        String email = AuthService.normalizeEmail(rawEmail);
        String rateKey = "forgot:" + email;
        if (!rateLimiter.isAllowed(rateKey, MAX_REQUESTS_PER_WINDOW)) {
            log.info("password_reset_rate_limited email={}", email);
            return;
        }
        rateLimiter.recordAttempt(rateKey);

        Optional<AppUser> existing = userRepository.findByEmailIgnoreCase(email);
        Optional<AppUser> target = existing.isPresent()
                ? existing.filter(AppUser::isActive)
                : provisionHeadhunterUser(email);
        target.ifPresentOrElse(this::issueAndSend,
                () -> log.info("password_reset_unknown_email email={}", email));
    }

    private Optional<AppUser> provisionHeadhunterUser(String email) {
        if (email.endsWith(JESTOR_PLACEHOLDER_DOMAIN)) {
            return Optional.empty();
        }
        return headhunterRepository.findFirstByEmailIgnoreCase(email)
                .filter(hh -> hh.getStatus() == Headhunter.HeadhunterStatus.ACTIVE)
                .map(hh -> {
                    AppUser created = userRepository.save(AppUser.builder()
                            .email(email)
                            .fullName(hh.getFullName().trim())
                            // Senha aleatória descartada: o acesso só é liberado pelo link de redefinição.
                            .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                            .role(AppUser.UserRole.HEADHUNTER)
                            .headhunterId(hh.getId())
                            .active(true)
                            .build());
                    log.info("headhunter_user_provisioned userId={} headhunterId={}", created.getId(), hh.getId());
                    return created;
                });
    }

    @Transactional(readOnly = true)
    public boolean isTokenValid(String rawToken) {
        return findUsableToken(rawToken) != null;
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        PasswordResetToken token = findUsableToken(rawToken);
        if (token == null) {
            throw new BusinessException(INVALID_TOKEN_MESSAGE);
        }
        AppUser user = token.getUser();
        LocalDateTime now = LocalDateTime.now();

        userRepository.save(user.toBuilder().passwordHash(passwordEncoder.encode(newPassword)).build());
        tokenRepository.invalidateOpenTokens(user.getId(), now);
        log.info("password_reset_success userId={}", user.getId());
    }

    private void issueAndSend(AppUser user) {
        LocalDateTime now = LocalDateTime.now();
        tokenRepository.invalidateOpenTokens(user.getId(), now);

        String rawToken = tokenService.generateToken();
        tokenRepository.save(PasswordResetToken.builder()
                .user(user)
                .tokenHash(tokenService.hash(rawToken))
                .createdAt(now)
                .expiresAt(now.plusMinutes(ttlMinutes))
                .build());

        String resetUrl = frontendBaseUrl + "/reset-password?token=" + rawToken;
        if (logResetLinks) {
            log.info("password_reset_link (dev) userId={} url={}", user.getId(), resetUrl);
        }
        try {
            emailService.sendPasswordReset(user.getEmail(), user.getFullName(), resetUrl, ttlMinutes);
        } catch (RuntimeException e) {
            // Não propaga: a resposta precisa ser idêntica para contas existentes e inexistentes.
            log.error("password_reset_email_failed userId={}: {}", user.getId(), e.getMessage());
        }
    }

    private PasswordResetToken findUsableToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return null;
        }
        LocalDateTime now = LocalDateTime.now();
        return tokenRepository.findByTokenHash(tokenService.hash(rawToken.trim()))
                .filter(t -> t.isUsable(now))
                .filter(t -> t.getUser().isActive())
                .orElse(null);
    }
}
