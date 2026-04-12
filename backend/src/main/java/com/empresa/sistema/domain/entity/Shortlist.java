package com.empresa.sistema.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "shortlists")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shortlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    @NotNull(message = "Vaga é obrigatória")
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    @NotNull(message = "Candidato é obrigatório")
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "headhunter_id", nullable = false)
    @NotNull(message = "Headhunter é obrigatório")
    private Headhunter headhunter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ShortlistStatus status = ShortlistStatus.SENT;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Column(name = "viewed_at")
    private LocalDateTime viewedAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "client_feedback", columnDefinition = "TEXT")
    private String clientFeedback;

    @Column(name = "position_in_shortlist")
    private Integer positionInShortlist;

    @Column(name = "presentation_text", columnDefinition = "TEXT")
    private String presentationText;

    @PrePersist
    protected void onCreate() {
        if (sentAt == null) {
            sentAt = LocalDateTime.now();
        }
    }

    public enum ShortlistStatus {
        SENT,           // Enviado para o cliente
        VIEWED,         // Visualizado pelo cliente
        UNDER_REVIEW,   // Em análise pelo cliente
        INTERVIEW_REQUESTED, // Cliente solicitou entrevista
        APPROVED,       // Aprovado pelo cliente
        REJECTED,       // Rejeitado pelo cliente
        WITHDRAWN       // Retirado pelo headhunter
    }
}