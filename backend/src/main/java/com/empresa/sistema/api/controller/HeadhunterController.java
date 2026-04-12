package com.empresa.sistema.api.controller;

import com.empresa.sistema.api.dto.request.HeadhunterCreateRequest;
import com.empresa.sistema.api.dto.request.HeadhunterUpdateRequest;
import com.empresa.sistema.api.dto.response.HeadhunterResponse;
import com.empresa.sistema.api.dto.response.HeadhunterHistoryResponse;
import com.empresa.sistema.api.dto.response.HeadhunterDashboardResponse;
import com.empresa.sistema.domain.entity.Headhunter;
import com.empresa.sistema.domain.service.HeadhunterService;
import com.empresa.sistema.domain.service.HeadhunterDashboardService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/headhunters")
public class HeadhunterController {

    @Autowired
    private HeadhunterService headhunterService;

    @Autowired
    private HeadhunterDashboardService dashboardService;

    @GetMapping
    public ResponseEntity<Page<HeadhunterResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fullName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Headhunter.Seniority seniority,
            @RequestParam(required = false) Headhunter.HeadhunterStatus status) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<HeadhunterResponse> headhunters;
        if (name != null || email != null || seniority != null || status != null) {
            headhunters = headhunterService.findWithFilters(name, email, seniority, status, pageable);
        } else {
            headhunters = headhunterService.findAll(pageable);
        }

        return ResponseEntity.ok(headhunters);
    }

    @GetMapping("/{id}")
    public ResponseEntity<HeadhunterResponse> getById(@PathVariable Long id) {
        return headhunterService.findById(id)
                .map(headhunter -> ResponseEntity.ok(headhunter))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<HeadhunterResponse> getByEmail(@PathVariable String email) {
        return headhunterService.findByEmail(email)
                .map(headhunter -> ResponseEntity.ok(headhunter))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<HeadhunterResponse>> getByStatus(@PathVariable Headhunter.HeadhunterStatus status) {
        List<HeadhunterResponse> headhunters = headhunterService.findByStatus(status);
        return ResponseEntity.ok(headhunters);
    }

    @GetMapping("/seniority/{seniority}")
    public ResponseEntity<List<HeadhunterResponse>> getBySeniority(@PathVariable Headhunter.Seniority seniority) {
        List<HeadhunterResponse> headhunters = headhunterService.findBySeniority(seniority);
        return ResponseEntity.ok(headhunters);
    }

    @GetMapping("/area/{area}")
    public ResponseEntity<List<HeadhunterResponse>> getByResponsibleArea(@PathVariable String area) {
        List<HeadhunterResponse> headhunters = headhunterService.findByResponsibleArea(area);
        return ResponseEntity.ok(headhunters);
    }

    @PostMapping
    public ResponseEntity<HeadhunterResponse> create(@Valid @RequestBody HeadhunterCreateRequest request) {
        try {
            HeadhunterResponse created = headhunterService.create(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<HeadhunterResponse> update(@PathVariable Long id,
                                               @Valid @RequestBody HeadhunterUpdateRequest request) {
        try {
            HeadhunterResponse updated = headhunterService.update(id, request);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> changeStatus(@PathVariable Long id,
                                            @RequestBody Map<String, String> request) {
        try {
            Headhunter.HeadhunterStatus status = Headhunter.HeadhunterStatus.valueOf(request.get("status"));
            headhunterService.changeStatus(id, status);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            headhunterService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Endpoints para histórico
    @GetMapping("/{id}/history")
    public ResponseEntity<List<HeadhunterHistoryResponse>> getHistory(@PathVariable Long id) {
        List<HeadhunterHistoryResponse> history = headhunterService.getHistory(id);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/{id}/history/paged")
    public ResponseEntity<Page<HeadhunterHistoryResponse>> getHistoryPaged(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<HeadhunterHistoryResponse> history = headhunterService.getHistoryPaged(id, pageable);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/{id}/history/range")
    public ResponseEntity<List<HeadhunterHistoryResponse>> getHistoryByDateRange(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<HeadhunterHistoryResponse> history = headhunterService.getHistoryByDateRange(id, startDate, endDate);
        return ResponseEntity.ok(history);
    }

    // Endpoints para estatísticas
    @GetMapping("/stats/count-by-status")
    public ResponseEntity<Map<String, Long>> getCountByStatus() {
        Map<String, Long> stats = Map.of(
                "ACTIVE", headhunterService.countByStatus(Headhunter.HeadhunterStatus.ACTIVE),
                "INACTIVE", headhunterService.countByStatus(Headhunter.HeadhunterStatus.INACTIVE),
                "SUSPENDED", headhunterService.countByStatus(Headhunter.HeadhunterStatus.SUSPENDED)
        );
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats/count-by-seniority")
    public ResponseEntity<Map<String, Long>> getCountBySeniority() {
        Map<String, Long> stats = Map.of(
                "JUNIOR", headhunterService.countBySeniority(Headhunter.Seniority.JUNIOR),
                "PLENO", headhunterService.countBySeniority(Headhunter.Seniority.PLENO),
                "SENIOR", headhunterService.countBySeniority(Headhunter.Seniority.SENIOR),
                "ESPECIALISTA", headhunterService.countBySeniority(Headhunter.Seniority.ESPECIALISTA)
        );
        return ResponseEntity.ok(stats);
    }

    // Endpoint para listar enums disponíveis
    @GetMapping("/enums/seniority")
    public ResponseEntity<Headhunter.Seniority[]> getSeniorityValues() {
        return ResponseEntity.ok(Headhunter.Seniority.values());
    }

    @GetMapping("/enums/status")
    public ResponseEntity<Headhunter.HeadhunterStatus[]> getStatusValues() {
        return ResponseEntity.ok(Headhunter.HeadhunterStatus.values());
    }

    // Dashboard endpoint
    @GetMapping("/{id}/dashboard")
    public ResponseEntity<HeadhunterDashboardResponse> getDashboard(@PathVariable Long id) {
        HeadhunterDashboardResponse dashboard = dashboardService.getDashboardData(id);
        return ResponseEntity.ok(dashboard);
    }
}