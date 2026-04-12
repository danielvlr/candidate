package com.empresa.sistema.api.mapper;

import com.empresa.sistema.api.dto.request.ExperienceCreateRequest;
import com.empresa.sistema.api.dto.request.ExperienceUpdateRequest;
import com.empresa.sistema.api.dto.response.ExperienceResponse;
import com.empresa.sistema.domain.entity.Experience;
import org.mapstruct.*;

import java.util.List;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    builder = @Builder(disableBuilder = true)
)
public interface ExperienceMapper {

    // Response mappings
    ExperienceResponse toResponse(Experience experience);

    List<ExperienceResponse> toResponseList(List<Experience> experiences);

    // Request to Entity mappings
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "candidate", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Experience toEntity(ExperienceCreateRequest request);

    List<Experience> toEntityList(List<ExperienceCreateRequest> requests);

    // Update mapping
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "candidate", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(ExperienceUpdateRequest request, @MappingTarget Experience experience);

}