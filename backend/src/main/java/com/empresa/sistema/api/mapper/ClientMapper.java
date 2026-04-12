package com.empresa.sistema.api.mapper;

import com.empresa.sistema.api.dto.request.ClientCreateRequest;
import com.empresa.sistema.api.dto.request.ClientUpdateRequest;
import com.empresa.sistema.api.dto.response.ClientResponse;
import com.empresa.sistema.domain.entity.Client;
import org.mapstruct.*;

import java.util.List;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    builder = @Builder(disableBuilder = true)
)
public interface ClientMapper {

    // Response mappings
    ClientResponse toResponse(Client client);

    List<ClientResponse> toResponseList(List<Client> clients);

    // Request to Entity mappings
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true) // Will be set in service
    @Mapping(target = "jobs", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Client toEntity(ClientCreateRequest request);

    // Update mapping
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "jobs", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(ClientUpdateRequest request, @MappingTarget Client client);
}