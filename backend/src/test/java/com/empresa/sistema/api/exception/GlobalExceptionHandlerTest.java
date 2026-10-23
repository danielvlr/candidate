package com.empresa.sistema.api.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void unexpectedErrorReturnsFixedMessageWithoutInternalDetails() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response =
                handler.handleGenericException(new RuntimeException("detalhe interno: tabela secreta"));

        assertThat(response.getStatusCode().value()).isEqualTo(500);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Erro interno do servidor");
        assertThat(response.getBody().getMessage()).doesNotContain("tabela secreta");
    }
}
