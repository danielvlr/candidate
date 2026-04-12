package com.empresa.sistema.api.dto.response;

import com.empresa.sistema.domain.entity.Assessorado;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessoradoResponse {

    private Long id;

    // Candidate fields
    private Long candidateId;
    private String candidateName;
    private String candidateEmail;
    private String candidateHeadline;
    private String candidateSkills;
    private String candidateProfilePictureUrl;

    // Senior (Headhunter) fields
    private Long seniorId;
    private String seniorName;

    // Assessorado fields
    private LocalDate advisoryStartDate;
    private LocalDate advisoryEndDate;
    private String specializations;
    private String objectives;
    private Assessorado.AssessoradoPhase currentPhase;
    private String notes;
    private Assessorado.AssessoradoStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
