package com.empresa.sistema.api.dto.response;

import com.empresa.sistema.domain.entity.Headhunter;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeadhunterResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private Headhunter.Seniority seniority;
    private String responsibleAreas;
    private BigDecimal fixedCost;
    private BigDecimal variableCost;
    private Headhunter.HeadhunterStatus status;
    private String linkedinUrl;
    private String biography;
    private String profilePictureUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}