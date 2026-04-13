package com.empresa.sistema.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_applications",
       uniqueConstraints = @UniqueConstraint(columnNames = {"candidate_id", "job_id"}))
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "candidate_id", nullable = false)
    @NotNull(message = "Candidato é obrigatório")
    @JsonIgnoreProperties({"applications", "experiences", "education", "hibernateLazyInitializer"})
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "job_id", nullable = false)
    @NotNull(message = "Vaga é obrigatória")
    @JsonIgnoreProperties({"applications", "headhunter", "client", "hibernateLazyInitializer"})
    private Job job;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status = ApplicationStatus.APPLIED;

    @Column(name = "cover_letter", columnDefinition = "TEXT")
    private String coverLetter;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "applied_at", nullable = false)
    private LocalDateTime appliedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "interview_date")
    private LocalDateTime interviewDate;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "rating")
    private Integer rating; // 1-5 stars

    @Column(name = "hired_at")
    private LocalDateTime hiredAt;

    @PrePersist
    protected void onCreate() {
        appliedAt = LocalDateTime.now();
    }

    // Constructors
    public JobApplication() {}

    public JobApplication(Candidate candidate, Job job) {
        this.candidate = candidate;
        this.job = job;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Candidate getCandidate() { return candidate; }
    public void setCandidate(Candidate candidate) { this.candidate = candidate; }

    public Job getJob() { return job; }
    public void setJob(Job job) { this.job = job; }

    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }

    public String getCoverLetter() { return coverLetter; }
    public void setCoverLetter(String coverLetter) { this.coverLetter = coverLetter; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getAppliedAt() { return appliedAt; }
    public void setAppliedAt(LocalDateTime appliedAt) { this.appliedAt = appliedAt; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public LocalDateTime getInterviewDate() { return interviewDate; }
    public void setInterviewDate(LocalDateTime interviewDate) { this.interviewDate = interviewDate; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public LocalDateTime getHiredAt() { return hiredAt; }
    public void setHiredAt(LocalDateTime hiredAt) { this.hiredAt = hiredAt; }

    // Enum
    public enum ApplicationStatus {
        APPLIED, UNDER_REVIEW, SHORTLISTED, INTERVIEW_SCHEDULED,
        INTERVIEWED, TECHNICAL_TEST, OFFER_MADE, HIRED, REJECTED, WITHDRAWN
    }
}