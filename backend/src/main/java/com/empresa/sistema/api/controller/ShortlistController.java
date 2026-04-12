package com.empresa.sistema.api.controller;

import com.empresa.sistema.api.dto.request.ShortlistCreateRequest;
import com.empresa.sistema.api.dto.response.ShortlistResponse;
import com.empresa.sistema.domain.entity.Shortlist;
import com.empresa.sistema.domain.service.ShortlistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/shortlists")
@RequiredArgsConstructor
public class ShortlistController {

    private final ShortlistService shortlistService;

    @GetMapping("/job/{jobId}")
    public ResponseEntity<List<ShortlistResponse>> getShortlistsByJob(@PathVariable Long jobId) {
        List<ShortlistResponse> shortlists = shortlistService.findByJobId(jobId);
        return ResponseEntity.ok(shortlists);
    }

    @GetMapping("/job/{jobId}/status/{status}")
    public ResponseEntity<List<ShortlistResponse>> getShortlistsByJobAndStatus(
            @PathVariable Long jobId,
            @PathVariable Shortlist.ShortlistStatus status) {
        List<ShortlistResponse> shortlists = shortlistService.findByJobIdAndStatus(jobId, status);
        return ResponseEntity.ok(shortlists);
    }

    @PostMapping
    public ResponseEntity<List<ShortlistResponse>> createShortlist(
            @Valid @RequestBody ShortlistCreateRequest request) {
        List<ShortlistResponse> shortlists = shortlistService.createShortlist(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(shortlists);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ShortlistResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam Shortlist.ShortlistStatus status,
            @RequestParam(required = false) String feedback) {
        ShortlistResponse updatedShortlist = shortlistService.updateStatus(id, status, feedback);
        return ResponseEntity.ok(updatedShortlist);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShortlist(@PathVariable Long id) {
        shortlistService.deleteShortlist(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/job/{jobId}/count")
    public ResponseEntity<Map<String, Long>> getShortlistCounts(@PathVariable Long jobId) {
        Map<String, Long> counts = Map.of(
            "total", shortlistService.countByJobId(jobId),
            "approved", shortlistService.countByJobIdAndStatus(jobId, Shortlist.ShortlistStatus.APPROVED),
            "rejected", shortlistService.countByJobIdAndStatus(jobId, Shortlist.ShortlistStatus.REJECTED),
            "pending", shortlistService.countByJobIdAndStatus(jobId, Shortlist.ShortlistStatus.SENT) +
                      shortlistService.countByJobIdAndStatus(jobId, Shortlist.ShortlistStatus.VIEWED) +
                      shortlistService.countByJobIdAndStatus(jobId, Shortlist.ShortlistStatus.UNDER_REVIEW)
        );
        return ResponseEntity.ok(counts);
    }
}