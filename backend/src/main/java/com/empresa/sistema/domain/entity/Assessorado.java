package com.empresa.sistema.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "assessorados")
public class Assessorado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Candidato é obrigatório")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @NotNull(message = "Senior é obrigatório")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "senior_id", nullable = false)
    private Headhunter senior;

    @NotNull(message = "Data de início da assessoria é obrigatória")
    @Column(name = "advisory_start_date", nullable = false)
    private LocalDate advisoryStartDate;

    @Column(name = "advisory_end_date")
    private LocalDate advisoryEndDate;

    @Column(columnDefinition = "TEXT")
    private String specializations;

    @Column(columnDefinition = "TEXT")
    private String objectives;

    @NotNull(message = "Fase atual é obrigatória")
    @Enumerated(EnumType.STRING)
    @Column(name = "current_phase", nullable = false)
    private AssessoradoPhase currentPhase = AssessoradoPhase.ONBOARDING;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @NotNull(message = "Status é obrigatório")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssessoradoStatus status = AssessoradoStatus.ACTIVE;

    @OneToMany(mappedBy = "assessorado", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<AssessoradoHistory> history = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Constructors
    public Assessorado() {}

    public Assessorado(Candidate candidate, Headhunter senior, LocalDate advisoryStartDate) {
        this.candidate = candidate;
        this.senior = senior;
        this.advisoryStartDate = advisoryStartDate;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Candidate getCandidate() { return candidate; }
    public void setCandidate(Candidate candidate) { this.candidate = candidate; }

    public Headhunter getSenior() { return senior; }
    public void setSenior(Headhunter senior) { this.senior = senior; }

    public LocalDate getAdvisoryStartDate() { return advisoryStartDate; }
    public void setAdvisoryStartDate(LocalDate advisoryStartDate) { this.advisoryStartDate = advisoryStartDate; }

    public LocalDate getAdvisoryEndDate() { return advisoryEndDate; }
    public void setAdvisoryEndDate(LocalDate advisoryEndDate) { this.advisoryEndDate = advisoryEndDate; }

    public String getSpecializations() { return specializations; }
    public void setSpecializations(String specializations) { this.specializations = specializations; }

    public String getObjectives() { return objectives; }
    public void setObjectives(String objectives) { this.objectives = objectives; }

    public AssessoradoPhase getCurrentPhase() { return currentPhase; }
    public void setCurrentPhase(AssessoradoPhase currentPhase) { this.currentPhase = currentPhase; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public AssessoradoStatus getStatus() { return status; }
    public void setStatus(AssessoradoStatus status) { this.status = status; }

    public List<AssessoradoHistory> getHistory() { return history; }
    public void setHistory(List<AssessoradoHistory> history) { this.history = history; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Enums
    public enum AssessoradoPhase {
        ONBOARDING, ACTIVE_SEARCH, INTERVIEW_PREP, NEGOTIATION, PLACED, COMPLETED
    }

    public enum AssessoradoStatus {
        ACTIVE, PAUSED, COMPLETED, CANCELLED
    }
}
