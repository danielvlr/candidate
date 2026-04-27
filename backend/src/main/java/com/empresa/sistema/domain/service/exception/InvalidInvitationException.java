package com.empresa.sistema.domain.service.exception;

public class InvalidInvitationException extends RuntimeException {

    public InvalidInvitationException(String message) {
        super(message);
    }

    public InvalidInvitationException(String message, Throwable cause) {
        super(message, cause);
    }
}
