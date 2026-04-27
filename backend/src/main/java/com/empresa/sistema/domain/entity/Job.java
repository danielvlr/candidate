package com.empresa.sistema.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "jobs")
@Getter @Setter
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Título é obrigatório")
    @Size(max = 100, message = "Título deve ter no máximo 100 caracteres")
    @Column(nullable = false)
    private String title;

    @NotBlank(message = "Descrição é obrigatória")
    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Size(max = 100, message = "Empresa deve ter no máximo 100 caracteres")
    @Column(name = "company_name")
    private String companyName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    @NotNull(message = "Empresa é obrigatória")
    private Client client;

    @Size(max = 100, message = "Localização deve ter no máximo 100 caracteres")
    private String location;

    @Column(name = "salary_min")
    private Double salaryMin;

    @Column(name = "salary_max")
    private Double salaryMax;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_type")
    private JobType jobType = JobType.FULL_TIME;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_mode")
    private WorkMode workMode = WorkMode.ONSITE;

    @Enumerated(EnumType.STRING)
    @Column(name = "experience_level")
    private ExperienceLevel experienceLevel = ExperienceLevel.MID;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(columnDefinition = "TEXT")
    private String benefits;

    @Column(columnDefinition = "TEXT")
    private String responsibilities;

    @Column(name = "skills_required", columnDefinition = "TEXT")
    private String skillsRequired;

    @Enumerated(EnumType.STRING)
    private JobStatus status = JobStatus.ACTIVE;

    @Column(name = "application_deadline")
    private LocalDate applicationDeadline;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "contact_email")
    @Email(message = "Email deve ser válido")
    private String contactEmail;

    @Column(name = "external_url")
    private String externalUrl;

    @Column(name = "is_urgent")
    private Boolean isUrgent = false;

    @Column(name = "is_featured")
    private Boolean isFeatured = false;

    @Column(name = "views_count")
    private Integer viewsCount = 0;

    @Column(name = "applications_count")
    private Integer applicationsCount = 0;

    @Column(name = "job_value")
    private BigDecimal jobValue;

    @Column(name = "final_value")
    private BigDecimal finalValue;

    @Column(name = "guarantee_days")
    private Integer guaranteeDays = 90; // Default 3 months

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "last_delivery_at")
    private LocalDateTime lastDeliveryAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_category")
    private ServiceCategory serviceCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "pipeline_stage")
    private PipelineStage pipelineStage = PipelineStage.SOURCING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "headhunter_id")
    private Headhunter headhunter;

    @Column(name = "jestor_id", unique = true)
    private String jestorId;

    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<JobApplication> applications = new ArrayList<>();

    // Flag transiente — quando true, @PreUpdate NÃO bump updatedAt nesse save.
    // Usada pelo JestorSyncService para preservar updatedAt quando a sync
    // só altera campos não-status (assim daysPaused permanece estável).
    @Transient
    @JsonIgnore
    private transient boolean skipUpdatedAtBump = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        if (!skipUpdatedAtBump) {
            updatedAt = LocalDateTime.now();
        }
        skipUpdatedAtBump = false;
    }

    // Constructors
    public Job() {}

    public Job(String title, String description, String companyName) {
        this.title = title;
        this.description = description;
        this.companyName = companyName;
    }

    public Job(String title, String description, Client client) {
        this.title = title;
        this.description = description;
        this.client = client;
        this.companyName = client != null ? client.getCompanyName() : null;
    }

    // Enums
    public enum JobType {
        FULL_TIME, PART_TIME, CONTRACT, TEMPORARY, INTERNSHIP, FREELANCE
    }

    public enum WorkMode {
        REMOTE, ONSITE, HYBRID
    }

    public enum ExperienceLevel {
        ENTRY, JUNIOR, MID, SENIOR, LEAD, PRINCIPAL
    }

    public enum JobStatus {
        DRAFT, ACTIVE, PAUSED, CLOSED, EXPIRED, WARRANTY
    }

    public enum ServiceCategory {
        PROJETOS,          // 60 dias de garantia
        NOSSO_HEADHUNTER,  // 90 dias de garantia
        TATICAS,           // 90 dias de garantia
        EXECUTIVAS         // 180 dias de garantia
    }

    public enum PipelineStage {
        SOURCING,       // Prospecção de candidatos
        SCREENING,      // Triagem inicial
        SHORTLISTED,    // Lista curta para cliente
        INTERVIEW,      // Em entrevista
        OFFER,          // Proposta feita
        HIRED,          // Contratado
        WARRANTY        // Em período de garantia
    }
}