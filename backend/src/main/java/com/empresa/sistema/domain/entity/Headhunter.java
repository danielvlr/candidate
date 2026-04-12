package com.empresa.sistema.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "headhunters")
public class Headhunter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
    @Column(name = "full_name", nullable = false)
    private String fullName;

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email deve ser válido")
    @Column(unique = true, nullable = false)
    private String email;

    @Pattern(regexp = "\\d{10,11}", message = "Telefone deve ter 10 ou 11 dígitos")
    private String phone;

    @NotNull(message = "Senioridade é obrigatória")
    @Enumerated(EnumType.STRING)
    private Seniority seniority;

    @Size(max = 500, message = "Áreas responsáveis devem ter no máximo 500 caracteres")
    @Column(name = "responsible_areas", columnDefinition = "TEXT")
    private String responsibleAreas;

    @NotNull(message = "Custo fixo é obrigatório")
    @DecimalMin(value = "0.0", message = "Custo fixo deve ser positivo")
    @Column(name = "fixed_cost", precision = 10, scale = 2)
    private BigDecimal fixedCost;

    @NotNull(message = "Custo variável é obrigatório")
    @DecimalMin(value = "0.0", message = "Custo variável deve ser positivo")
    @DecimalMax(value = "100.0", message = "Custo variável deve ser no máximo 100%")
    @Column(name = "variable_cost", precision = 5, scale = 2)
    private BigDecimal variableCost; // Percentual sobre contratação

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private HeadhunterStatus status = HeadhunterStatus.ACTIVE;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Size(max = 1000, message = "Biografia deve ter no máximo 1000 caracteres")
    @Column(columnDefinition = "TEXT")
    private String biography;

    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    @Column(name = "jestor_id", unique = true)
    private String jestorId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "headhunter", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<HeadhunterHistory> history = new ArrayList<>();

    @OneToMany(mappedBy = "headhunter", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Job> jobs = new ArrayList<>();

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
    public Headhunter() {}

    public Headhunter(String fullName, String email, Seniority seniority) {
        this.fullName = fullName;
        this.email = email;
        this.seniority = seniority;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Seniority getSeniority() { return seniority; }
    public void setSeniority(Seniority seniority) { this.seniority = seniority; }

    public String getResponsibleAreas() { return responsibleAreas; }
    public void setResponsibleAreas(String responsibleAreas) { this.responsibleAreas = responsibleAreas; }

    public BigDecimal getFixedCost() { return fixedCost; }
    public void setFixedCost(BigDecimal fixedCost) { this.fixedCost = fixedCost; }

    public BigDecimal getVariableCost() { return variableCost; }
    public void setVariableCost(BigDecimal variableCost) { this.variableCost = variableCost; }

    public HeadhunterStatus getStatus() { return status; }
    public void setStatus(HeadhunterStatus status) { this.status = status; }

    public String getLinkedinUrl() { return linkedinUrl; }
    public void setLinkedinUrl(String linkedinUrl) { this.linkedinUrl = linkedinUrl; }

    public String getBiography() { return biography; }
    public void setBiography(String biography) { this.biography = biography; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<HeadhunterHistory> getHistory() { return history; }
    public void setHistory(List<HeadhunterHistory> history) { this.history = history; }

    public List<Job> getJobs() { return jobs; }
    public void setJobs(List<Job> jobs) { this.jobs = jobs; }

    public String getJestorId() { return jestorId; }
    public void setJestorId(String jestorId) { this.jestorId = jestorId; }

    // Enums
    public enum Seniority {
        JUNIOR, PLENO, SENIOR, ESPECIALISTA
    }

    public enum HeadhunterStatus {
        ACTIVE, INACTIVE, SUSPENDED
    }
}