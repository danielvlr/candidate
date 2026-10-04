package com.empresa.sistema.domain.service.exception;

public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("Email ou senha inválidos");
    }
}
