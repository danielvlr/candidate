package com.empresa.sistema.api.controller;

import com.empresa.sistema.domain.entity.JobApplication;
import com.empresa.sistema.domain.service.JobApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/applications")
public class JobApplicationController {

    @Autowired
    private JobApplicationService jobApplicationService;

    @PostMapping
    public ResponseEntity<JobApplication> applyForJob(@RequestBody Map<String, Object> request) {
        Long candidateId = Long.valueOf(request.get("candidateId").toString());
        Long jobId = Long.valueOf(request.get("jobId").toString());
        String coverLetter = request.get("coverLetter") != null ? request.get("coverLetter").toString() : null;

        JobApplication application = jobApplicationService.applyForJob(candidateId, jobId, coverLetter);
        return ResponseEntity.status(HttpStatus.CREATED).body(application);
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobApplication> getApplicationById(@PathVariable Long id) {
        JobApplication application = jobApplicationService.findById(id);
        return ResponseEntity.ok(application);
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<Page<JobApplication>> getApplicationsByJob(
            @PathVariable Long jobId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<JobApplication> applications = jobApplicationService.findByJobId(jobId, pageable);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<Page<JobApplication>> getApplicationsByCandidate(
            @PathVariable Long candidateId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<JobApplication> applications = jobApplicationService.findByCandidateId(candidateId, pageable);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<JobApplication>> getApplicationsByStatus(
            @PathVariable JobApplication.ApplicationStatus status) {
        List<JobApplication> applications = jobApplicationService.findByStatus(status);
        return ResponseEntity.ok(applications);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<JobApplication> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        JobApplication.ApplicationStatus status = JobApplication.ApplicationStatus.valueOf(request.get("status"));
        JobApplication application = jobApplicationService.updateStatus(id, status);
        return ResponseEntity.ok(application);
    }

    @PatchMapping("/{id}/interview")
    public ResponseEntity<JobApplication> scheduleInterview(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        LocalDateTime interviewDate = LocalDateTime.parse(request.get("interviewDate"));
        JobApplication application = jobApplicationService.scheduleInterview(id, interviewDate);
        return ResponseEntity.ok(application);
    }

    @PatchMapping("/{id}/feedback")
    public ResponseEntity<JobApplication> addFeedback(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        String feedback = request.get("feedback") != null ? request.get("feedback").toString() : null;
        Integer rating = request.get("rating") != null ? Integer.valueOf(request.get("rating").toString()) : null;

        JobApplication application = jobApplicationService.addFeedback(id, feedback, rating);
        return ResponseEntity.ok(application);
    }

    @PatchMapping("/{id}/notes")
    public ResponseEntity<JobApplication> addNotes(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        String notes = request.get("notes");
        JobApplication application = jobApplicationService.addNotes(id, notes);
        return ResponseEntity.ok(application);
    }

    @PatchMapping("/{id}/withdraw")
    public ResponseEntity<Void> withdrawApplication(@PathVariable Long id) {
        jobApplicationService.withdraw(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<Void> rejectApplication(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> request) {
        String reason = request != null ? request.get("reason") : null;
        jobApplicationService.reject(id, reason);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/hire")
    public ResponseEntity<Void> hireCandidate(@PathVariable Long id) {
        jobApplicationService.hire(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkApplication(
            @RequestParam Long candidateId,
            @RequestParam Long jobId) {
        boolean hasApplied = jobApplicationService.hasApplied(candidateId, jobId);
        return ResponseEntity.ok(Map.of("hasApplied", hasApplied));
    }

    @GetMapping("/count/job/{jobId}")
    public ResponseEntity<Map<String, Long>> countByJob(@PathVariable Long jobId) {
        long count = jobApplicationService.countByJobId(jobId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/count/candidate/{candidateId}")
    public ResponseEntity<Map<String, Long>> countByCandidate(@PathVariable Long candidateId) {
        long count = jobApplicationService.countByCandidateId(candidateId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/count/status/{status}")
    public ResponseEntity<Map<String, Long>> countByStatus(
            @PathVariable JobApplication.ApplicationStatus status) {
        long count = jobApplicationService.countByStatus(status);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/recent/{status}")
    public ResponseEntity<List<JobApplication>> getRecentApplications(
            @PathVariable JobApplication.ApplicationStatus status,
            @RequestParam(defaultValue = "10") int limit) {
        List<JobApplication> applications = jobApplicationService.getRecentApplications(status, limit);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getApplicationsStats() {
        Map<String, Long> stats = Map.of(
            "applied", jobApplicationService.countByStatus(JobApplication.ApplicationStatus.APPLIED),
            "underReview", jobApplicationService.countByStatus(JobApplication.ApplicationStatus.UNDER_REVIEW),
            "shortlisted", jobApplicationService.countByStatus(JobApplication.ApplicationStatus.SHORTLISTED),
            "interviewed", jobApplicationService.countByStatus(JobApplication.ApplicationStatus.INTERVIEWED),
            "hired", jobApplicationService.countByStatus(JobApplication.ApplicationStatus.HIRED),
            "rejected", jobApplicationService.countByStatus(JobApplication.ApplicationStatus.REJECTED)
        );
        return ResponseEntity.ok(stats);
    }
}