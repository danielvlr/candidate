package com.empresa.sistema.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobMatchResponse {

    private JobResponse job;
    private int matchScore;
    private List<String> matchingSkills;
    private List<String> matchReasons;
}
