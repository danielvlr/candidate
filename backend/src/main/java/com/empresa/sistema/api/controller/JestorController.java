package com.empresa.sistema.api.controller;

import com.empresa.sistema.domain.entity.SyncLog;
import com.empresa.sistema.domain.repository.SyncLogRepository;
import com.empresa.sistema.integration.jestor.JestorClient;
import com.empresa.sistema.integration.jestor.JestorSyncService;
import com.empresa.sistema.integration.jestor.SyncResult;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/jestor")
@RequiredArgsConstructor
public class JestorController {

    private final JestorSyncService syncService;
    private final JestorClient jestorClient;
    private final SyncLogRepository syncLogRepository;

    @PostMapping("/sync")
    public ResponseEntity<List<SyncResult>> triggerSync() {
        List<SyncResult> results = syncService.fullSync();
        return ResponseEntity.ok(results);
    }

    @GetMapping("/sync/status")
    public ResponseEntity<Optional<SyncLog>> getSyncStatus() {
        Optional<SyncLog> latest = syncLogRepository.findTopByOrderByCompletedAtDesc();
        return ResponseEntity.ok(latest);
    }

    @GetMapping("/sync/history")
    public ResponseEntity<Page<SyncLog>> getSyncHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SyncLog> history = syncLogRepository.findAllByOrderByCompletedAtDesc(pageable);
        return ResponseEntity.ok(history);
    }

    @PostMapping("/test-connection")
    public ResponseEntity<Map<String, Object>> testConnection() {
        try {
            Map<String, Object> result = jestorClient.getOrganization();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
