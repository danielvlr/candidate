package com.empresa.sistema.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "clients")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String companyName;

    @Column(length = 20)
    private String cnpj;

    @Column(length = 200)
    private String address;

    @Column(length = 50)
    private String city;

    @Column(length = 50)
    private String state;

    @Column(length = 10)
    private String zipCode;

    @Column(length = 50)
    private String country;

    @Column(length = 100)
    private String contactPersonName;

    @Column(length = 100)
    private String contactEmail;

    @Column(length = 20)
    private String contactPhone;

    @Column(length = 100)
    private String website;

    @Column(length = 100)
    private String linkedinUrl;

    @Column(length = 50)
    private String industry;

    @Column(length = 20)
    private String companySize;

    @Lob
    private String description;

    @Lob
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ClientStatus status = ClientStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    private ClientType type;

    @Column(length = 200)
    private String logoUrl;

    @Column(name = "jestor_id", unique = true)
    private String jestorId;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // Relacionamento com Jobs
    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Job> jobs;

    public enum ClientStatus {
        ACTIVE("Ativo"),
        INACTIVE("Inativo"),
        SUSPENDED("Suspenso"),
        PROSPECT("Prospecto");

        private final String description;

        ClientStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    public enum ClientType {
        STARTUP("Startup"),
        SME("Pequena/Média Empresa"),
        ENTERPRISE("Grande Empresa"),
        MULTINATIONAL("Multinacional"),
        GOVERNMENT("Governo"),
        NGO("ONG"),
        CONSULTING("Consultoria");

        private final String description;

        ClientType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}