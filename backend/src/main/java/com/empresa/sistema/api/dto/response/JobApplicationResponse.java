package com.empresa.sistema.api.dto.response;

import com.empresa.sistema.domain.entity.JobApplication;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobApplicationResponse {

    private Long id;
    private Long candidateId;
    private String candidateName;
    private String candidateEmail;
    private String candidatePhone;
    private String candidateProfilePictureUrl;
    private String candidateHeadline;
    private String candidateCity;
    private Long jobId;
    private String jobTitle;
    private JobApplication.ApplicationStatus status;
    private String coverLetter;
    private String notes;
    private LocalDateTime appliedAt;
    private LocalDateTime reviewedAt;
    private LocalDateTime interviewDate;
    private String feedback;
    private Integer rating;
}