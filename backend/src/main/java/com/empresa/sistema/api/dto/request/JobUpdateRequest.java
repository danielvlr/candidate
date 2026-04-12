package com.empresa.sistema.api.dto.request;

import com.empresa.sistema.domain.entity.Job;
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
public class JobUpdateRequest {

    @Size(max = 100, message = "Título deve ter no máximo 100 caracteres")
    private String title;

    private String description;

    private Long clientId;

    @Size(max = 100, message = "Empresa deve ter no máximo 100 caracteres")
    private String companyName;

    @Size(max = 100, message = "Localização deve ter no máximo 100 caracteres")
    private String location;

    @DecimalMin(value = "0.0", message = "Salário mínimo deve ser positivo")
    private Double salaryMin;

    @DecimalMin(value = "0.0", message = "Salário máximo deve ser positivo")
    private Double salaryMax;

    private Job.JobType jobType;
    private Job.WorkMode workMode;
    private Job.ExperienceLevel experienceLevel;
    private Job.ServiceCategory serviceCategory;
    private Job.PipelineStage pipelineStage;
    private String requirements;
    private String benefits;
    private String responsibilities;
    private String skillsRequired;
    private Job.JobStatus status;
    private LocalDate applicationDeadline;
    private LocalDate startDate;

    @Email(message = "Email deve ser válido")
    private String contactEmail;

    private String externalUrl;
    private Boolean isUrgent;
    private Boolean isFeatured;
}