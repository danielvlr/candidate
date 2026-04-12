package com.empresa.sistema.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

@Entity
@Table(name = "headhunter_history")
public class HeadhunterHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "headhunter_id", nullable = false)
    private Headhunter headhunter;

    @NotNull(message = "Tipo de ação é obrigatório")
    @Enumerated(EnumType.STRING)
    @Column(name = "action_type")
    private ActionType actionType;

    @NotBlank(message = "Descrição é obrigatória")
    @Size(max = 500, message = "Descrição deve ter no máximo 500 caracteres")
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Size(max = 100, message = "Campo alterado deve ter no máximo 100 caracteres")
    @Column(name = "changed_field")
    private String changedField;

    @Size(max = 100, message = "Usuário responsável deve ter no máximo 100 caracteres")
    @Column(name = "changed_by")
    private String changedBy; // Email do usuário que fez a alteração

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Constructors
    public HeadhunterHistory() {}

    public HeadhunterHistory(Headhunter headhunter, ActionType actionType, String description) {
        this.headhunter = headhunter;
        this.actionType = actionType;
        this.description = description;
    }

    public HeadhunterHistory(Headhunter headhunter, ActionType actionType, String description,
                           String changedField, String oldValue, String newValue, String changedBy) {
        this.headhunter = headhunter;
        this.actionType = actionType;
        this.description = description;
        this.changedField = changedField;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.changedBy = changedBy;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Headhunter getHeadhunter() { return headhunter; }
    public void setHeadhunter(Headhunter headhunter) { this.headhunter = headhunter; }

    public ActionType getActionType() { return actionType; }
    public void setActionType(ActionType actionType) { this.actionType = actionType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getOldValue() { return oldValue; }
    public void setOldValue(String oldValue) { this.oldValue = oldValue; }

    public String getNewValue() { return newValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }

    public String getChangedField() { return changedField; }
    public void setChangedField(String changedField) { this.changedField = changedField; }

    public String getChangedBy() { return changedBy; }
    public void setChangedBy(String changedBy) { this.changedBy = changedBy; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Enum
    public enum ActionType {
        CREATED,
        UPDATED,
        STATUS_CHANGED,
        COST_UPDATED,
        AREAS_UPDATED,
        LOGIN,
        LOGOUT,
        PASSWORD_CHANGED,
        PROFILE_UPDATED,
        DELETED,
        SUSPENDED,
        ACTIVATED
    }
}