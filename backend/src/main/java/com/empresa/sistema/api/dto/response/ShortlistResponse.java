package com.empresa.sistema.api.dto.response;

import com.empresa.sistema.domain.entity.Shortlist;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShortlistResponse {

    private Long id;
    private Long jobId;
    private String jobTitle;
    private Long candidateId;
    private String candidateName;
    private String candidateEmail;
    private String candidatePhone;
    private String candidateProfilePictureUrl;
    private Long headhunterId;
    private String headhunterName;
    private Shortlist.ShortlistStatus status;
    private LocalDateTime sentAt;
    private LocalDateTime viewedAt;
    private LocalDateTime respondedAt;
    private String notes;
    private String clientFeedback;
    private Integer positionInShortlist;
    private String presentationText;
}