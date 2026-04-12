package com.empresa.sistema.api.controller;

import com.empresa.sistema.api.dto.request.JobHistoryCreateRequest;
import com.empresa.sistema.api.dto.response.JobHistoryResponse;
import com.empresa.sistema.domain.entity.JobHistory;
import com.empresa.sistema.domain.service.JobHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/job-history")
@RequiredArgsConstructor
public class JobHistoryController {

    private final JobHistoryService jobHistoryService;

    @GetMapping("/job/{jobId}")
    public ResponseEntity<List<JobHistoryResponse>> getHistoryByJob(@PathVariable Long jobId) {
        List<JobHistoryResponse> history = jobHistoryService.findByJobId(jobId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/job/{jobId}/paginated")
    public ResponseEntity<Page<JobHistoryResponse>> getHistoryByJobPaginated(
            @PathVariable Long jobId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<JobHistoryResponse> history = jobHistoryService.findByJobId(jobId, pageable);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/job/{jobId}/type/{type}")
    public ResponseEntity<List<JobHistoryResponse>> getHistoryByJobAndType(
            @PathVariable Long jobId,
            @PathVariable JobHistory.HistoryType type) {
        List<JobHistoryResponse> history = jobHistoryService.findByJobIdAndType(jobId, type);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/job/{jobId}/candidate/{candidateId}")
    public ResponseEntity<List<JobHistoryResponse>> getHistoryByJobAndCandidate(
            @PathVariable Long jobId,
            @PathVariable Long candidateId) {
        List<JobHistoryResponse> history = jobHistoryService.findByJobIdAndCandidateId(jobId, candidateId);
        return ResponseEntity.ok(history);
    }

    @PostMapping
    public ResponseEntity<JobHistoryResponse> createHistory(@Valid @RequestBody JobHistoryCreateRequest request) {
        JobHistoryResponse createdHistory = jobHistoryService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdHistory);
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobHistoryResponse> updateHistory(
            @PathVariable Long id,
            @Valid @RequestBody JobHistoryCreateRequest request) {
        JobHistoryResponse updatedHistory = jobHistoryService.update(id, request);
        return ResponseEntity.ok(updatedHistory);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHistory(@PathVariable Long id) {
        jobHistoryService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<JobHistoryResponse> markAsCompleted(@PathVariable Long id) {
        JobHistoryResponse completedHistory = jobHistoryService.markAsCompleted(id);
        return ResponseEntity.ok(completedHistory);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<JobHistoryResponse>> getPendingTasks() {
        List<JobHistoryResponse> pendingTasks = jobHistoryService.findPendingTasks();
        return ResponseEntity.ok(pendingTasks);
    }

    @GetMapping("/job/{jobId}/count")
    public ResponseEntity<Map<String, Long>> getHistoryCounts(@PathVariable Long jobId) {
        Map<String, Long> counts = Map.of(
            "total", jobHistoryService.countByJobId(jobId),
            "interviews", jobHistoryService.countByJobIdAndType(jobId, JobHistory.HistoryType.INTERVIEW_COMPLETED),
            "feedbacks", jobHistoryService.countByJobIdAndType(jobId, JobHistory.HistoryType.FEEDBACK_RECEIVED),
            "shortlists", jobHistoryService.countByJobIdAndType(jobId, JobHistory.HistoryType.SHORTLIST_SENT)
        );
        return ResponseEntity.ok(counts);
    }
}