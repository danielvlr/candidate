package com.empresa.sistema.api.dto.response;

import com.empresa.sistema.domain.entity.Job;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobDetailResponse {

    // Job information
    private Long id;
    private String title;
    private String description;
    private String companyName;
    private ClientResponse client;
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
    private BigDecimal jobValue;
    private Integer guaranteeDays;
    private LocalDateTime closedAt;
    private LocalDateTime lastDeliveryAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private HeadhunterResponse headhunter;

    // Related data
    private List<JobApplicationResponse> applications;
    private List<ShortlistResponse> shortlists;
    private List<JobHistoryResponse> history;

    // Statistics
    private Long totalApplications;
    private Long totalShortlists;
    private Long totalHistory;
    private Long shortlistsApproved;
    private Long shortlistsRejected;
    private Long shortlistsPending;
}