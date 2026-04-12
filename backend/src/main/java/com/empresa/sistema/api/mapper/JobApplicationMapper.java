package com.empresa.sistema.api.mapper;

import com.empresa.sistema.api.dto.response.JobApplicationResponse;
import com.empresa.sistema.domain.entity.JobApplication;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface JobApplicationMapper {

    @Mapping(target = "candidateId", source = "candidate.id")
    @Mapping(target = "candidateName", source = "candidate.fullName")
    @Mapping(target = "candidateEmail", source = "candidate.email")
    @Mapping(target = "candidatePhone", ignore = true)
    @Mapping(target = "candidateProfilePictureUrl", source = "candidate.profilePictureUrl")
    @Mapping(target = "candidateHeadline", source = "candidate.headline")
    @Mapping(target = "candidateCity", source = "candidate.city")
    @Mapping(target = "jobId", source = "job.id")
    @Mapping(target = "jobTitle", source = "job.title")
    JobApplicationResponse toResponse(JobApplication jobApplication);

    List<JobApplicationResponse> toResponseList(List<JobApplication> jobApplications);
}