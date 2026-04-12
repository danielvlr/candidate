package com.empresa.sistema.api.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShortlistCreateRequest {

    @NotNull(message = "ID da vaga é obrigatório")
    private Long jobId;

    @NotNull(message = "Lista de candidatos é obrigatória")
    private List<Long> candidateIds;

    @NotNull(message = "ID do headhunter é obrigatório")
    private Long headhunterId;

    private String notes;
    private String presentationText;
}