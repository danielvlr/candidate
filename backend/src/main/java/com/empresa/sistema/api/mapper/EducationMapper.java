package com.empresa.sistema.api.mapper;

import com.empresa.sistema.api.dto.request.EducationCreateRequest;
import com.empresa.sistema.api.dto.request.EducationUpdateRequest;
import com.empresa.sistema.api.dto.response.EducationResponse;
import com.empresa.sistema.domain.entity.Education;
import org.mapstruct.*;

import java.util.List;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    builder = @Builder(disableBuilder = true)
)
public interface EducationMapper {

    // Response mappings
    EducationResponse toResponse(Education education);

    List<EducationResponse> toResponseList(List<Education> educations);

    // Request to Entity mappings
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "candidate", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Education toEntity(EducationCreateRequest request);

    List<Education> toEntityList(List<EducationCreateRequest> requests);

    // Update mapping
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "candidate", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(EducationUpdateRequest request, @MappingTarget Education education);

}