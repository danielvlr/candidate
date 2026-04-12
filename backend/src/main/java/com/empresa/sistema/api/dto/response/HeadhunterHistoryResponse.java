package com.empresa.sistema.api.dto.response;

import com.empresa.sistema.domain.entity.HeadhunterHistory;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeadhunterHistoryResponse {

    private Long id;
    private Long headhunterId;
    private String headhunterName;
    private HeadhunterHistory.ActionType actionType;
    private String description;
    private String oldValue;
    private String newValue;
    private String changedField;
    private String changedBy;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime createdAt;
}