package com.empresa.sistema.domain.service;

import com.empresa.sistema.api.dto.auth.UserResponse;
import com.empresa.sistema.api.dto.response.HeadhunterAccessResponse;
import com.empresa.sistema.domain.entity.AppUser;
import com.empresa.sistema.domain.entity.Headhunter;
import com.empresa.sistema.domain.repository.AppUserRepository;
import com.empresa.sistema.domain.repository.HeadhunterRepository;
import com.empresa.sistema.domain.service.exception.BusinessException;
import com.empresa.sistema.domain.service.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Acesso (usuário HEADHUNTER) de um headhunter: criação junto com o cadastro e redefinição
 * de senha pelo admin. Participa da transação do chamador, de modo que uma falha aqui desfaz tudo.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class HeadhunterAccessService {

    private final AppUserRepository userRepository;
    private final HeadhunterRepository headhunterRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Garante o usuário de um headhunter recém-criado. Usuário já existente com o mesmo e-mail é
     * apenas vinculado (senha preservada); vinculado a outro headhunter, é erro.
     */
    @Transactional
    public AppUser provisionForNewHeadhunter(Headhunter headhunter, String initialPassword) {
        String email = AuthService.normalizeEmail(headhunter.getEmail());
        Optional<AppUser> existing = userRepository.findByEmailIgnoreCase(email);
        if (existing.isPresent()) {
            return linkExisting(existing.get(), headhunter);
        }
        return createUser(headhunter, email, initialPassword);
    }

    /** Define a senha do usuário do headhunter; cria o acesso se o headhunter ainda não tiver. */
    @Transactional
    public HeadhunterAccessResponse setPassword(Long headhunterId, String newPassword) {
        Headhunter headhunter = headhunterRepository.findById(headhunterId)
                .orElseThrow(() -> new ResourceNotFoundException("Headhunter não encontrado"));
        Optional<AppUser> linked = userRepository.findFirstByHeadhunterId(headhunterId);
        if (linked.isPresent()) {
            AppUser updated = userRepository.save(withTemporaryPassword(linked.get(), newPassword));
            log.info("headhunter_password_set_by_admin userId={} headhunterId={}", updated.getId(), headhunterId);
            return new HeadhunterAccessResponse(false, UserResponse.from(updated));
        }
        String email = AuthService.normalizeEmail(headhunter.getEmail());
        Optional<AppUser> sameEmail = userRepository.findByEmailIgnoreCase(email);
        if (sameEmail.isPresent()) {
            AppUser target = linkExisting(sameEmail.get(), headhunter);
            AppUser updated = userRepository.save(withTemporaryPassword(target, newPassword));
            return new HeadhunterAccessResponse(false, UserResponse.from(updated));
        }
        AppUser created = createUser(headhunter, email, newPassword);
        return new HeadhunterAccessResponse(true, UserResponse.from(created));
    }

    private AppUser linkExisting(AppUser user, Headhunter headhunter) {
        Long linkedTo = user.getHeadhunterId();
        if (linkedTo != null && !linkedTo.equals(headhunter.getId())) {
            throw new BusinessException("Já existe um usuário com este e-mail vinculado a outro headhunter");
        }
        if (linkedTo != null) {
            return user;
        }
        AppUser linked = userRepository.save(user.toBuilder().headhunterId(headhunter.getId()).build());
        log.info("headhunter_user_linked userId={} headhunterId={}", linked.getId(), headhunter.getId());
        return linked;
    }

    private AppUser createUser(Headhunter headhunter, String email, String password) {
        AppUser created = userRepository.save(AppUser.builder()
                .email(email)
                .fullName(headhunter.getFullName().trim())
                .passwordHash(passwordEncoder.encode(password))
                .role(AppUser.UserRole.HEADHUNTER)
                .headhunterId(headhunter.getId())
                .active(true)
                .mustChangePassword(true)
                .build());
        log.info("headhunter_user_created userId={} headhunterId={}", created.getId(), headhunter.getId());
        return created;
    }

    private AppUser withTemporaryPassword(AppUser user, String password) {
        return user.toBuilder()
                .passwordHash(passwordEncoder.encode(password))
                .mustChangePassword(true)
                .build();
    }
}
