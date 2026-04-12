package com.empresa.sistema.api.dto.response;

import com.empresa.sistema.domain.entity.Candidate;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateResponse {

    private Long id;
    private String fullName;
    private String email;
    private LocalDate dateOfBirth;
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private String headline;
    private Double desiredSalary;
    private String summary;
    private String skills;
    private List<ExperienceResponse> experiences;
    private List<EducationResponse> education;
    private Candidate.CandidateStatus status;
    private String linkedinUrl;
    private String githubUrl;
    private String portfolioUrl;
    private String cvFilePath;
    private String profilePictureUrl;
    private LocalDate availabilityDate;
    private Boolean willingToRelocate;
    private Candidate.WorkPreference workPreference;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}