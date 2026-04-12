package com.empresa.sistema.api.dto.request;

import com.empresa.sistema.domain.entity.JobHistory;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobHistoryCreateRequest {

    @NotNull(message = "ID da vaga é obrigatório")
    private Long jobId;

    private Long headhunterId;
    private Long candidateId;

    @NotNull(message = "Tipo é obrigatório")
    private JobHistory.HistoryType type;

    @NotBlank(message = "Título é obrigatório")
    private String title;

    private String description;
    private LocalDateTime scheduledDate;
    private JobHistory.HistoryStatus status;
    private String metadata;
}