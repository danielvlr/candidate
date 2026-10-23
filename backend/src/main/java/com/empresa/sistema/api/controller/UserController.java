package com.empresa.sistema.api.controller;

import com.empresa.sistema.api.dto.auth.UserCreateRequest;
import com.empresa.sistema.api.dto.auth.UserResponse;
import com.empresa.sistema.api.dto.auth.UserRoleUpdateRequest;
import com.empresa.sistema.domain.service.UserService;
import com.empresa.sistema.security.AuthenticatedUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Gestão de usuários do sistema — restrito a ADMIN (ver SecurityConfig). */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> list() {
        return ResponseEntity.ok(userService.list());
    }

    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody UserCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.create(request));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<UserResponse> updateRole(@PathVariable Long id,
                                                   @Valid @RequestBody UserRoleUpdateRequest request,
                                                   @AuthenticationPrincipal AuthenticatedUser principal) {
        return ResponseEntity.ok(userService.updateRole(id, request, principal.id()));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<UserResponse> activate(@PathVariable Long id,
                                                 @AuthenticationPrincipal AuthenticatedUser principal) {
        return ResponseEntity.ok(userService.setActive(id, true, principal.id()));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<UserResponse> deactivate(@PathVariable Long id,
                                                   @AuthenticationPrincipal AuthenticatedUser principal) {
        return ResponseEntity.ok(userService.setActive(id, false, principal.id()));
    }
}
