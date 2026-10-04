package com.empresa.sistema.config;

import com.empresa.sistema.domain.entity.AppUser;
import com.empresa.sistema.domain.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Locale;

/**
 * Garante que exista ao menos um ADMIN. Credenciais via ADMIN_EMAIL / ADMIN_PASSWORD;
 * sem ADMIN_PASSWORD é gerada uma senha aleatória, exibida uma única vez no log.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminUserInitializer implements CommandLineRunner {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.auth.bootstrap-admin.email:admin@camarmo.com}")
    private String adminEmail;

    @Value("${app.auth.bootstrap-admin.password:}")
    private String adminPassword;

    @Value("${app.auth.bootstrap-admin.name:Administrador}")
    private String adminName;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }
        boolean generated = adminPassword == null || adminPassword.isBlank();
        String password = generated ? randomPassword() : adminPassword;
        String email = adminEmail.trim().toLowerCase(Locale.ROOT);

        userRepository.save(AppUser.builder()
                .email(email)
                .fullName(adminName)
                .passwordHash(passwordEncoder.encode(password))
                .role(AppUser.UserRole.ADMIN)
                .active(true)
                .build());

        if (generated) {
            log.warn("Usuário ADMIN inicial criado: {} / senha gerada: {} — troque via 'Esqueci minha senha' "
                    + "ou defina ADMIN_PASSWORD.", email, password);
        } else {
            log.info("Usuário ADMIN inicial criado: {}", email);
        }
    }

    private static String randomPassword() {
        byte[] bytes = new byte[12];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
