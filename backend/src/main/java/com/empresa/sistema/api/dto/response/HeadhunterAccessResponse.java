package com.empresa.sistema.api.dto.response;

import com.empresa.sistema.api.dto.auth.UserResponse;

/** Resultado de definir a senha de um headhunter: informa se o acesso (usuário) precisou ser criado. */
public record HeadhunterAccessResponse(boolean accessCreated, UserResponse user) {
}
