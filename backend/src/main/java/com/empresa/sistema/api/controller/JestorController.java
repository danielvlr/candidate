package com.empresa.sistema.api.controller;

import com.empresa.sistema.config.JestorConfig;
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

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;

@RestController
@RequestMapping("/api/v1/jestor")
@RequiredArgsConstructor
public class JestorController {

    private final JestorSyncService syncService;
    private final JestorClient jestorClient;
    private final SyncLogRepository syncLogRepository;
    private final JestorConfig jestorConfig;

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

    /**
     * Probe diagnóstico: retorna todas as chaves presentes em até `sampleSize` registros
     * de uma tabela do Jestor + 1 registro completo de exemplo. Use para descobrir
     * campos novos antes de mapear no JestorSyncService.
     *
     * Default table = jobs.
     */
    @GetMapping("/probe")
    public ResponseEntity<Map<String, Object>> probe(
            @RequestParam(required = false) String table,
            @RequestParam(defaultValue = "5") int sampleSize) {
        try {
            String resolved = (table == null || table.isBlank()) ? jestorConfig.getJobsTable() : table;
            int safeSize = Math.max(1, Math.min(sampleSize, 50));
            var response = jestorClient.listRecords(resolved, 1, safeSize);
            List<Map<String, Object>> records = new ArrayList<>();
            if (response != null && response.isStatus() && response.getData() != null
                    && response.getData().getItems() != null) {
                records = response.getData().getItems();
            }

            Set<String> keys = new TreeSet<>();
            for (Map<String, Object> r : records) {
                if (r != null) keys.addAll(r.keySet());
            }

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("table", resolved);
            body.put("sampleCount", records.size());
            body.put("allKeys", keys);
            body.put("sampleRecord", records.isEmpty() ? null : records.get(0));
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
