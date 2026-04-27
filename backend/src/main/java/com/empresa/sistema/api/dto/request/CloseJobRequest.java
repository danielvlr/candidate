package com.empresa.sistema.api.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CloseJobRequest {

    @NotNull(message = "Valor de fechamento é obrigatório")
    @DecimalMin(value = "0.0", inclusive = true, message = "Valor de fechamento deve ser >= 0")
    private BigDecimal finalValue;

    private LocalDateTime closedAt;

    private String notes;
}
