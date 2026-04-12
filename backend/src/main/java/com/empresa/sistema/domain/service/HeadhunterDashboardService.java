package com.empresa.sistema.domain.service;

import com.empresa.sistema.api.dto.response.HeadhunterDashboardResponse;
import com.empresa.sistema.api.dto.response.HeadhunterDashboardResponse.DashboardMetrics;
import com.empresa.sistema.api.dto.response.HeadhunterDashboardResponse.OpenJobResponse;
import com.empresa.sistema.api.dto.response.HeadhunterDashboardResponse.ClosedJobResponse;
import com.empresa.sistema.domain.entity.Job;
import com.empresa.sistema.domain.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HeadhunterDashboardService {

    private final JobRepository jobRepository;

    public HeadhunterDashboardResponse getDashboardData(Long headhunterId) {
        // Get metrics
        DashboardMetrics metrics = getDashboardMetrics(headhunterId);

        // Get open jobs
        List<OpenJobResponse> openJobs = getOpenJobs(headhunterId);

        // Get recently closed jobs (last 3 months)
        List<ClosedJobResponse> recentlyClosedJobs = getRecentlyClosedJobs(headhunterId);

        return new HeadhunterDashboardResponse(metrics, openJobs, recentlyClosedJobs);
    }

    private DashboardMetrics getDashboardMetrics(Long headhunterId) {
        Long totalJobs = jobRepository.countJobsByHeadhunter(headhunterId);
        Long activeCandidates = jobRepository.countActiveCandidatesByHeadhunter(headhunterId);

        // Handle null values from SUM query
        if (activeCandidates == null) {
            activeCandidates = 0L;
        }

        return new DashboardMetrics(totalJobs, activeCandidates);
    }

    private List<OpenJobResponse> getOpenJobs(Long headhunterId) {
        List<Job> openJobs = jobRepository.findOpenJobsByHeadhunter(headhunterId);

        return openJobs.stream().map(job -> {
            Long daysOpen = ChronoUnit.DAYS.between(job.getCreatedAt(), LocalDateTime.now());
            return new OpenJobResponse(
                job.getId(),
                job.getTitle(),
                job.getCompanyName(),
                job.getCreatedAt(),
                daysOpen,
                job.getLastDeliveryAt(),
                job.getApplicationsCount()
            );
        }).collect(Collectors.toList());
    }

    private List<ClosedJobResponse> getRecentlyClosedJobs(Long headhunterId) {
        LocalDateTime threeMonthsAgo = LocalDateTime.now().minusMonths(3);
        List<Job> closedJobs = jobRepository.findRecentlyClosedJobsByHeadhunter(headhunterId, threeMonthsAgo);

        return closedJobs.stream().map(job -> {
            Long daysUntilGuaranteeEnd = calculateDaysUntilGuaranteeEnd(job);
            return new ClosedJobResponse(
                job.getId(),
                job.getTitle(),
                job.getCompanyName(),
                job.getClosedAt(),
                job.getJobValue(),
                job.getGuaranteeDays(),
                daysUntilGuaranteeEnd
            );
        }).collect(Collectors.toList());
    }

    private Long calculateDaysUntilGuaranteeEnd(Job job) {
        if (job.getClosedAt() == null || job.getGuaranteeDays() == null) {
            return null;
        }

        LocalDateTime guaranteeEndDate = job.getClosedAt().plusDays(job.getGuaranteeDays());
        LocalDateTime now = LocalDateTime.now();

        if (now.isAfter(guaranteeEndDate)) {
            return 0L; // Guarantee period has ended
        }

        return ChronoUnit.DAYS.between(now, guaranteeEndDate);
    }
}