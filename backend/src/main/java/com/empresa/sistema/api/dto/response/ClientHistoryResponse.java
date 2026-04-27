package com.empresa.sistema.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientHistoryResponse {

    private Long id;
    private Long clientId;
    private String clientName;
    private Long headhunterId;
    private String headhunterName;
    private String type;
    private String title;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime scheduledDate;
    private LocalDateTime completedAt;
    private String status;
    private String metadata;
}
