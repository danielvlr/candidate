package com.empresa.sistema.api.controller;

import com.empresa.sistema.security.AuthenticatedUser;
import com.empresa.sistema.security.HeadhunterScope;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.empresa.sistema.api.dto.request.JobCreateRequest;
import com.empresa.sistema.api.dto.request.JobUpdateRequest;
import com.empresa.sistema.api.dto.response.JobResponse;
import com.empresa.sistema.api.dto.response.JobDetailResponse;
import com.empresa.sistema.api.mapper.JobMapper;
import com.empresa.sistema.domain.entity.Job;
import com.empresa.sistema.domain.service.JobService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/jobs")
public class JobController {

    @Autowired
    private JobService jobService;

    @GetMapping
    public ResponseEntity<Page<JobResponse>> getAllJobs(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<JobResponse> jobs = HeadhunterScope.isHeadhunter(principal)
            ? jobService.findWithFilters(null, null, null, null, null, null, null, null,
                HeadhunterScope.resolve(principal, null), pageable)
            : jobService.findAll(pageable);
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobResponse> getJobById(
            @PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser principal) {
        JobResponse job = jobService.findById(id, HeadhunterScope.resolve(principal, null));
        return ResponseEntity.ok(job);
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<JobDetailResponse> getJobDetail(
            @PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser principal) {
        JobDetailResponse jobDetail = jobService.findDetailById(id, HeadhunterScope.resolve(principal, null));
        return ResponseEntity.ok(jobDetail);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<JobResponse>> searchJobs(
            @RequestParam String q,
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<JobResponse> jobs = jobService.searchJobs(q, HeadhunterScope.resolve(principal, null), pageable);
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/filter")
    public ResponseEntity<Page<JobResponse>> filterJobs(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String companyName,
            @RequestParam(required = false) Job.JobType jobType,
            @RequestParam(required = false) Job.WorkMode workMode,
            @RequestParam(required = false) Job.ExperienceLevel experienceLevel,
            @RequestParam(required = false) Double minSalary,
            @RequestParam(required = false) Double maxSalary,
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) Long headhunterId,
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<JobResponse> jobs = jobService.findWithFilters(
            location, companyName, jobType, workMode, experienceLevel,
            minSalary, maxSalary, clientId, HeadhunterScope.resolve(principal, headhunterId), pageable);
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/locations")
    public ResponseEntity<List<String>> getAllLocations() {
        List<String> locations = jobService.getAllLocations();
        return ResponseEntity.ok(locations);
    }

    @GetMapping("/companies")
    public ResponseEntity<List<String>> getAllCompanies() {
        List<String> companies = jobService.getAllCompanies();
        return ResponseEntity.ok(companies);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<JobResponse>> getJobsByStatus(
            @PathVariable Job.JobStatus status,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        List<JobResponse> jobs = jobService.findByStatus(status, HeadhunterScope.resolve(principal, null));
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/featured")
    public ResponseEntity<List<JobResponse>> getFeaturedJobs() {
        List<JobResponse> jobs = jobService.findFeaturedJobs();
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/urgent")
    public ResponseEntity<List<JobResponse>> getUrgentJobs() {
        List<JobResponse> jobs = jobService.findUrgentJobs();
        return ResponseEntity.ok(jobs);
    }

    @PostMapping
    public ResponseEntity<JobResponse> createJob(@Valid @RequestBody JobCreateRequest request) {
        JobResponse createdJob = jobService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdJob);
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobResponse> updateJob(
            @PathVariable Long id,
            @Valid @RequestBody JobUpdateRequest request) {
        JobResponse updatedJob = jobService.update(id, request);
        return ResponseEntity.ok(updatedJob);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long id) {
        jobService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/pause")
    public ResponseEntity<Void> pauseJob(@PathVariable Long id) {
        jobService.pause(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activateJob(@PathVariable Long id) {
        jobService.activate(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<Void> closeJob(@PathVariable Long id) {
        jobService.close(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/featured")
    public ResponseEntity<Void> toggleFeatured(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        boolean featured = body.getOrDefault("featured", false);
        jobService.markAsFeatured(id, featured);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/urgent")
    public ResponseEntity<Void> toggleUrgent(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        boolean urgent = body.getOrDefault("urgent", false);
        jobService.markAsUrgent(id, urgent);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getJobsCounts() {
        Map<String, Long> counts = Map.of(
            "active", jobService.countByStatus(Job.JobStatus.ACTIVE),
            "paused", jobService.countByStatus(Job.JobStatus.PAUSED),
            "closed", jobService.countByStatus(Job.JobStatus.CLOSED),
            "expired", jobService.countByStatus(Job.JobStatus.EXPIRED),
            "draft", jobService.countByStatus(Job.JobStatus.DRAFT)
        );
        return ResponseEntity.ok(counts);
    }

    @PostMapping("/expire-jobs")
    public ResponseEntity<Void> expireOldJobs() {
        jobService.checkAndExpireJobs();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/promote-expired-warranty")
    public ResponseEntity<Void> promoteExpiredWarrantyJobs() {
        jobService.promoteExpiredWarrantyJobs();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<JobResponse> closeJobWithValue(
            @PathVariable Long id,
            @Valid @RequestBody com.empresa.sistema.api.dto.request.CloseJobRequest request) {
        return ResponseEntity.ok(jobService.closeJobWithValue(
            id, request.getFinalValue(), request.getClosedAt(), request.getNotes(), request.getApprovedCandidateId()));
    }

    @GetMapping("/kanban")
    public ResponseEntity<Map<String, List<JobResponse>>> getAllJobsKanbanByStatus(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdAfter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate deadlineBefore,
            @RequestParam(required = false) Integer warrantyExpiringIn) {
        Map<String, List<JobResponse>> result = HeadhunterScope.isHeadhunter(principal)
            ? jobService.getJobsKanbanByStatus(HeadhunterScope.resolve(principal, null),
                createdAfter, deadlineBefore, warrantyExpiringIn)
            : jobService.getAllJobsKanbanByStatus(createdAfter, deadlineBefore, warrantyExpiringIn);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/kanban/pipeline")
    public ResponseEntity<Map<String, List<JobResponse>>> getAllJobsKanbanByPipeline(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdAfter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate deadlineBefore,
            @RequestParam(required = false) Integer warrantyExpiringIn) {
        Map<String, List<JobResponse>> result = HeadhunterScope.isHeadhunter(principal)
            ? jobService.getJobsKanbanByPipeline(HeadhunterScope.resolve(principal, null),
                createdAfter, deadlineBefore, warrantyExpiringIn)
            : jobService.getAllJobsKanbanByPipeline(createdAfter, deadlineBefore, warrantyExpiringIn);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/kanban/headhunter/{headhunterId}")
    public ResponseEntity<Map<String, List<JobResponse>>> getJobsKanbanByStatus(
            @PathVariable Long headhunterId,
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdAfter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate deadlineBefore,
            @RequestParam(required = false) Integer warrantyExpiringIn) {
        Map<String, List<JobResponse>> result = jobService.getJobsKanbanByStatus(
            HeadhunterScope.resolve(principal, headhunterId), createdAfter, deadlineBefore, warrantyExpiringIn);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/kanban/headhunter/{headhunterId}/pipeline")
    public ResponseEntity<Map<String, List<JobResponse>>> getJobsKanbanByPipeline(
            @PathVariable Long headhunterId,
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdAfter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate deadlineBefore,
            @RequestParam(required = false) Integer warrantyExpiringIn) {
        Map<String, List<JobResponse>> result = jobService.getJobsKanbanByPipeline(
            HeadhunterScope.resolve(principal, headhunterId), createdAfter, deadlineBefore, warrantyExpiringIn);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/{id}/pipeline-stage")
    public ResponseEntity<JobResponse> updatePipelineStage(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Job.PipelineStage stage = Job.PipelineStage.valueOf(body.get("pipelineStage"));
        return ResponseEntity.ok(jobService.updatePipelineStage(id, stage));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<JobResponse> updateJobStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Job.JobStatus newStatus = Job.JobStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(jobService.updateJobStatus(id, newStatus));
    }
}