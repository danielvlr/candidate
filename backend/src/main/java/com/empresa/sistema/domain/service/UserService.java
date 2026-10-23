package com.empresa.sistema.domain.service;

import com.empresa.sistema.api.dto.auth.UserCreateRequest;
import com.empresa.sistema.api.dto.auth.UserResponse;
import com.empresa.sistema.api.dto.auth.UserRoleUpdateRequest;
import com.empresa.sistema.domain.entity.AppUser;
import com.empresa.sistema.domain.entity.AppUser.UserRole;
import com.empresa.sistema.domain.repository.AppUserRepository;
import com.empresa.sistema.domain.repository.HeadhunterRepository;
import com.empresa.sistema.domain.service.exception.BusinessException;
import com.empresa.sistema.domain.service.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final HeadhunterRepository headhunterRepository;

    @Transactional(readOnly = true)
    public List<UserResponse> list() {
        return userRepository.findAll().stream().map(UserResponse::from).toList();
    }

    @Transactional
    public UserResponse create(UserCreateRequest request) {
        String email = AuthService.normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException("Já existe um usuário com este email");
        }
        AppUser saved = userRepository.save(AppUser.builder()
                .email(email)
                .fullName(request.fullName().trim())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(request.role())
                .headhunterId(request.headhunterId())
                .active(true)
                .build());
        return UserResponse.from(saved);
    }

    @Transactional
    public UserResponse updateRole(Long id, UserRoleUpdateRequest request, Long actingUserId) {
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        // Quem chama é admin ativo: bloquear o auto-rebaixamento garante que sempre resta um admin.
        if (id.equals(actingUserId) && request.role() != UserRole.ADMIN) {
            throw new BusinessException("Você não pode remover o seu próprio perfil de administrador");
        }
        boolean clear = request.shouldClearHeadhunter();
        if (!clear && request.headhunterId() != null && !headhunterRepository.existsById(request.headhunterId())) {
            throw new BusinessException("Headhunter não encontrado");
        }
        Long headhunterId = resolveHeadhunterId(user, request, clear);
        AppUser updated = user.toBuilder().role(request.role()).headhunterId(headhunterId).build();
        return UserResponse.from(userRepository.save(updated));
    }

    private static Long resolveHeadhunterId(AppUser user, UserRoleUpdateRequest request, boolean clear) {
        if (clear) {
            return null;
        }
        return request.headhunterId() != null ? request.headhunterId() : user.getHeadhunterId();
    }

    @Transactional
    public UserResponse setActive(Long id, boolean active, Long actingUserId) {
        if (!active && id.equals(actingUserId)) {
            throw new BusinessException("Você não pode desativar o seu próprio usuário");
        }
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        return UserResponse.from(userRepository.save(user.toBuilder().active(active).build()));
    }
}
