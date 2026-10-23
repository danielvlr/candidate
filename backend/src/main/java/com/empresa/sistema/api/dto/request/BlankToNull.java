package com.empresa.sistema.api.dto.request;

/** Normaliza campos opcionais vindos do formulário: string vazia ou só espaços vira {@code null}. */
final class BlankToNull {

    private BlankToNull() {
    }

    static String of(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
