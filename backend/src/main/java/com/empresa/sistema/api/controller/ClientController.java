package com.empresa.sistema.api.controller;

import com.empresa.sistema.api.dto.request.ClientCreateRequest;
import com.empresa.sistema.api.dto.request.ClientUpdateRequest;
import com.empresa.sistema.api.dto.response.ClientResponse;
import com.empresa.sistema.domain.entity.Client;
import com.empresa.sistema.domain.service.ClientService;
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
@RequestMapping("/api/v1/clients")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    public ResponseEntity<Page<ClientResponse>> getAllClients(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ClientResponse> clients = clientService.findAll(pageable);
        return ResponseEntity.ok(clients);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClientResponse> getClientById(@PathVariable Long id) {
        ClientResponse client = clientService.findById(id);
        return ResponseEntity.ok(client);
    }

    @GetMapping("/cnpj/{cnpj}")
    public ResponseEntity<ClientResponse> getClientByCnpj(@PathVariable String cnpj) {
        ClientResponse client = clientService.findByCnpj(cnpj);
        return ResponseEntity.ok(client);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ClientResponse>> searchClients(
            @RequestParam String q,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ClientResponse> clients = clientService.searchClients(q, pageable);
        return ResponseEntity.ok(clients);
    }

    @GetMapping("/filter")
    public ResponseEntity<Page<ClientResponse>> filterClients(
            @RequestParam(required = false) String companyName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String industry,
            @RequestParam(required = false) Client.ClientStatus status,
            @RequestParam(required = false) Client.ClientType type,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<ClientResponse> clients = clientService.findWithFilters(
            companyName, email, city, industry, status, type, pageable);
        return ResponseEntity.ok(clients);
    }

    @GetMapping("/cities")
    public ResponseEntity<List<String>> getAllCities() {
        List<String> cities = clientService.getAllCities();
        return ResponseEntity.ok(cities);
    }

    @GetMapping("/industries")
    public ResponseEntity<List<String>> getAllIndustries() {
        List<String> industries = clientService.getAllIndustries();
        return ResponseEntity.ok(industries);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ClientResponse>> getClientsByStatus(
            @PathVariable Client.ClientStatus status) {
        List<ClientResponse> clients = clientService.findByStatus(status);
        return ResponseEntity.ok(clients);
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<ClientResponse>> getClientsByType(
            @PathVariable Client.ClientType type) {
        List<ClientResponse> clients = clientService.findByType(type);
        return ResponseEntity.ok(clients);
    }

    @GetMapping("/industry/{industry}")
    public ResponseEntity<List<ClientResponse>> getClientsByIndustry(
            @PathVariable String industry) {
        List<ClientResponse> clients = clientService.findByIndustry(industry);
        return ResponseEntity.ok(clients);
    }

    @PostMapping
    public ResponseEntity<ClientResponse> createClient(@Valid @RequestBody ClientCreateRequest request) {
        ClientResponse createdClient = clientService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdClient);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClientResponse> updateClient(
            @PathVariable Long id,
            @Valid @RequestBody ClientUpdateRequest request) {
        ClientResponse updatedClient = clientService.update(id, request);
        return ResponseEntity.ok(updatedClient);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id) {
        clientService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activateClient(@PathVariable Long id) {
        clientService.activate(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/suspend")
    public ResponseEntity<Void> suspendClient(@PathVariable Long id) {
        clientService.suspend(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getClientsCounts() {
        Map<String, Long> counts = Map.of(
            "active", clientService.countByStatus(Client.ClientStatus.ACTIVE),
            "inactive", clientService.countByStatus(Client.ClientStatus.INACTIVE),
            "suspended", clientService.countByStatus(Client.ClientStatus.SUSPENDED),
            "prospect", clientService.countByStatus(Client.ClientStatus.PROSPECT)
        );
        return ResponseEntity.ok(counts);
    }

    @GetMapping("/count-by-type")
    public ResponseEntity<Map<String, Long>> getClientsCountByType() {
        Map<String, Long> counts = Map.of(
            "startup", clientService.countByType(Client.ClientType.STARTUP),
            "sme", clientService.countByType(Client.ClientType.SME),
            "enterprise", clientService.countByType(Client.ClientType.ENTERPRISE),
            "multinational", clientService.countByType(Client.ClientType.MULTINATIONAL),
            "government", clientService.countByType(Client.ClientType.GOVERNMENT),
            "ngo", clientService.countByType(Client.ClientType.NGO),
            "consulting", clientService.countByType(Client.ClientType.CONSULTING)
        );
        return ResponseEntity.ok(counts);
    }

    @GetMapping("/exists-cnpj")
    public ResponseEntity<Map<String, Boolean>> checkCnpjExists(@RequestParam String cnpj) {
        boolean exists = clientService.existsByCnpj(cnpj);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    // Endpoints para listar enums disponíveis
    @GetMapping("/enums/status")
    public ResponseEntity<Client.ClientStatus[]> getStatusValues() {
        return ResponseEntity.ok(Client.ClientStatus.values());
    }

    @GetMapping("/enums/type")
    public ResponseEntity<Client.ClientType[]> getTypeValues() {
        return ResponseEntity.ok(Client.ClientType.values());
    }
}