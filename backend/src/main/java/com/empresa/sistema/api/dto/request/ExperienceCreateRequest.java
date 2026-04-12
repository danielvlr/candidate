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
public class ExperienceCreateRequest {

    @NotBlank(message = "Título do cargo é obrigatório")
    @Size(max = 100, message = "Título deve ter no máximo 100 caracteres")
    private String jobTitle;

    @NotBlank(message = "Nome da empresa é obrigatório")
    @Size(max = 100, message = "Nome da empresa deve ter no máximo 100 caracteres")
    private String companyName;

    @Size(max = 100, message = "Localização deve ter no máximo 100 caracteres")
    private String location;

    @NotNull(message = "Data de início é obrigatória")
    private LocalDate startDate;

    private LocalDate endDate;

    @Builder.Default
    private Boolean isCurrent = false;

    private String description;
}