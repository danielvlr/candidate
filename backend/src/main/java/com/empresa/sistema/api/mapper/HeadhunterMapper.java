package com.empresa.sistema.api.mapper;

import com.empresa.sistema.api.dto.request.HeadhunterCreateRequest;
import com.empresa.sistema.api.dto.request.HeadhunterUpdateRequest;
import com.empresa.sistema.api.dto.response.HeadhunterResponse;
import com.empresa.sistema.domain.entity.Headhunter;
import org.mapstruct.*;

import java.util.List;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    builder = @Builder(disableBuilder = true)
)
public interface HeadhunterMapper {

    // Response mappings
    HeadhunterResponse toResponse(Headhunter headhunter);

    List<HeadhunterResponse> toResponseList(List<Headhunter> headhunters);

    // Request to Entity mappings
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true) // Will be set in service
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Headhunter toEntity(HeadhunterCreateRequest request);

    // Update mapping
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(HeadhunterUpdateRequest request, @MappingTarget Headhunter headhunter);
}