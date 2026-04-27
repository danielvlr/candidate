package com.empresa.sistema.domain.service;

import com.empresa.sistema.api.dto.request.ClientHistoryCreateRequest;
import com.empresa.sistema.api.dto.request.ClientHistoryUpdateRequest;
import com.empresa.sistema.api.dto.response.ClientHistoryResponse;
import com.empresa.sistema.api.mapper.ClientHistoryMapper;
import com.empresa.sistema.domain.entity.Client;
import com.empresa.sistema.domain.entity.ClientHistory;
import com.empresa.sistema.domain.entity.Headhunter;
import com.empresa.sistema.domain.entity.JobHistory;
import com.empresa.sistema.domain.repository.ClientHistoryRepository;
import com.empresa.sistema.domain.repository.ClientRepository;
import com.empresa.sistema.domain.repository.HeadhunterRepository;
import com.empresa.sistema.domain.service.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class ClientHistoryService {

    private final ClientHistoryRepository clientHistoryRepository;
    private final ClientRepository clientRepository;
    private final HeadhunterRepository headhunterRepository;
    private final ClientHistoryMapper clientHistoryMapper;

    @Transactional(readOnly = true)
    public List<ClientHistoryResponse> findByClientId(Long clientId) {
        List<ClientHistory> histories = clientHistoryRepository.findByClientIdOrderByCreatedAtDesc(clientId);
        return clientHistoryMapper.toResponseList(histories);
    }

    @Transactional(readOnly = true)
    public Page<ClientHistoryResponse> findByClientId(Long clientId, Pageable pageable) {
        Page<ClientHistory> histories = clientHistoryRepository.findByClientId(clientId, pageable);
        return histories.map(clientHistoryMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<ClientHistoryResponse> findByClientIdAndType(Long clientId, JobHistory.HistoryType type) {
        List<ClientHistory> histories = clientHistoryRepository.findByClientIdAndTypeOrderByCreatedAtDesc(clientId, type);
        return clientHistoryMapper.toResponseList(histories);
    }

    public ClientHistoryResponse create(ClientHistoryCreateRequest request) {
        Client client = clientRepository.findById(request.getClientId())
            .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + request.getClientId()));

        ClientHistory clientHistory = clientHistoryMapper.toEntity(request);
        clientHistory.setClient(client);

        // Default type to NOTE if not provided
        if (clientHistory.getType() == null) {
            clientHistory.setType(JobHistory.HistoryType.NOTE);
        }

        if (request.getHeadhunterId() != null) {
            Headhunter headhunter = headhunterRepository.findById(request.getHeadhunterId())
                .orElseThrow(() -> new ResourceNotFoundException("Headhunter não encontrado com ID: " + request.getHeadhunterId()));
            clientHistory.setHeadhunter(headhunter);
        }

        ClientHistory savedHistory = clientHistoryRepository.save(clientHistory);
        return clientHistoryMapper.toResponse(savedHistory);
    }

    public ClientHistoryResponse update(Long id, ClientHistoryUpdateRequest request) {
        ClientHistory existingHistory = clientHistoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Histórico não encontrado com ID: " + id));

        clientHistoryMapper.updateEntityFromRequest(request, existingHistory);

        ClientHistory updatedHistory = clientHistoryRepository.save(existingHistory);
        return clientHistoryMapper.toResponse(updatedHistory);
    }

    public void delete(Long id) {
        ClientHistory clientHistory = clientHistoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Histórico não encontrado com ID: " + id));

        clientHistoryRepository.delete(clientHistory);
    }

    public ClientHistoryResponse markAsCompleted(Long id) {
        ClientHistory clientHistory = clientHistoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Histórico não encontrado com ID: " + id));

        clientHistory.setCompletedAt(LocalDateTime.now());

        ClientHistory updatedHistory = clientHistoryRepository.save(clientHistory);
        return clientHistoryMapper.toResponse(updatedHistory);
    }

    @Transactional(readOnly = true)
    public long countByClientId(Long clientId) {
        return clientHistoryRepository.countByClientId(clientId);
    }
}
