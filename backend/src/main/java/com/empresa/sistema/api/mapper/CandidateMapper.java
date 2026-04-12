package com.empresa.sistema.api.mapper;

import com.empresa.sistema.api.dto.request.CandidateCreateRequest;
import com.empresa.sistema.api.dto.request.CandidateUpdateRequest;
import com.empresa.sistema.api.dto.response.CandidateResponse;
import com.empresa.sistema.domain.entity.Candidate;
import org.mapstruct.*;

import java.util.List;

@Mapper(
    componentModel = "spring",
    uses = {ExperienceMapper.class, EducationMapper.class},
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    builder = @Builder(disableBuilder = true)
)
public interface CandidateMapper {

    // Response mappings
    @Mapping(target = "experiences", source = "experiences")
    @Mapping(target = "education", source = "education")
    CandidateResponse toResponse(Candidate candidate);

    List<CandidateResponse> toResponseList(List<Candidate> candidates);

    // Request to Entity mappings
    @Mapping(target = "experiences", source = "experiences")
    @Mapping(target = "education", source = "education")
    @Mapping(target = "applications", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true) // Will be set in service
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Candidate toEntity(CandidateCreateRequest request);

    // Update mapping
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "experiences", source = "experiences")
    @Mapping(target = "education", source = "education")
    @Mapping(target = "applications", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(CandidateUpdateRequest request, @MappingTarget Candidate candidate);

}