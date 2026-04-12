package com.empresa.sistema.api.mapper;

import com.empresa.sistema.api.dto.request.AssessoradoCreateRequest;
import com.empresa.sistema.api.dto.request.AssessoradoUpdateRequest;
import com.empresa.sistema.api.dto.response.AssessoradoHistoryResponse;
import com.empresa.sistema.api.dto.response.AssessoradoResponse;
import com.empresa.sistema.domain.entity.Assessorado;
import com.empresa.sistema.domain.entity.AssessoradoHistory;
import org.mapstruct.*;

import java.util.List;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    builder = @Builder(disableBuilder = true)
)
public interface AssessoradoMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "candidate", ignore = true)
    @Mapping(target = "senior", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "history", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Assessorado toEntity(AssessoradoCreateRequest request);

    @Mapping(target = "candidateId", source = "candidate.id")
    @Mapping(target = "candidateName", source = "candidate.fullName")
    @Mapping(target = "candidateEmail", source = "candidate.email")
    @Mapping(target = "candidateHeadline", source = "candidate.headline")
    @Mapping(target = "candidateSkills", source = "candidate.skills")
    @Mapping(target = "candidateProfilePictureUrl", source = "candidate.profilePictureUrl")
    @Mapping(target = "seniorId", source = "senior.id")
    @Mapping(target = "seniorName", source = "senior.fullName")
    AssessoradoResponse toResponse(Assessorado assessorado);

    List<AssessoradoResponse> toResponseList(List<Assessorado> assessorados);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "candidate", ignore = true)
    @Mapping(target = "senior", ignore = true)
    @Mapping(target = "history", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(AssessoradoUpdateRequest request, @MappingTarget Assessorado assessorado);

    @Mapping(target = "assessoradoId", source = "assessorado.id")
    AssessoradoHistoryResponse toHistoryResponse(AssessoradoHistory history);

    List<AssessoradoHistoryResponse> toHistoryResponseList(List<AssessoradoHistory> histories);
}
