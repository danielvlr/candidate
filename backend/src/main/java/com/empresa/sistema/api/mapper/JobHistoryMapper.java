package com.empresa.sistema.api.mapper;

import com.empresa.sistema.api.dto.request.JobHistoryCreateRequest;
import com.empresa.sistema.api.dto.response.JobHistoryResponse;
import com.empresa.sistema.domain.entity.JobHistory;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface JobHistoryMapper {

    @Mapping(target = "jobId", source = "job.id")
    @Mapping(target = "jobTitle", source = "job.title")
    @Mapping(target = "headhunterId", source = "headhunter.id")
    @Mapping(target = "headhunterName", source = "headhunter.fullName")
    @Mapping(target = "candidateId", source = "candidate.id")
    @Mapping(target = "candidateName", source = "candidate.fullName")
    JobHistoryResponse toResponse(JobHistory jobHistory);

    List<JobHistoryResponse> toResponseList(List<JobHistory> jobHistories);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "job", ignore = true)
    @Mapping(target = "headhunter", ignore = true)
    @Mapping(target = "candidate", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "completedAt", ignore = true)
    JobHistory toEntity(JobHistoryCreateRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "job", ignore = true)
    @Mapping(target = "headhunter", ignore = true)
    @Mapping(target = "candidate", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void updateEntityFromRequest(JobHistoryCreateRequest request, @MappingTarget JobHistory jobHistory);
}