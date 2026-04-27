package com.empresa.sistema.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Aggregated timeline entry combining ClientHistory ("EMPRESA") and
 * JobHistory ("VAGA") rows for a single client.
 *
 * NOTE: {@code id} is the source row's primary key. It is unique only
 * per-origin — the (origin, id) pair is the real composite identity.
 * Consumers must not assume {@code id} alone is globally unique across
 * the timeline.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimelineEntryDTO {

    private Long id;
    private String origin; // "EMPRESA" or "VAGA"

    private Long jobId;
    private String jobTitle;

    private Long clientId;
    private String clientName;

    private Long headhunterId;
    private String headhunterName;

    private Long candidateId;
    private String candidateName;

    private String type;
    private String title;
    private String description;

    private LocalDateTime createdAt;
    private LocalDateTime scheduledDate;
    private LocalDateTime completedAt;

    private String status;
    private String metadata;
}
