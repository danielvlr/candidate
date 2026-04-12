package com.empresa.sistema.api.dto.response;

import com.empresa.sistema.domain.entity.Job;
import com.empresa.sistema.domain.entity.Warranty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarrantyResponse {

    private Long id;
    private Long jobId;
    private String jobTitle;
    private Long jobApplicationId;
    private Long headhunterId;
    private String headhunterName;
    private String candidateName;
    private String clientName;
    private String contactPersonName;
    private String contactEmail;
    private Job.ServiceCategory serviceCategory;
    private Integer guaranteeDays;
    private LocalDate startDate;
    private LocalDate endDate;
    private Warranty.WarrantyStatus status;
    private LocalDateTime notificationSentAt;
    private LocalDateTime breachedAt;
    private String breachReason;
    private Long daysRemaining;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static WarrantyResponse fromEntity(Warranty warranty) {
        long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), warranty.getEndDate());

        return WarrantyResponse.builder()
                .id(warranty.getId())
                .jobId(warranty.getJob().getId())
                .jobTitle(warranty.getJob().getTitle())
                .jobApplicationId(warranty.getJobApplication().getId())
                .headhunterId(warranty.getHeadhunter() != null ? warranty.getHeadhunter().getId() : null)
                .headhunterName(warranty.getHeadhunter() != null ? warranty.getHeadhunter().getFullName() : null)
                .candidateName(warranty.getJobApplication().getCandidate().getFullName())
                .clientName(warranty.getJob().getClient() != null ? warranty.getJob().getClient().getCompanyName() : warranty.getJob().getCompanyName())
                .contactPersonName(warranty.getJob().getClient() != null ? warranty.getJob().getClient().getContactPersonName() : null)
                .contactEmail(warranty.getJob().getClient() != null ? warranty.getJob().getClient().getContactEmail() : null)
                .serviceCategory(warranty.getServiceCategory())
                .guaranteeDays(warranty.getGuaranteeDays())
                .startDate(warranty.getStartDate())
                .endDate(warranty.getEndDate())
                .status(warranty.getStatus())
                .notificationSentAt(warranty.getNotificationSentAt())
                .breachedAt(warranty.getBreachedAt())
                .breachReason(warranty.getBreachReason())
                .daysRemaining(Math.max(0, daysRemaining))
                .createdAt(warranty.getCreatedAt())
                .updatedAt(warranty.getUpdatedAt())
                .build();
    }
}
