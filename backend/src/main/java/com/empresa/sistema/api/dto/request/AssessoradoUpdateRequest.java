package com.empresa.sistema.api.dto.request;

import com.empresa.sistema.domain.entity.Assessorado;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessoradoUpdateRequest {

    private LocalDate advisoryStartDate;

    private LocalDate advisoryEndDate;

    private String specializations;

    private String objectives;

    private Assessorado.AssessoradoPhase currentPhase;

    private String notes;

    private Assessorado.AssessoradoStatus status;
}
