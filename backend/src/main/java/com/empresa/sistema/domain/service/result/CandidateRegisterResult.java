package com.empresa.sistema.domain.service.result;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CandidateRegisterResult {

    private Long candidateId;
    private String message;
}
