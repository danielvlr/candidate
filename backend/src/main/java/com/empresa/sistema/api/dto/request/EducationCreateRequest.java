package com.empresa.sistema.api.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EducationCreateRequest {

    @NotBlank(message = "Nome da instituição é obrigatório")
    @Size(max = 150, message = "Nome da instituição deve ter no máximo 150 caracteres")
    private String institution;

    @Size(max = 100, message = "Grau deve ter no máximo 100 caracteres")
    private String degree;

    @Size(max = 100, message = "Área de estudo deve ter no máximo 100 caracteres")
    private String fieldOfStudy;

    private LocalDate startDate;

    private LocalDate endDate;

    private String description;
}