package com.empresa.sistema.api.controller;

import com.empresa.sistema.api.dto.request.AssessoradoCreateRequest;
import com.empresa.sistema.api.dto.request.AssessoradoUpdateRequest;
import com.empresa.sistema.api.dto.response.AssessoradoHistoryResponse;
import com.empresa.sistema.api.dto.response.AssessoradoResponse;
import com.empresa.sistema.api.dto.response.JobMatchResponse;
import com.empresa.sistema.domain.entity.Assessorado;
import com.empresa.sistema.domain.service.AssessoradoService;
import com.empresa.sistema.domain.service.JobMatchingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/assessorados")
public class AssessoradoController {

    @Autowired
    private AssessoradoService assessoradoService;

    @Autowired
    private JobMatchingService jobMatchingService;

    @GetMapping
    public ResponseEntity<Page<AssessoradoResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(assessoradoService.findAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssessoradoResponse> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(assessoradoService.findById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/senior/{seniorId}")
    public ResponseEntity<Page<AssessoradoResponse>> getBySenior(
            @PathVariable Long seniorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(assessoradoService.findBySeniorId(seniorId, pageable));
    }

    @PostMapping
    public ResponseEntity<AssessoradoResponse> create(@Valid @RequestBody AssessoradoCreateRequest request) {
        try {
            AssessoradoResponse created = assessoradoService.create(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssessoradoResponse> update(@PathVariable Long id,
                                                       @Valid @RequestBody AssessoradoUpdateRequest request) {
        try {
            return ResponseEntity.ok(assessoradoService.update(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            assessoradoService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/phase")
    public ResponseEntity<Void> changePhase(@PathVariable Long id,
                                            @RequestBody Map<String, String> request) {
        try {
            Assessorado.AssessoradoPhase phase = Assessorado.AssessoradoPhase.valueOf(request.get("phase"));
            assessoradoService.changePhase(id, phase);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> changeStatus(@PathVariable Long id,
                                             @RequestBody Map<String, String> request) {
        try {
            Assessorado.AssessoradoStatus status = Assessorado.AssessoradoStatus.valueOf(request.get("status"));
            assessoradoService.changeStatus(id, status);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<AssessoradoHistoryResponse>> getHistory(@PathVariable Long id) {
        List<AssessoradoHistoryResponse> history = assessoradoService.getHistory(id);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/{id}/matching-jobs")
    public ResponseEntity<List<JobMatchResponse>> getMatchingJobs(@PathVariable Long id) {
        try {
            List<JobMatchResponse> matches = jobMatchingService.findMatchingJobs(id);
            return ResponseEntity.ok(matches);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/senior/{seniorId}/count")
    public ResponseEntity<Map<String, Long>> getCounts(@PathVariable Long seniorId) {
        return ResponseEntity.ok(assessoradoService.countBySeniorId(seniorId));
    }

    @GetMapping("/enums/phases")
    public ResponseEntity<Assessorado.AssessoradoPhase[]> getPhaseValues() {
        return ResponseEntity.ok(Assessorado.AssessoradoPhase.values());
    }

    @GetMapping("/enums/statuses")
    public ResponseEntity<Assessorado.AssessoradoStatus[]> getStatusValues() {
        return ResponseEntity.ok(Assessorado.AssessoradoStatus.values());
    }
}
