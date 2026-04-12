package com.empresa.sistema.api.controller;

import com.empresa.sistema.api.dto.response.WarrantyResponse;
import com.empresa.sistema.api.dto.response.WarrantyRuleResponse;
import com.empresa.sistema.domain.entity.Job;
import com.empresa.sistema.domain.entity.Warranty;
import com.empresa.sistema.domain.entity.WarrantyRule;
import com.empresa.sistema.domain.service.WarrantyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*", maxAge = 3600)
public class WarrantyController {

    @Autowired
    private WarrantyService warrantyService;

    // ==================== Warranty Endpoints ====================

    @GetMapping("/warranties")
    public ResponseEntity<List<WarrantyResponse>> getAllWarranties(
            @RequestParam(required = false) Warranty.WarrantyStatus status) {
        List<Warranty> warranties;
        if (status != null) {
            warranties = warrantyService.findByStatus(status);
        } else {
            warranties = warrantyService.findAll();
        }
        List<WarrantyResponse> response = warranties.stream()
                .map(WarrantyResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/warranties/{id}")
    public ResponseEntity<WarrantyResponse> getWarrantyById(@PathVariable Long id) {
        Warranty warranty = warrantyService.findById(id);
        return ResponseEntity.ok(WarrantyResponse.fromEntity(warranty));
    }

    @GetMapping("/warranties/job/{jobId}")
    public ResponseEntity<List<WarrantyResponse>> getWarrantiesByJob(@PathVariable Long jobId) {
        List<WarrantyResponse> response = warrantyService.findByJobId(jobId).stream()
                .map(WarrantyResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/warranties/headhunter/{headhunterId}")
    public ResponseEntity<List<WarrantyResponse>> getWarrantiesByHeadhunter(@PathVariable Long headhunterId) {
        List<WarrantyResponse> response = warrantyService.findByHeadhunterId(headhunterId).stream()
                .map(WarrantyResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/warranties/expiring")
    public ResponseEntity<List<WarrantyResponse>> getExpiringWarranties(
            @RequestParam(defaultValue = "10") int days) {
        List<WarrantyResponse> response = warrantyService.findExpiringWarranties(days).stream()
                .map(WarrantyResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/warranties/{id}/breach")
    public ResponseEntity<WarrantyResponse> breachWarranty(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "Sem motivo informado");
        Warranty warranty = warrantyService.markAsBreach(id, reason);
        return ResponseEntity.ok(WarrantyResponse.fromEntity(warranty));
    }

    @GetMapping("/warranties/count")
    public ResponseEntity<Map<String, Long>> getWarrantyCounts() {
        Map<String, Long> counts = Map.of(
                "active", warrantyService.countByStatus(Warranty.WarrantyStatus.ACTIVE),
                "expiringSoon", warrantyService.countByStatus(Warranty.WarrantyStatus.EXPIRING_SOON),
                "expired", warrantyService.countByStatus(Warranty.WarrantyStatus.EXPIRED),
                "breached", warrantyService.countByStatus(Warranty.WarrantyStatus.BREACHED)
        );
        return ResponseEntity.ok(counts);
    }

    // ==================== Warranty Rule Endpoints ====================

    @GetMapping("/warranty-rules")
    public ResponseEntity<List<WarrantyRuleResponse>> getAllRules() {
        List<WarrantyRuleResponse> response = warrantyService.getWarrantyRules().stream()
                .map(WarrantyRuleResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/warranty-rules")
    public ResponseEntity<WarrantyRuleResponse> createRule(@RequestBody Map<String, Object> body) {
        Job.ServiceCategory category = Job.ServiceCategory.valueOf((String) body.get("serviceCategory"));
        Integer defaultDays = (Integer) body.get("defaultDays");

        WarrantyRule rule = WarrantyRule.builder()
                .serviceCategory(category)
                .defaultDays(defaultDays)
                .active(true)
                .build();

        WarrantyRule saved = warrantyService.createRule(rule);
        return ResponseEntity.status(HttpStatus.CREATED).body(WarrantyRuleResponse.fromEntity(saved));
    }

    @PutMapping("/warranty-rules/{id}")
    public ResponseEntity<WarrantyRuleResponse> updateRule(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Integer defaultDays = body.containsKey("defaultDays") ? (Integer) body.get("defaultDays") : null;
        Boolean active = body.containsKey("active") ? (Boolean) body.get("active") : null;

        WarrantyRule updated = warrantyService.updateRule(id, defaultDays, active);
        return ResponseEntity.ok(WarrantyRuleResponse.fromEntity(updated));
    }

    @DeleteMapping("/warranty-rules/{id}")
    public ResponseEntity<Void> deleteRule(@PathVariable Long id) {
        warrantyService.deleteRule(id);
        return ResponseEntity.noContent().build();
    }
}
