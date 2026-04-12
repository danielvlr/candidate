package com.empresa.sistema.api.dto.response;

import com.empresa.sistema.domain.entity.JobHistory;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobHistoryResponse {

    private Long id;
    private Long jobId;
    private String jobTitle;
    private Long headhunterId;
    private String headhunterName;
    private Long candidateId;
    private String candidateName;
    private JobHistory.HistoryType type;
    private String title;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime scheduledDate;
    private LocalDateTime completedAt;
    private JobHistory.HistoryStatus status;
    private String metadata;
}