package com.empresa.sistema.api.dto.auth;

import com.empresa.sistema.domain.entity.AppUser;

public record UserResponse(Long id, String email, String fullName, String role, Long headhunterId, boolean active) {

    public static UserResponse from(AppUser user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getFullName(),
                user.getRole().name(), user.getHeadhunterId(), user.isActive());
    }
}
