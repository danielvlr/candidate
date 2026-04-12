package com.empresa.sistema.domain.service;

import com.empresa.sistema.api.dto.request.HeadhunterCreateRequest;
import com.empresa.sistema.api.dto.request.HeadhunterUpdateRequest;
import com.empresa.sistema.api.dto.response.HeadhunterResponse;
import com.empresa.sistema.api.dto.response.HeadhunterHistoryResponse;
import com.empresa.sistema.api.mapper.HeadhunterMapper;
import com.empresa.sistema.api.mapper.HeadhunterHistoryMapper;
import com.empresa.sistema.domain.entity.Headhunter;
import com.empresa.sistema.domain.entity.HeadhunterHistory;
import com.empresa.sistema.domain.repository.HeadhunterRepository;
import com.empresa.sistema.domain.repository.HeadhunterHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class HeadhunterService {

    private final HeadhunterRepository headhunterRepository;
    private final HeadhunterHistoryRepository historyRepository;
    private final HeadhunterMapper headhunterMapper;
    private final HeadhunterHistoryMapper historyMapper;


    public Page<HeadhunterResponse> findAll(Pageable pageable) {
        return headhunterRepository.findAll(pageable)
                .map(headhunterMapper::toResponse);
    }

    public Page<HeadhunterResponse> findWithFilters(String name, String email,
                                              Headhunter.Seniority seniority,
                                              Headhunter.HeadhunterStatus status,
                                              Pageable pageable) {
        return headhunterRepository.findWithFilters(name, email, seniority, status, pageable)
                .map(headhunterMapper::toResponse);
    }

    public Optional<HeadhunterResponse> findById(Long id) {
        return headhunterRepository.findById(id)
                .map(headhunterMapper::toResponse);
    }

    public Optional<HeadhunterResponse> findByEmail(String email) {
        return headhunterRepository.findByEmail(email)
                .map(headhunterMapper::toResponse);
    }

    public List<HeadhunterResponse> findByStatus(Headhunter.HeadhunterStatus status) {
        List<Headhunter> headhunters = headhunterRepository.findByStatus(status);
        return headhunterMapper.toResponseList(headhunters);
    }

    public List<HeadhunterResponse> findBySeniority(Headhunter.Seniority seniority) {
        List<Headhunter> headhunters = headhunterRepository.findBySeniority(seniority);
        return headhunterMapper.toResponseList(headhunters);
    }

    public List<HeadhunterResponse> findByResponsibleArea(String area) {
        List<Headhunter> headhunters = headhunterRepository.findByResponsibleArea(area);
        return headhunterMapper.toResponseList(headhunters);
    }

    public HeadhunterResponse create(HeadhunterCreateRequest request) {
        if (headhunterRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email já cadastrado");
        }

        Headhunter headhunter = headhunterMapper.toEntity(request);

        // Definir status padrão
        if (headhunter.getStatus() == null) {
            headhunter.setStatus(Headhunter.HeadhunterStatus.ACTIVE);
        }

        headhunter = headhunterRepository.save(headhunter);

        // Criar histórico
        createHistory(headhunter, HeadhunterHistory.ActionType.CREATED,
                "Headhunter criado no sistema", "admin@sistema.com", null, null);

        return headhunterMapper.toResponse(headhunter);
    }

    public HeadhunterResponse update(Long id, HeadhunterUpdateRequest request) {
        Headhunter existingHeadhunter = headhunterRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Headhunter não encontrado"));

        // Verificar se email já existe (exceto o próprio)
        if (request.getEmail() != null && !existingHeadhunter.getEmail().equals(request.getEmail()) &&
            headhunterRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email já cadastrado");
        }

        // Criar histórico das alterações
        createHistory(existingHeadhunter, HeadhunterHistory.ActionType.UPDATED,
                "Perfil do headhunter atualizado", "admin@sistema.com", null, null);

        // Usar MapStruct para atualizar apenas campos não nulos
        headhunterMapper.updateEntityFromRequest(request, existingHeadhunter);
        existingHeadhunter = headhunterRepository.save(existingHeadhunter);

        return headhunterMapper.toResponse(existingHeadhunter);
    }

    public void changeStatus(Long id, Headhunter.HeadhunterStatus newStatus) {
        Headhunter headhunter = headhunterRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Headhunter não encontrado"));

        Headhunter.HeadhunterStatus oldStatus = headhunter.getStatus();
        headhunter.setStatus(newStatus);
        headhunterRepository.save(headhunter);

        // Criar histórico
        HeadhunterHistory.ActionType actionType = getActionTypeForStatus(newStatus);
        createHistory(headhunter, actionType,
                String.format("Status alterado de %s para %s", oldStatus, newStatus),
                "admin@sistema.com", null, null);
    }

    public void delete(Long id) {
        Headhunter headhunter = headhunterRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Headhunter não encontrado"));

        // Criar histórico antes de deletar
        createHistory(headhunter, HeadhunterHistory.ActionType.DELETED,
                "Headhunter removido do sistema", "admin@sistema.com", null, null);

        headhunterRepository.delete(headhunter);
    }

    // Métodos para histórico
    public List<HeadhunterHistoryResponse> getHistory(Long headhunterId) {
        List<HeadhunterHistory> histories = historyRepository.findByHeadhunterIdOrderByCreatedAtDesc(headhunterId);
        return historyMapper.toResponseList(histories);
    }

    public Page<HeadhunterHistoryResponse> getHistoryPaged(Long headhunterId, Pageable pageable) {
        return historyRepository.findByHeadhunterIdOrderByCreatedAtDesc(headhunterId, pageable)
                .map(historyMapper::toResponse);
    }

    public List<HeadhunterHistoryResponse> getHistoryByDateRange(Long headhunterId,
                                                           LocalDateTime startDate,
                                                           LocalDateTime endDate) {
        List<HeadhunterHistory> histories = historyRepository.findByHeadhunterAndDateRange(headhunterId, startDate, endDate);
        return historyMapper.toResponseList(histories);
    }

    // Métodos para estatísticas
    public Long countByStatus(Headhunter.HeadhunterStatus status) {
        return headhunterRepository.countByStatus(status);
    }

    public Long countBySeniority(Headhunter.Seniority seniority) {
        return headhunterRepository.countBySeniority(seniority);
    }

    // Métodos privados

    private void createHistory(Headhunter headhunter, HeadhunterHistory.ActionType actionType,
                              String description, String changedBy, String ipAddress, String userAgent) {
        HeadhunterHistory history = new HeadhunterHistory(headhunter, actionType, description);
        history.setChangedBy(changedBy);
        history.setIpAddress(ipAddress);
        history.setUserAgent(userAgent);
        historyRepository.save(history);
    }

    private void createHistory(Headhunter headhunter, HeadhunterHistory.ActionType actionType,
                              String description, String changedField, String oldValue,
                              String newValue, String changedBy, String ipAddress, String userAgent) {
        HeadhunterHistory history = new HeadhunterHistory(headhunter, actionType, description,
                changedField, oldValue, newValue, changedBy);
        history.setIpAddress(ipAddress);
        history.setUserAgent(userAgent);
        historyRepository.save(history);
    }

    private HeadhunterHistory.ActionType getActionTypeForStatus(Headhunter.HeadhunterStatus status) {
        return switch (status) {
            case ACTIVE -> HeadhunterHistory.ActionType.ACTIVATED;
            case SUSPENDED -> HeadhunterHistory.ActionType.SUSPENDED;
            default -> HeadhunterHistory.ActionType.STATUS_CHANGED;
        };
    }
}