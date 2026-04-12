package com.empresa.sistema.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "job_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    @NotNull(message = "Vaga é obrigatória")
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "headhunter_id")
    private Headhunter headhunter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id")
    private Candidate candidate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HistoryType type;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "scheduled_date")
    private LocalDateTime scheduledDate;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private HistoryStatus status = HistoryStatus.COMPLETED;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // JSON for additional data

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public enum HistoryType {
        NOTE,                    // Anotação geral
        INTERVIEW_SCHEDULED,     // Entrevista agendada
        INTERVIEW_COMPLETED,     // Entrevista realizada
        FEEDBACK_RECEIVED,       // Feedback recebido
        STATUS_CHANGED,          // Mudança de status
        SHORTLIST_SENT,          // Shortlist enviado
        CANDIDATE_APPLIED,       // Candidato se candidatou
        CANDIDATE_CONTACTED,     // Candidato contatado
        CLIENT_MEETING,          // Reunião com cliente
        TECHNICAL_TEST,          // Teste técnico
        REFERENCE_CHECK,         // Verificação de referências
        OFFER_MADE,             // Proposta feita
        OFFER_ACCEPTED,         // Proposta aceita
        OFFER_REJECTED,         // Proposta rejeitada
        CONTRACT_SIGNED,        // Contrato assinado
        CANDIDATE_STARTED,      // Candidato iniciou
        GUARANTEE_PERIOD,       // Período de garantia
        OTHER                   // Outros tipos
    }

    public enum HistoryStatus {
        PENDING,     // Pendente
        IN_PROGRESS, // Em andamento
        COMPLETED,   // Concluído
        CANCELLED    // Cancelado
    }
}