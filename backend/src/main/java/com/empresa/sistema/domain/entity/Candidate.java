package com.empresa.sistema.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "candidates")
public class Candidate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
    @Column(name = "full_name", nullable = false)
    private String fullName;

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email deve ser válido")
    @Column(unique = true, nullable = false)
    private String email;


    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Size(max = 200, message = "Endereço deve ter no máximo 200 caracteres")
    private String address;

    @Size(max = 50, message = "Cidade deve ter no máximo 50 caracteres")
    private String city;

    @Size(max = 50, message = "Estado deve ter no máximo 50 caracteres")
    private String state;

    @Pattern(regexp = "\\d{5}-?\\d{3}", message = "CEP deve ter formato válido")
    @Column(name = "zip_code")
    private String zipCode;

    @Size(max = 200, message = "Headline deve ter no máximo 200 caracteres")
    private String headline;

    @DecimalMin(value = "0.0", message = "Salário deve ser positivo")
    @Column(name = "desired_salary")
    private Double desiredSalary;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String skills;

    @OneToMany(mappedBy = "candidate", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Experience> experiences = new ArrayList<>();

    @OneToMany(mappedBy = "candidate", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Education> education = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private CandidateStatus status = CandidateStatus.ACTIVE;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "github_url")
    private String githubUrl;

    @Column(name = "portfolio_url")
    private String portfolioUrl;

    @Column(name = "cv_file_path")
    private String cvFilePath;

    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    @Column(name = "availability_date")
    private LocalDate availabilityDate;

    @Column(name = "willing_to_relocate")
    private Boolean willingToRelocate = false;

    @Column(name = "work_preference")
    @Enumerated(EnumType.STRING)
    private WorkPreference workPreference = WorkPreference.HYBRID;

    @Column(name = "jestor_id", unique = true)
    private String jestorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "origin")
    private CandidateOrigin origin;

    @Column(name = "invited_by_headhunter_id")
    private Long invitedByHeadhunterId;

    @Column(name = "approved_by_headhunter_id")
    private Long approvedByHeadhunterId;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "consent_accepted_at")
    private LocalDateTime consentAcceptedAt;

    @Column(name = "consent_version", length = 32)
    private String consentVersion;

    @Column(length = 30)
    private String phone;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "candidate", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<JobApplication> applications = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (this.origin == null) {
            this.origin = (this.jestorId != null) ? CandidateOrigin.JESTOR : CandidateOrigin.MANUAL;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (this.origin == null) {
            this.origin = (this.jestorId != null) ? CandidateOrigin.JESTOR : CandidateOrigin.MANUAL;
        }
    }

    // Constructors
    public Candidate() {}

    public Candidate(String fullName, String email) {
        this.fullName = fullName;
        this.email = email;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }


    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getZipCode() { return zipCode; }
    public void setZipCode(String zipCode) { this.zipCode = zipCode; }

    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }

    public Double getDesiredSalary() { return desiredSalary; }
    public void setDesiredSalary(Double desiredSalary) { this.desiredSalary = desiredSalary; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }

    public List<Experience> getExperiences() { return experiences; }
    public void setExperiences(List<Experience> experiences) { this.experiences = experiences; }

    public List<Education> getEducation() { return education; }
    public void setEducation(List<Education> education) { this.education = education; }

    public CandidateStatus getStatus() { return status; }
    public void setStatus(CandidateStatus status) { this.status = status; }

    public String getLinkedinUrl() { return linkedinUrl; }
    public void setLinkedinUrl(String linkedinUrl) { this.linkedinUrl = linkedinUrl; }

    public String getGithubUrl() { return githubUrl; }
    public void setGithubUrl(String githubUrl) { this.githubUrl = githubUrl; }

    public String getPortfolioUrl() { return portfolioUrl; }
    public void setPortfolioUrl(String portfolioUrl) { this.portfolioUrl = portfolioUrl; }

    public String getCvFilePath() { return cvFilePath; }
    public void setCvFilePath(String cvFilePath) { this.cvFilePath = cvFilePath; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public LocalDate getAvailabilityDate() { return availabilityDate; }
    public void setAvailabilityDate(LocalDate availabilityDate) { this.availabilityDate = availabilityDate; }

    public Boolean getWillingToRelocate() { return willingToRelocate; }
    public void setWillingToRelocate(Boolean willingToRelocate) { this.willingToRelocate = willingToRelocate; }

    public WorkPreference getWorkPreference() { return workPreference; }
    public void setWorkPreference(WorkPreference workPreference) { this.workPreference = workPreference; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<JobApplication> getApplications() { return applications; }
    public void setApplications(List<JobApplication> applications) { this.applications = applications; }

    public String getJestorId() { return jestorId; }
    public void setJestorId(String jestorId) { this.jestorId = jestorId; }

    public CandidateOrigin getOrigin() { return origin; }
    public void setOrigin(CandidateOrigin origin) { this.origin = origin; }

    public Long getInvitedByHeadhunterId() { return invitedByHeadhunterId; }
    public void setInvitedByHeadhunterId(Long invitedByHeadhunterId) { this.invitedByHeadhunterId = invitedByHeadhunterId; }

    public Long getApprovedByHeadhunterId() { return approvedByHeadhunterId; }
    public void setApprovedByHeadhunterId(Long approvedByHeadhunterId) { this.approvedByHeadhunterId = approvedByHeadhunterId; }

    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }

    public LocalDateTime getRejectedAt() { return rejectedAt; }
    public void setRejectedAt(LocalDateTime rejectedAt) { this.rejectedAt = rejectedAt; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public LocalDateTime getConsentAcceptedAt() { return consentAcceptedAt; }
    public void setConsentAcceptedAt(LocalDateTime consentAcceptedAt) { this.consentAcceptedAt = consentAcceptedAt; }

    public String getConsentVersion() { return consentVersion; }
    public void setConsentVersion(String consentVersion) { this.consentVersion = consentVersion; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    // Enums
    public enum CandidateStatus {
        ACTIVE, INACTIVE, HIRED, BLACKLISTED, INVITED, PENDING_APPROVAL, REJECTED, EXPIRED_INVITE
    }

    public enum WorkPreference {
        REMOTE, ONSITE, HYBRID
    }
}