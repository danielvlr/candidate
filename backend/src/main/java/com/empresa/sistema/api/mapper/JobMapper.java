package com.empresa.sistema.api.mapper;

import com.empresa.sistema.api.dto.request.JobCreateRequest;
import com.empresa.sistema.api.dto.request.JobUpdateRequest;
import com.empresa.sistema.api.dto.response.JobResponse;
import com.empresa.sistema.api.dto.response.ClientSummaryResponse;
import com.empresa.sistema.domain.entity.Job;
import com.empresa.sistema.domain.entity.Client;
import org.mapstruct.*;

import java.util.List;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    builder = @Builder(disableBuilder = true),
    uses = {ClientMapper.class, HeadhunterMapper.class, JobApplicationMapper.class, ShortlistMapper.class, JobHistoryMapper.class}
)
public interface JobMapper {

    // Response mappings
    @Mapping(target = "client", source = "client")
    JobResponse toResponse(Job job);

    // Detailed job response
    @Mapping(target = "client", source = "client")
    @Mapping(target = "headhunter", source = "headhunter")
    @Mapping(target = "applications", source = "applications")
    @Mapping(target = "shortlists", ignore = true)
    @Mapping(target = "history", ignore = true)
    @Mapping(target = "totalApplications", ignore = true)
    @Mapping(target = "totalShortlists", ignore = true)
    @Mapping(target = "totalHistory", ignore = true)
    @Mapping(target = "shortlistsApproved", ignore = true)
    @Mapping(target = "shortlistsRejected", ignore = true)
    @Mapping(target = "shortlistsPending", ignore = true)
    com.empresa.sistema.api.dto.response.JobDetailResponse toDetailResponse(Job job);

    // Mapper para ClientSummaryResponse
    @Mapping(target = "id", source = "id")
    @Mapping(target = "companyName", source = "companyName")
    @Mapping(target = "contactEmail", source = "contactEmail")
    @Mapping(target = "contactPhone", source = "contactPhone")
    @Mapping(target = "city", source = "city")
    @Mapping(target = "state", source = "state")
    @Mapping(target = "industry", source = "industry")
    @Mapping(target = "type", source = "type")
    @Mapping(target = "logoUrl", source = "logoUrl")
    ClientSummaryResponse toClientSummary(Client client);

    List<JobResponse> toResponseList(List<Job> jobs);

    // Request to Entity mappings
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "client", ignore = true) // Will be set in service based on clientId
    @Mapping(target = "status", ignore = true) // Will be set in service
    @Mapping(target = "viewsCount", ignore = true)
    @Mapping(target = "applicationsCount", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "pipelineStage", ignore = true)
    Job toEntity(JobCreateRequest request);

    // Update mapping
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "client", ignore = true) // Will be handled in service based on clientId
    @Mapping(target = "viewsCount", ignore = true)
    @Mapping(target = "applicationsCount", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(JobUpdateRequest request, @MappingTarget Job job);
}