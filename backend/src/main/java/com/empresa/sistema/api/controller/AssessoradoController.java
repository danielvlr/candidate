package com.empresa.sistema.api.controller;

import com.empresa.sistema.api.dto.request.AssessoradoCreateRequest;
import com.empresa.sistema.api.dto.request.AssessoradoUpdateRequest;
import com.empresa.sistema.api.dto.response.AssessoradoHistoryResponse;
import com.empresa.sistema.api.dto.response.AssessoradoResponse;
import com.empresa.sistema.api.dto.response.JobMatchResponse;
import com.empresa.sistema.domain.entity.Assessorado;
import com.empresa.sistema.domain.service.AssessoradoService;
import com.empresa.sistema.domain.service.JobMatchingService;
import com.empresa.sistema.security.AuthenticatedUser;
import com.empresa.sistema.security.CpartnerScope;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(assessoradoService.findAll(pageable, CpartnerScope.seniorScope(principal)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssessoradoResponse> getById(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser principal) {
        try {
            return ResponseEntity.ok(assessoradoService.findById(id, CpartnerScope.seniorScope(principal)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/senior/{seniorId}")
    public ResponseEntity<Page<AssessoradoResponse>> getBySenior(
            @PathVariable Long seniorId,
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(assessoradoService.findBySeniorId(seniorId, CpartnerScope.seniorScope(principal), pageable));
    }

    @PostMapping
    public ResponseEntity<AssessoradoResponse> create(@Valid @RequestBody AssessoradoCreateRequest request,
                                                       @AuthenticationPrincipal AuthenticatedUser principal) {
        try {
            AssessoradoResponse created = assessoradoService.create(request, CpartnerScope.seniorScope(principal));
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssessoradoResponse> update(@PathVariable Long id,
                                                       @Valid @RequestBody AssessoradoUpdateRequest request,
                                                       @AuthenticationPrincipal AuthenticatedUser principal) {
        try {
            return ResponseEntity.ok(assessoradoService.update(id, request, CpartnerScope.seniorScope(principal)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser principal) {
        try {
            assessoradoService.delete(id, CpartnerScope.seniorScope(principal));
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private boolean isVisible(Long id, AuthenticatedUser principal) {
        try {
            assessoradoService.assertVisible(id, CpartnerScope.seniorScope(principal));
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    @PatchMapping("/{id}/phase")
    public ResponseEntity<Void> changePhase(@PathVariable Long id,
                                            @RequestBody Map<String, String> request,
                                            @AuthenticationPrincipal AuthenticatedUser principal) {
        if (!isVisible(id, principal)) {
            return ResponseEntity.notFound().build();
        }
        try {
            Assessorado.AssessoradoPhase phase = Assessorado.AssessoradoPhase.valueOf(request.get("phase"));
            assessoradoService.changePhase(id, phase, CpartnerScope.seniorScope(principal));
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> changeStatus(@PathVariable Long id,
                                             @RequestBody Map<String, String> request,
                                             @AuthenticationPrincipal AuthenticatedUser principal) {
        if (!isVisible(id, principal)) {
            return ResponseEntity.notFound().build();
        }
        try {
            Assessorado.AssessoradoStatus status = Assessorado.AssessoradoStatus.valueOf(request.get("status"));
            assessoradoService.changeStatus(id, status, CpartnerScope.seniorScope(principal));
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<AssessoradoHistoryResponse>> getHistory(
            @PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser principal) {
        try {
            return ResponseEntity.ok(assessoradoService.getHistory(id, CpartnerScope.seniorScope(principal)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/matching-jobs")
    public ResponseEntity<List<JobMatchResponse>> getMatchingJobs(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser principal) {
        try {
            List<JobMatchResponse> matches = jobMatchingService.findMatchingJobs(id, CpartnerScope.seniorScope(principal));
            return ResponseEntity.ok(matches);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/senior/{seniorId}/count")
    public ResponseEntity<Map<String, Long>> getCounts(@PathVariable Long seniorId, @AuthenticationPrincipal AuthenticatedUser principal) {
        return ResponseEntity.ok(assessoradoService.countBySeniorId(seniorId, CpartnerScope.seniorScope(principal)));
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
