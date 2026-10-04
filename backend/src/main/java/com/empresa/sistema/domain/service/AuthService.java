package com.empresa.sistema.domain.service;

import com.empresa.sistema.api.dto.auth.AuthResponse;
import com.empresa.sistema.api.dto.auth.LoginRequest;
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
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthRateLimiter rateLimiter;
    /** Hash fixo usado quando o email não existe, para o tempo de resposta não revelar contas. */
    private final String dummyHash;

    public AuthService(AppUserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, AuthRateLimiter rateLimiter) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.rateLimiter = rateLimiter;
        this.dummyHash = passwordEncoder.encode("camarmo-dummy-password");
    }

    @Transactional(readOnly = true)
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
        AppUser authenticated = user.get();
        JwtService.IssuedToken token = jwtService.generate(authenticated, request.rememberMe());
        log.info("login_success userId={}", authenticated.getId());
        return AuthResponse.bearer(token.token(), token.expiresAt(), UserResponse.from(authenticated));
    }

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        return userRepository.findById(userId)
                .filter(AppUser::isActive)
                .map(UserResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }

    static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
