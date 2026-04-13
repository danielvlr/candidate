package com.empresa.sistema.api.dto.response;

import com.empresa.sistema.domain.entity.Job;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobResponse {

    private Long id;
    private String title;
    private String description;
    private String companyName;
    private Long clientId;
    private ClientSummaryResponse client;
    private Long headhunterId;
    private String headhunterName;
    private String location;
    private Double salaryMin;
    private Double salaryMax;
    private Job.JobType jobType;
    private Job.WorkMode workMode;
    private Job.ExperienceLevel experienceLevel;
    private String requirements;
    private String benefits;
    private String responsibilities;
    private String skillsRequired;
    private Job.JobStatus status;
    private Job.ServiceCategory serviceCategory;
    private Job.PipelineStage pipelineStage;
    private LocalDate applicationDeadline;
    private LocalDate startDate;
    private String contactEmail;
    private String externalUrl;
    private Boolean isUrgent;
    private Boolean isFeatured;
    private Integer viewsCount;
    private Integer applicationsCount;
    private java.math.BigDecimal jobValue;
    private java.math.BigDecimal finalValue;
    private Integer guaranteeDays;
    private LocalDateTime closedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}