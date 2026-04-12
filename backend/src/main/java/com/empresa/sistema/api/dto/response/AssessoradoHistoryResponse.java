package com.empresa.sistema.api.dto.response;

import com.empresa.sistema.domain.entity.AssessoradoHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessoradoHistoryResponse {

    private Long id;
    private Long assessoradoId;
    private AssessoradoHistory.ActionType actionType;
    private String title;
    private String description;
    private String oldValue;
    private String newValue;
    private String changedField;
    private LocalDateTime createdAt;
}
