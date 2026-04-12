package com.empresa.sistema.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "assessorado_history")
public class AssessoradoHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Assessorado é obrigatório")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessorado_id", nullable = false)
    private Assessorado assessorado;

    @NotNull(message = "Tipo de ação é obrigatório")
    @Enumerated(EnumType.STRING)
    @Column(name = "action_type")
    private ActionType actionType;

    @NotBlank(message = "Título é obrigatório")
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "changed_field")
    private String changedField;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Constructors
    public AssessoradoHistory() {}

    public AssessoradoHistory(Assessorado assessorado, ActionType actionType, String title, String description) {
        this.assessorado = assessorado;
        this.actionType = actionType;
        this.title = title;
        this.description = description;
    }

    public AssessoradoHistory(Assessorado assessorado, ActionType actionType, String title, String description,
                              String changedField, String oldValue, String newValue) {
        this.assessorado = assessorado;
        this.actionType = actionType;
        this.title = title;
        this.description = description;
        this.changedField = changedField;
        this.oldValue = oldValue;
        this.newValue = newValue;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Assessorado getAssessorado() { return assessorado; }
    public void setAssessorado(Assessorado assessorado) { this.assessorado = assessorado; }

    public ActionType getActionType() { return actionType; }
    public void setActionType(ActionType actionType) { this.actionType = actionType; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getOldValue() { return oldValue; }
    public void setOldValue(String oldValue) { this.oldValue = oldValue; }

    public String getNewValue() { return newValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }

    public String getChangedField() { return changedField; }
    public void setChangedField(String changedField) { this.changedField = changedField; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Enum
    public enum ActionType {
        NOTE, PHASE_CHANGED, MEETING, CV_REVIEW, INTERVIEW_PREP,
        JOB_SUGGESTED, JOB_APPLIED, FEEDBACK, CREATED, UPDATED, STATUS_CHANGED
    }
}
