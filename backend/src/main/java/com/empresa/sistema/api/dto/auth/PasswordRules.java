package com.empresa.sistema.api.dto.auth;

/** Política de senha única do sistema (a mesma do reset por token e do cadastro de usuários). */
public final class PasswordRules {

    public static final int MIN_LENGTH = 8;
    public static final int MAX_LENGTH = 128;
    public static final String SIZE_MESSAGE = "A senha deve ter entre 8 e 128 caracteres";

    private PasswordRules() {
    }
}
