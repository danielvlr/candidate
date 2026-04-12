package com.empresa.sistema.api.mapper;

import com.empresa.sistema.api.dto.response.HeadhunterHistoryResponse;
import com.empresa.sistema.domain.entity.HeadhunterHistory;
import org.mapstruct.*;

import java.util.List;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    builder = @Builder(disableBuilder = true)
)
public interface HeadhunterHistoryMapper {

    // Response mappings
    @Mapping(target = "headhunterId", source = "headhunter.id")
    @Mapping(target = "headhunterName", source = "headhunter.fullName")
    HeadhunterHistoryResponse toResponse(HeadhunterHistory history);

    List<HeadhunterHistoryResponse> toResponseList(List<HeadhunterHistory> histories);
}