package com.empresa.sistema.integration.jestor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class SyncResult {

    private String entity;
    private int created;
    private int updated;
    private int errors;
    private int total;
    private LocalDateTime syncedAt;
    private List<String> errorMessages = new ArrayList<>();

    public SyncResult() {
        this.syncedAt = LocalDateTime.now();
    }

    public SyncResult(String entity) {
        this.entity = entity;
        this.syncedAt = LocalDateTime.now();
    }

    public void incrementCreated() { created++; }
    public void incrementUpdated() { updated++; }
    public void incrementErrors() { errors++; }
    public void addError(String message) {
        errors++;
        errorMessages.add(message);
    }

    public String getEntity() { return entity; }
    public void setEntity(String entity) { this.entity = entity; }
    public int getCreated() { return created; }
    public void setCreated(int created) { this.created = created; }
    public int getUpdated() { return updated; }
    public void setUpdated(int updated) { this.updated = updated; }
    public int getErrors() { return errors; }
    public void setErrors(int errors) { this.errors = errors; }
    public int getTotal() { return total; }
    public void setTotal(int total) { this.total = total; }
    public LocalDateTime getSyncedAt() { return syncedAt; }
    public void setSyncedAt(LocalDateTime syncedAt) { this.syncedAt = syncedAt; }
    public List<String> getErrorMessages() { return errorMessages; }
    public void setErrorMessages(List<String> errorMessages) { this.errorMessages = errorMessages; }
}
