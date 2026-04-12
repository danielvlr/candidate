package com.empresa.sistema.api.dto.request;

import com.empresa.sistema.domain.entity.Assessorado;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessoradoCreateRequest {

    @NotNull(message = "Candidato é obrigatório")
    private Long candidateId;

    @NotNull(message = "Senior é obrigatório")
    private Long seniorId;

    @NotNull(message = "Data de início da assessoria é obrigatória")
    private LocalDate advisoryStartDate;

    private LocalDate advisoryEndDate;

    private String specializations;

    private String objectives;

    private Assessorado.AssessoradoPhase currentPhase;

    private String notes;
}
