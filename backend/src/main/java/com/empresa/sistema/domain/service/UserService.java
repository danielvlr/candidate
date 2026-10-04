package com.empresa.sistema.domain.service;

import com.empresa.sistema.api.dto.auth.UserCreateRequest;
import com.empresa.sistema.api.dto.auth.UserResponse;
import com.empresa.sistema.domain.entity.AppUser;
import com.empresa.sistema.domain.repository.AppUserRepository;
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
    public UserResponse setActive(Long id, boolean active) {
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        return UserResponse.from(userRepository.save(user.toBuilder().active(active).build()));
    }
}
