package com.empresa.sistema.api.controller;

import com.empresa.sistema.api.dto.request.CandidateCreateRequest;
import com.empresa.sistema.api.dto.request.CandidateUpdateRequest;
import com.empresa.sistema.api.dto.response.CandidateResponse;
import com.empresa.sistema.domain.entity.Candidate;
import com.empresa.sistema.domain.service.CandidateService;
import com.empresa.sistema.domain.service.LinkedInService;
import com.empresa.sistema.domain.service.FileUploadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/candidates")
@RequiredArgsConstructor
public class CandidateController {

    private final CandidateService candidateService;
    private final LinkedInService linkedInService;
    private final FileUploadService fileUploadService;

    @GetMapping
    public ResponseEntity<Page<CandidateResponse>> getAllCandidates(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<CandidateResponse> candidates = candidateService.findAll(pageable);
        return ResponseEntity.ok(candidates);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CandidateResponse> getCandidateById(@PathVariable Long id) {
        CandidateResponse candidate = candidateService.findById(id);
        return ResponseEntity.ok(candidate);
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<CandidateResponse> getCandidateByEmail(@PathVariable String email) {
        CandidateResponse candidate = candidateService.findByEmail(email);
        return ResponseEntity.ok(candidate);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<CandidateResponse>> searchCandidates(
            @RequestParam String q,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<CandidateResponse> candidates = candidateService.searchCandidates(q, pageable);
        return ResponseEntity.ok(candidates);
    }

    @GetMapping("/filter")
    public ResponseEntity<Page<CandidateResponse>> filterCandidates(
            @RequestParam(required = false) String headline,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double minSalary,
            @RequestParam(required = false) Double maxSalary,
            @RequestParam(required = false) Candidate.WorkPreference workPreference,
            @RequestParam(required = false) Candidate.CandidateStatus status,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<CandidateResponse> candidates = candidateService.findWithFilters(
            headline, city, minSalary, maxSalary, workPreference, status, pageable);
        return ResponseEntity.ok(candidates);
    }

    @GetMapping("/cities")
    public ResponseEntity<List<String>> getAllCities() {
        List<String> cities = candidateService.getAllCities();
        return ResponseEntity.ok(cities);
    }

    @GetMapping("/headlines")
    public ResponseEntity<List<String>> getAllHeadlines() {
        List<String> headlines = candidateService.getAllHeadlines();
        return ResponseEntity.ok(headlines);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<CandidateResponse>> getCandidatesByStatus(
            @PathVariable Candidate.CandidateStatus status) {
        List<CandidateResponse> candidates = candidateService.findByStatus(status);
        return ResponseEntity.ok(candidates);
    }

    @PostMapping
    public ResponseEntity<CandidateResponse> createCandidate(@Valid @RequestBody CandidateCreateRequest request) {
        CandidateResponse createdCandidate = candidateService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCandidate);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CandidateResponse> updateCandidate(
            @PathVariable Long id,
            @Valid @RequestBody CandidateUpdateRequest request) {
        CandidateResponse updatedCandidate = candidateService.update(id, request);
        return ResponseEntity.ok(updatedCandidate);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCandidate(@PathVariable Long id) {
        candidateService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activateCandidate(@PathVariable Long id) {
        candidateService.activate(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/blacklist")
    public ResponseEntity<Void> blacklistCandidate(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        candidateService.blacklist(id, reason);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getCandidatesCounts() {
        Map<String, Long> counts = Map.of(
            "active", candidateService.countByStatus(Candidate.CandidateStatus.ACTIVE),
            "inactive", candidateService.countByStatus(Candidate.CandidateStatus.INACTIVE),
            "hired", candidateService.countByStatus(Candidate.CandidateStatus.HIRED),
            "blacklisted", candidateService.countByStatus(Candidate.CandidateStatus.BLACKLISTED)
        );
        return ResponseEntity.ok(counts);
    }

    @GetMapping("/exists")
    public ResponseEntity<Map<String, Boolean>> checkEmailExists(@RequestParam String email) {
        boolean exists = candidateService.existsByEmail(email);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @PostMapping("/import-linkedin-pdf")
    public ResponseEntity<CandidateResponse> importFromLinkedInPdf(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // Validate file type more robustly
        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();

        if (contentType == null ||
            (!contentType.equals("application/pdf") &&
             (filename == null || !filename.toLowerCase().endsWith(".pdf")))) {
            return ResponseEntity.badRequest().build();
        }

        try {
            CandidateResponse candidateData = linkedInService.extractCandidateDataFromPdf(file);
            return ResponseEntity.ok(candidateData);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/photo")
    public ResponseEntity<Map<String, String>> uploadCandidatePhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {

        try {
            String fileUrl = fileUploadService.uploadCandidatePhoto(file);
            candidateService.updateProfilePhoto(id, fileUrl);
            return ResponseEntity.ok(Map.of("url", fileUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }
}