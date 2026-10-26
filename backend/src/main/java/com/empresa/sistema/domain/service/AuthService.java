package com.empresa.sistema.domain.service;

import com.empresa.sistema.domain.repository.HeadhunterRepository;
import com.empresa.sistema.api.dto.auth.AuthResponse;
import com.empresa.sistema.api.dto.auth.ChangePasswordRequest;
import com.empresa.sistema.api.dto.auth.LoginRequest;
import com.empresa.sistema.domain.service.exception.BusinessException;
import com.empresa.sistema.api.dto.auth.UserResponse;
import com.empresa.sistema.domain.entity.AppUser;
import com.empresa.sistema.domain.repository.AppUserRepository;
import com.empresa.sistema.domain.service.exception.InvalidCredentialsException;
import com.empresa.sistema.domain.service.exception.ResourceNotFoundException;
import com.empresa.sistema.domain.service.exception.TooManyRequestsException;
import com.empresa.sistema.security.AuthRateLimiter;
import com.empresa.sistema.security.JwtService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Optional;

@Service
@Slf4j
public class AuthService {

    static final int MAX_FAILED_LOGINS = 5;

    private final AppUserRepository userRepository;
    private final HeadhunterRepository headhunterRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthRateLimiter rateLimiter;
    /** Hash fixo usado quando o email não existe, para o tempo de resposta não revelar contas. */
    private final String dummyHash;

    public AuthService(AppUserRepository userRepository, HeadhunterRepository headhunterRepository,
                       PasswordEncoder passwordEncoder, JwtService jwtService, AuthRateLimiter rateLimiter) {
        this.userRepository = userRepository;
        this.headhunterRepository = headhunterRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.rateLimiter = rateLimiter;
        this.dummyHash = passwordEncoder.encode("camarmo-dummy-password");
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        String rateKey = "login:" + email;
        if (!rateLimiter.isAllowed(rateKey, MAX_FAILED_LOGINS)) {
            throw new TooManyRequestsException("Muitas tentativas de login. Aguarde alguns minutos e tente novamente.");
        }

        Optional<AppUser> user = userRepository.findByEmailIgnoreCase(email);
        String hash = user.map(AppUser::getPasswordHash).orElse(dummyHash);
        boolean passwordOk = passwordEncoder.matches(request.password(), hash);

        if (user.isEmpty() || !passwordOk || !user.get().isActive()) {
            rateLimiter.recordAttempt(rateKey);
            log.info("login_failed email={}", email);
            throw new InvalidCredentialsException();
        }

        rateLimiter.reset(rateKey);
        AppUser authenticated = linkHeadhunterIfMissing(user.get());
        JwtService.IssuedToken token = jwtService.generate(authenticated, request.rememberMe());
        log.info("login_success userId={}", authenticated.getId());
        return AuthResponse.bearer(token.token(), token.expiresAt(), UserResponse.from(authenticated));
    }

    @Transactional
    public UserResponse me(Long userId) {
        return userRepository.findById(userId)
                .filter(AppUser::isActive)
                .map(this::linkHeadhunterIfMissing)
                .map(UserResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }

    /**
     * Troca a própria senha. Desliga {@code mustChangePassword}; como a flag é lida do banco a cada request
     * (não vai no token), o token atual continua válido e não é preciso emitir outro.
     */
    @Transactional
    public UserResponse changePassword(Long userId, ChangePasswordRequest request) {
        AppUser user = userRepository.findById(userId)
                .filter(AppUser::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        String rateKey = "change-password:" + userId;
        if (!rateLimiter.isAllowed(rateKey, MAX_FAILED_LOGINS)) {
            throw new TooManyRequestsException("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
        }
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            rateLimiter.recordAttempt(rateKey);
            throw new BusinessException("A senha atual está incorreta");
        }
        if (request.currentPassword().equals(request.newPassword())) {
            throw new BusinessException("A nova senha deve ser diferente da senha atual");
        }
        rateLimiter.reset(rateKey);
        AppUser updated = userRepository.save(user.toBuilder()
                .passwordHash(passwordEncoder.encode(request.newPassword()))
                .mustChangePassword(false)
                .build());
        log.info("password_changed_by_user userId={}", updated.getId());
        return UserResponse.from(updated);
    }

    /**
     * Conta HEADHUNTER criada sem vínculo ficaria sem dados próprios (ou com os de outro headhunter):
     * vincula pelo e-mail ao cadastro de headhunter correspondente.
     */
    private AppUser linkHeadhunterIfMissing(AppUser user) {
        if (user.getRole() != AppUser.UserRole.HEADHUNTER || user.getHeadhunterId() != null) {
            return user;
        }
        return headhunterRepository.findFirstByEmailIgnoreCase(user.getEmail())
                .map(hh -> {
                    AppUser linked = userRepository.save(user.toBuilder().headhunterId(hh.getId()).build());
                    log.info("headhunter_user_linked userId={} headhunterId={}", linked.getId(), hh.getId());
                    return linked;
                })
                .orElseGet(() -> {
                    log.warn("headhunter_user_unlinked userId={}", user.getId());
                    return user;
                });
    }

    static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
