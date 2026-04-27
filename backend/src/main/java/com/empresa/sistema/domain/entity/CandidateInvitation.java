package com.empresa.sistema.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "candidate_invitations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by_headhunter_id", nullable = false)
    private Headhunter invitedByHeadhunter;

    @Column(name = "token_hash", unique = true, nullable = false, length = 64)
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private InvitationStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "consumed_at")
    private LocalDateTime consumedAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "revoked_by_headhunter_id")
    private Long revokedByHeadhunterId;

    @Column(name = "last_resend_at")
    private LocalDateTime lastResendAt;

    @Column(name = "send_attempts")
    @Builder.Default
    private Integer sendAttempts = 0;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (sendAttempts == null) sendAttempts = 0;
    }

    public enum InvitationStatus {
        PENDING, EMAIL_FAILED, CONSUMED, EXPIRED, REVOKED, CANCELLED
    }
}
