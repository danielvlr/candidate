package com.empresa.sistema.api.mapper;

import com.empresa.sistema.api.dto.request.ClientHistoryCreateRequest;
import com.empresa.sistema.api.dto.request.ClientHistoryUpdateRequest;
import com.empresa.sistema.api.dto.response.ClientHistoryResponse;
import com.empresa.sistema.domain.entity.ClientHistory;
import org.mapstruct.*;

import java.util.List;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    builder = @Builder(disableBuilder = true)
)
public interface ClientHistoryMapper {

    @Mapping(target = "clientId", source = "client.id")
    @Mapping(target = "clientName", source = "client.companyName")
    @Mapping(target = "headhunterId", source = "headhunter.id")
    @Mapping(target = "headhunterName", source = "headhunter.fullName")
    @Mapping(target = "type", expression = "java(history.getType() != null ? history.getType().name() : null)")
    ClientHistoryResponse toResponse(ClientHistory history);

    List<ClientHistoryResponse> toResponseList(List<ClientHistory> histories);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "client", ignore = true)
    @Mapping(target = "headhunter", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "completedAt", ignore = true)
    ClientHistory toEntity(ClientHistoryCreateRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "client", ignore = true)
    @Mapping(target = "headhunter", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "type", ignore = true)
    void updateEntityFromRequest(ClientHistoryUpdateRequest request, @MappingTarget ClientHistory history);
}
