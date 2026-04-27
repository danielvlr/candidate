package com.empresa.sistema.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "client_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    // TODO: enforce nullable=false once auth is wired and request context provides headhunter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "headhunter_id", nullable = true)
    private Headhunter headhunter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobHistory.HistoryType type;

    @Column(length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "scheduled_date")
    private LocalDateTime scheduledDate;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(length = 64)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
