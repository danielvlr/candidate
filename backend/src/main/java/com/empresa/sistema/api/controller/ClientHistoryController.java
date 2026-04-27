package com.empresa.sistema.api.controller;

import com.empresa.sistema.api.dto.request.ClientHistoryCreateRequest;
import com.empresa.sistema.api.dto.request.ClientHistoryUpdateRequest;
import com.empresa.sistema.api.dto.response.ClientHistoryResponse;
import com.empresa.sistema.domain.entity.JobHistory;
import com.empresa.sistema.domain.service.ClientHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/client-history")
@RequiredArgsConstructor
public class ClientHistoryController {

    private final ClientHistoryService clientHistoryService;

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<ClientHistoryResponse>> getHistoryByClient(@PathVariable Long clientId) {
        List<ClientHistoryResponse> history = clientHistoryService.findByClientId(clientId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/client/{clientId}/paginated")
    public ResponseEntity<Page<ClientHistoryResponse>> getHistoryByClientPaginated(
            @PathVariable Long clientId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ClientHistoryResponse> history = clientHistoryService.findByClientId(clientId, pageable);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/client/{clientId}/type/{type}")
    public ResponseEntity<List<ClientHistoryResponse>> getHistoryByClientAndType(
            @PathVariable Long clientId,
            @PathVariable JobHistory.HistoryType type) {
        List<ClientHistoryResponse> history = clientHistoryService.findByClientIdAndType(clientId, type);
        return ResponseEntity.ok(history);
    }

    @PostMapping
    public ResponseEntity<ClientHistoryResponse> createHistory(@Valid @RequestBody ClientHistoryCreateRequest request) {
        ClientHistoryResponse createdHistory = clientHistoryService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdHistory);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClientHistoryResponse> updateHistory(
            @PathVariable Long id,
            @Valid @RequestBody ClientHistoryUpdateRequest request) {
        ClientHistoryResponse updatedHistory = clientHistoryService.update(id, request);
        return ResponseEntity.ok(updatedHistory);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHistory(@PathVariable Long id) {
        clientHistoryService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ClientHistoryResponse> markAsCompleted(@PathVariable Long id) {
        ClientHistoryResponse completedHistory = clientHistoryService.markAsCompleted(id);
        return ResponseEntity.ok(completedHistory);
    }
}
