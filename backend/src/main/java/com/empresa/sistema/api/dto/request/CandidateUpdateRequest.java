package com.empresa.sistema.api.dto.request;

import com.empresa.sistema.domain.entity.Candidate;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateUpdateRequest {

    @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
    private String fullName;

    @Email(message = "Email deve ser válido")
    private String email;

    private LocalDate dateOfBirth;

    @Size(max = 200, message = "Endereço deve ter no máximo 200 caracteres")
    private String address;

    @Size(max = 50, message = "Cidade deve ter no máximo 50 caracteres")
    private String city;

    @Size(max = 50, message = "Estado deve ter no máximo 50 caracteres")
    private String state;

    @Pattern(regexp = "\\d{5}-?\\d{3}", message = "CEP deve ter formato válido")
    private String zipCode;

    @Size(max = 200, message = "Headline deve ter no máximo 200 caracteres")
    private String headline;

    @DecimalMin(value = "0.0", message = "Salário deve ser positivo")
    private Double desiredSalary;

    private String summary;
    private String skills;
    private List<ExperienceUpdateRequest> experiences;
    private List<EducationUpdateRequest> education;
    private Candidate.CandidateStatus status;
    private String linkedinUrl;
    private String githubUrl;
    private String portfolioUrl;
    private String cvFilePath;
    private String profilePictureUrl;
    private LocalDate availabilityDate;
    private Boolean willingToRelocate;
    private Candidate.WorkPreference workPreference;
}