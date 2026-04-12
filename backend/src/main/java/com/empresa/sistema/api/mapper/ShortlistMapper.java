package com.empresa.sistema.api.mapper;

import com.empresa.sistema.api.dto.request.ShortlistCreateRequest;
import com.empresa.sistema.api.dto.response.ShortlistResponse;
import com.empresa.sistema.domain.entity.Shortlist;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ShortlistMapper {

    @Mapping(target = "jobId", source = "job.id")
    @Mapping(target = "jobTitle", source = "job.title")
    @Mapping(target = "candidateId", source = "candidate.id")
    @Mapping(target = "candidateName", source = "candidate.fullName")
    @Mapping(target = "candidateEmail", source = "candidate.email")
    @Mapping(target = "candidatePhone", ignore = true)
    @Mapping(target = "candidateProfilePictureUrl", source = "candidate.profilePictureUrl")
    @Mapping(target = "headhunterId", source = "headhunter.id")
    @Mapping(target = "headhunterName", source = "headhunter.fullName")
    ShortlistResponse toResponse(Shortlist shortlist);

    List<ShortlistResponse> toResponseList(List<Shortlist> shortlists);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "job", ignore = true)
    @Mapping(target = "candidate", ignore = true)
    @Mapping(target = "headhunter", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "sentAt", ignore = true)
    @Mapping(target = "viewedAt", ignore = true)
    @Mapping(target = "respondedAt", ignore = true)
    @Mapping(target = "positionInShortlist", ignore = true)
    @Mapping(target = "clientFeedback", ignore = true)
    Shortlist toEntity(ShortlistCreateRequest request);
}