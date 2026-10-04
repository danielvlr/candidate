package com.empresa.sistema.api.controller;

import com.empresa.sistema.api.dto.auth.UserCreateRequest;
import com.empresa.sistema.api.dto.auth.UserResponse;
import com.empresa.sistema.domain.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    @PatchMapping("/{id}/activate")
    public ResponseEntity<UserResponse> activate(@PathVariable Long id) {
        return ResponseEntity.ok(userService.setActive(id, true));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<UserResponse> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(userService.setActive(id, false));
    }
}
