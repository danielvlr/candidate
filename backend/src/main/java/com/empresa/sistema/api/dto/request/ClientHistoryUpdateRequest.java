package com.empresa.sistema.api.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientHistoryUpdateRequest {

    private String title;
    private String description;
    private LocalDateTime scheduledDate;
    private LocalDateTime completedAt;
    private String status;
    private String metadata;
}
