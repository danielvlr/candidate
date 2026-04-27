package com.empresa.sistema.api.dto.request;

import com.empresa.sistema.domain.entity.JobHistory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientHistoryCreateRequest {

    @NotNull(message = "ID do cliente é obrigatório")
    private Long clientId;

    private Long headhunterId;

    // Defaults to NOTE in the service if null
    private JobHistory.HistoryType type;

    private String title;

    @NotBlank(message = "Descrição é obrigatória")
    private String description;

    private LocalDateTime scheduledDate;

    private String status;

    private String metadata;
}
