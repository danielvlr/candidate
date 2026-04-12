package com.empresa.sistema.api.dto.request;

import com.empresa.sistema.domain.entity.Headhunter;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeadhunterCreateRequest {

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
    private String fullName;

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email deve ser válido")
    private String email;

    @Pattern(regexp = "\\d{10,11}", message = "Telefone deve ter 10 ou 11 dígitos")
    private String phone;

    @NotNull(message = "Senioridade é obrigatória")
    private Headhunter.Seniority seniority;

    @Size(max = 500, message = "Áreas responsáveis devem ter no máximo 500 caracteres")
    private String responsibleAreas;

    @NotNull(message = "Custo fixo é obrigatório")
    @DecimalMin(value = "0.0", message = "Custo fixo deve ser positivo")
    private BigDecimal fixedCost;

    @NotNull(message = "Custo variável é obrigatório")
    @DecimalMin(value = "0.0", message = "Custo variável deve ser positivo")
    @DecimalMax(value = "100.0", message = "Custo variável deve ser no máximo 100%")
    private BigDecimal variableCost;

    private String linkedinUrl;

    @Size(max = 1000, message = "Biografia deve ter no máximo 1000 caracteres")
    private String biography;

    private String profilePictureUrl;
}