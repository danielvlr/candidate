package com.empresa.sistema.api.dto.response;

import com.empresa.sistema.domain.entity.Job;
import com.empresa.sistema.domain.entity.WarrantyRule;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarrantyRuleResponse {

    private Long id;
    private Job.ServiceCategory serviceCategory;
    private Integer defaultDays;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static WarrantyRuleResponse fromEntity(WarrantyRule rule) {
        return WarrantyRuleResponse.builder()
                .id(rule.getId())
                .serviceCategory(rule.getServiceCategory())
                .defaultDays(rule.getDefaultDays())
                .active(rule.getActive())
                .createdAt(rule.getCreatedAt())
                .updatedAt(rule.getUpdatedAt())
                .build();
    }
}
