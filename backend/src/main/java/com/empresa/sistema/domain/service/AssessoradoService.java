package com.empresa.sistema.domain.service;

import com.empresa.sistema.api.dto.request.AssessoradoCreateRequest;
import com.empresa.sistema.api.dto.request.AssessoradoUpdateRequest;
import com.empresa.sistema.api.dto.response.AssessoradoHistoryResponse;
import com.empresa.sistema.api.dto.response.AssessoradoResponse;
import com.empresa.sistema.api.mapper.AssessoradoMapper;
import com.empresa.sistema.domain.entity.Assessorado;
import com.empresa.sistema.domain.entity.AssessoradoHistory;
import com.empresa.sistema.domain.entity.Candidate;
import com.empresa.sistema.domain.entity.Headhunter;
import com.empresa.sistema.domain.repository.AssessoradoHistoryRepository;
import com.empresa.sistema.domain.repository.AssessoradoRepository;
import com.empresa.sistema.domain.repository.CandidateRepository;
import com.empresa.sistema.domain.repository.HeadhunterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
public class AssessoradoService {

    private final AssessoradoRepository assessoradoRepository;
    private final AssessoradoHistoryRepository historyRepository;
    private final AssessoradoMapper assessoradoMapper;
    private final CandidateRepository candidateRepository;
    private final HeadhunterRepository headhunterRepository;

    @Transactional(readOnly = true)
    public Page<AssessoradoResponse> findAll(Pageable pageable) {
        return assessoradoRepository.findAll(pageable)
                .map(assessoradoMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public AssessoradoResponse findById(Long id) {
        Assessorado assessorado = assessoradoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Assessorado não encontrado"));
        return assessoradoMapper.toResponse(assessorado);
    }

    @Transactional(readOnly = true)
    public Page<AssessoradoResponse> findBySeniorId(Long seniorId, Pageable pageable) {
        return assessoradoRepository.findBySeniorIdOrderByCreatedAtDesc(seniorId, pageable)
                .map(assessoradoMapper::toResponse);
    }

    public AssessoradoResponse create(AssessoradoCreateRequest request) {
        Candidate candidate = candidateRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new IllegalArgumentException("Candidato não encontrado"));

        Headhunter senior = headhunterRepository.findById(request.getSeniorId())
                .orElseThrow(() -> new IllegalArgumentException("Senior não encontrado"));

        boolean duplicateExists = assessoradoRepository.existsByCandidateIdAndSeniorIdAndStatusIn(
                request.getCandidateId(),
                request.getSeniorId(),
                List.of(Assessorado.AssessoradoStatus.ACTIVE, Assessorado.AssessoradoStatus.PAUSED)
        );
        if (duplicateExists) {
            throw new IllegalStateException("Já existe uma assessoria ativa para este candidato com este senior");
        }

        Assessorado assessorado = assessoradoMapper.toEntity(request);
        assessorado.setCandidate(candidate);
        assessorado.setSenior(senior);
        assessorado.setStatus(Assessorado.AssessoradoStatus.ACTIVE);

        if (assessorado.getCurrentPhase() == null) {
            assessorado.setCurrentPhase(Assessorado.AssessoradoPhase.ONBOARDING);
        }

        assessorado = assessoradoRepository.save(assessorado);

        createHistory(assessorado, AssessoradoHistory.ActionType.CREATED,
                "Assessoria criada", "Assessoria iniciada no sistema");

        return assessoradoMapper.toResponse(assessorado);
    }

    public AssessoradoResponse update(Long id, AssessoradoUpdateRequest request) {
        Assessorado assessorado = assessoradoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Assessorado não encontrado"));

        assessoradoMapper.updateEntityFromRequest(request, assessorado);
        assessorado = assessoradoRepository.save(assessorado);

        createHistory(assessorado, AssessoradoHistory.ActionType.UPDATED,
                "Assessoria atualizada", "Dados da assessoria foram atualizados");

        return assessoradoMapper.toResponse(assessorado);
    }

    public void changePhase(Long id, Assessorado.AssessoradoPhase newPhase) {
        Assessorado assessorado = assessoradoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Assessorado não encontrado"));

        Assessorado.AssessoradoPhase oldPhase = assessorado.getCurrentPhase();
        assessorado.setCurrentPhase(newPhase);
        assessoradoRepository.save(assessorado);

        createHistory(assessorado, AssessoradoHistory.ActionType.PHASE_CHANGED,
                "Fase alterada",
                String.format("Fase alterada de %s para %s", oldPhase, newPhase),
                "currentPhase", oldPhase.name(), newPhase.name());
    }

    public void changeStatus(Long id, Assessorado.AssessoradoStatus newStatus) {
        Assessorado assessorado = assessoradoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Assessorado não encontrado"));

        Assessorado.AssessoradoStatus oldStatus = assessorado.getStatus();
        assessorado.setStatus(newStatus);
        assessoradoRepository.save(assessorado);

        createHistory(assessorado, AssessoradoHistory.ActionType.STATUS_CHANGED,
                "Status alterado",
                String.format("Status alterado de %s para %s", oldStatus, newStatus),
                "status", oldStatus.name(), newStatus.name());
    }

    public void delete(Long id) {
        Assessorado assessorado = assessoradoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Assessorado não encontrado"));

        assessorado.setStatus(Assessorado.AssessoradoStatus.CANCELLED);
        assessoradoRepository.save(assessorado);

        createHistory(assessorado, AssessoradoHistory.ActionType.STATUS_CHANGED,
                "Assessoria cancelada", "Assessoria cancelada no sistema");
    }

    @Transactional(readOnly = true)
    public List<AssessoradoHistoryResponse> getHistory(Long assessoradoId) {
        List<AssessoradoHistory> histories = historyRepository.findByAssessoradoIdOrderByCreatedAtDesc(assessoradoId);
        return assessoradoMapper.toHistoryResponseList(histories);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countBySeniorId(Long seniorId) {
        long total = assessoradoRepository.countBySeniorId(seniorId);
        long active = assessoradoRepository.countBySeniorIdAndStatus(seniorId, Assessorado.AssessoradoStatus.ACTIVE);
        long paused = assessoradoRepository.countBySeniorIdAndStatus(seniorId, Assessorado.AssessoradoStatus.PAUSED);
        long completed = assessoradoRepository.countBySeniorIdAndStatus(seniorId, Assessorado.AssessoradoStatus.COMPLETED);
        long cancelled = assessoradoRepository.countBySeniorIdAndStatus(seniorId, Assessorado.AssessoradoStatus.CANCELLED);
        return Map.of(
                "total", total,
                "active", active,
                "paused", paused,
                "completed", completed,
                "cancelled", cancelled
        );
    }

    // Private helpers

    private void createHistory(Assessorado assessorado, AssessoradoHistory.ActionType actionType,
                               String title, String description) {
        AssessoradoHistory history = new AssessoradoHistory(assessorado, actionType, title, description);
        historyRepository.save(history);
    }

    private void createHistory(Assessorado assessorado, AssessoradoHistory.ActionType actionType,
                               String title, String description,
                               String changedField, String oldValue, String newValue) {
        AssessoradoHistory history = new AssessoradoHistory(assessorado, actionType, title, description,
                changedField, oldValue, newValue);
        historyRepository.save(history);
    }
}
