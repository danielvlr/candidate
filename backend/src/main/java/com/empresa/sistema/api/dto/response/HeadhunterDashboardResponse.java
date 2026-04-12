package com.empresa.sistema.api.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeadhunterDashboardResponse {

    private DashboardMetrics metrics;
    private List<OpenJobResponse> openJobs;
    private List<ClosedJobResponse> recentlyClosedJobs;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardMetrics {
        private Long totalJobs;
        private Long activeCandidates;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OpenJobResponse {
        private Long id;
        private String title;
        private String companyName;
        private LocalDateTime createdAt;
        private Long daysOpen;
        private LocalDateTime lastDeliveryAt;
        private Integer applicationsCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClosedJobResponse {
        private Long id;
        private String title;
        private String companyName;
        private LocalDateTime closedAt;
        private BigDecimal jobValue;
        private Integer guaranteeDays;
        private Long daysUntilGuaranteeEnd;
    }
}