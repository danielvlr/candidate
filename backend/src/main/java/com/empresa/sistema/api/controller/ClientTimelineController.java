package com.empresa.sistema.api.controller;

import com.empresa.sistema.api.dto.TimelineEntryDTO;
import com.empresa.sistema.domain.service.ClientTimelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/clients")
@RequiredArgsConstructor
public class ClientTimelineController {

    private final ClientTimelineService clientTimelineService;

    @GetMapping("/{clientId}/timeline")
    public ResponseEntity<Page<TimelineEntryDTO>> getTimeline(
            @PathVariable Long clientId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) Long jobId,
            @RequestParam(required = false) Boolean empresaOnly) {

        Page<TimelineEntryDTO> page =
            clientTimelineService.getTimeline(clientId, pageable, jobId, empresaOnly);
        return ResponseEntity.ok(page);
    }
}
