package com.empresa.sistema.api.dto.request;

import com.empresa.sistema.domain.entity.Job;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

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

    private BigDecimal jobValue;
    private BigDecimal finalValue;
    private Integer guaranteeDays;
    private LocalDateTime closedAt;
    private LocalDateTime lastDeliveryAt;

    // Campos importados do Jestor
    private LocalDateTime firstDeliveryAt;
    private LocalDateTime frozenAt;
    private String commissionType;
    private String seniorityLabel;
    private String state;
    private Boolean isReplacement;
    private Boolean isConfidential;
    private Boolean contactMade;
    private Boolean closedOnFirstSend;
    private Boolean initialCheckin;
}