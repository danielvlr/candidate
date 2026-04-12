package com.empresa.sistema.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sync_logs")
public class SyncLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String source;

    @Column(nullable = false, length = 50)
    private String entity;

    @Column(name = "records_created")
    private Integer recordsCreated = 0;

    @Column(name = "records_updated")
    private Integer recordsUpdated = 0;

    @Column(name = "records_errors")
    private Integer recordsErrors = 0;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "error_details", columnDefinition = "TEXT")
    private String errorDetails;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public SyncLog() {}

    public SyncLog(String source, String entity) {
        this.source = source;
        this.entity = entity;
        this.startedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getEntity() { return entity; }
    public void setEntity(String entity) { this.entity = entity; }

    public Integer getRecordsCreated() { return recordsCreated; }
    public void setRecordsCreated(Integer recordsCreated) { this.recordsCreated = recordsCreated; }

    public Integer getRecordsUpdated() { return recordsUpdated; }
    public void setRecordsUpdated(Integer recordsUpdated) { this.recordsUpdated = recordsUpdated; }

    public Integer getRecordsErrors() { return recordsErrors; }
    public void setRecordsErrors(Integer recordsErrors) { this.recordsErrors = recordsErrors; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getErrorDetails() { return errorDetails; }
    public void setErrorDetails(String errorDetails) { this.errorDetails = errorDetails; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
