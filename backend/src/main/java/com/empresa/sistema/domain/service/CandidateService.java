package com.empresa.sistema.domain.service;

import com.empresa.sistema.api.dto.request.CandidateCreateRequest;
import com.empresa.sistema.api.dto.request.CandidateUpdateRequest;
import com.empresa.sistema.api.dto.response.CandidateResponse;
import com.empresa.sistema.api.mapper.CandidateMapper;
import com.empresa.sistema.domain.entity.Candidate;
import com.empresa.sistema.domain.repository.CandidateRepository;
import com.empresa.sistema.domain.service.exception.ResourceNotFoundException;
import com.empresa.sistema.domain.service.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class CandidateService {

    private final CandidateRepository candidateRepository;
    private final CandidateMapper candidateMapper;

    @Transactional(readOnly = true)
    public Page<CandidateResponse> findAll(Pageable pageable) {
        Page<Candidate> candidates = candidateRepository.findAll(pageable);
        return candidates.map(candidateMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public CandidateResponse findById(Long id) {
        Candidate candidate = candidateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado com ID: " + id));
        return candidateMapper.toResponse(candidate);
    }

    @Transactional(readOnly = true)
    public CandidateResponse findByEmail(String email) {
        Candidate candidate = candidateRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado com email: " + email));
        return candidateMapper.toResponse(candidate);
    }

    @Transactional(readOnly = true)
    public Page<CandidateResponse> searchCandidates(String search, Pageable pageable) {
        Page<Candidate> candidates = candidateRepository.searchCandidates(search, pageable);
        return candidates.map(candidateMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<CandidateResponse> findWithFilters(String headline, String city, Double minSalary,
                                              Double maxSalary, Candidate.WorkPreference workPreference,
                                              Candidate.CandidateStatus status, Pageable pageable) {
        if (status == null) {
            status = Candidate.CandidateStatus.ACTIVE;
        }
        Page<Candidate> candidates = candidateRepository.findWithFilters(
            headline, city, minSalary, maxSalary, workPreference, status, pageable);
        return candidates.map(candidateMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<String> getAllCities() {
        return candidateRepository.findAllCities();
    }

    @Transactional(readOnly = true)
    public List<String> getAllHeadlines() {
        return candidateRepository.findAllHeadlines();
    }

    @Transactional(readOnly = true)
    public List<CandidateResponse> findByStatus(Candidate.CandidateStatus status) {
        List<Candidate> candidates = candidateRepository.findByStatus(status);
        return candidateMapper.toResponseList(candidates);
    }

    public CandidateResponse create(CandidateCreateRequest request) {
        // Verificar se email já existe
        if (candidateRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Já existe um candidato cadastrado com este email: " + request.getEmail());
        }

        Candidate candidate = candidateMapper.toEntity(request);

        // Set default values
        if (candidate.getStatus() == null) {
            candidate.setStatus(Candidate.CandidateStatus.ACTIVE);
        }

        if (candidate.getWillingToRelocate() == null) {
            candidate.setWillingToRelocate(false);
        }

        if (candidate.getWorkPreference() == null) {
            candidate.setWorkPreference(Candidate.WorkPreference.HYBRID);
        }

        // Fix bidirectional relationship with experiences
        if (candidate.getExperiences() != null && !candidate.getExperiences().isEmpty()) {
            candidate.getExperiences().forEach(experience -> experience.setCandidate(candidate));
        }

        // Fix bidirectional relationship with education
        if (candidate.getEducation() != null && !candidate.getEducation().isEmpty()) {
            candidate.getEducation().forEach(education -> education.setCandidate(candidate));
        }

        Candidate savedCandidate = candidateRepository.save(candidate);
        return candidateMapper.toResponse(savedCandidate);
    }

    public CandidateResponse update(Long id, CandidateUpdateRequest request) {
        Candidate existingCandidate = candidateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado com ID: " + id));

        // Verificar se email já existe (exceto para o próprio candidato)
        if (request.getEmail() != null && !existingCandidate.getEmail().equals(request.getEmail()) &&
            candidateRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Já existe um candidato cadastrado com este email: " + request.getEmail());
        }

        // Usar MapStruct para atualizar apenas campos não nulos
        candidateMapper.updateEntityFromRequest(request, existingCandidate);

        // Fix bidirectional relationship with experiences if they were updated
        if (existingCandidate.getExperiences() != null && !existingCandidate.getExperiences().isEmpty()) {
            existingCandidate.getExperiences().forEach(experience -> {
                if (experience.getCandidate() == null) {
                    experience.setCandidate(existingCandidate);
                }
            });
        }

        // Fix bidirectional relationship with education if they were updated
        if (existingCandidate.getEducation() != null && !existingCandidate.getEducation().isEmpty()) {
            existingCandidate.getEducation().forEach(education -> {
                if (education.getCandidate() == null) {
                    education.setCandidate(existingCandidate);
                }
            });
        }

        Candidate updatedCandidate = candidateRepository.save(existingCandidate);
        return candidateMapper.toResponse(updatedCandidate);
    }

    public void delete(Long id) {
        Candidate candidate = candidateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado com ID: " + id));

        // Soft delete - marcar como inativo ao invés de excluir
        candidate.setStatus(Candidate.CandidateStatus.INACTIVE);
        candidateRepository.save(candidate);
    }

    public void activate(Long id) {
        Candidate candidate = candidateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado com ID: " + id));

        candidate.setStatus(Candidate.CandidateStatus.ACTIVE);
        candidateRepository.save(candidate);
    }

    public void blacklist(Long id, String reason) {
        Candidate candidate = candidateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado com ID: " + id));

        candidate.setStatus(Candidate.CandidateStatus.BLACKLISTED);
        candidateRepository.save(candidate);
    }

    @Transactional(readOnly = true)
    public long countByStatus(Candidate.CandidateStatus status) {
        return candidateRepository.countByStatus(status);
    }

    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return candidateRepository.existsByEmail(email);
    }

    public void updateProfilePhoto(Long id, String photoUrl) {
        Candidate candidate = candidateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado com ID: " + id));

        candidate.setProfilePictureUrl(photoUrl);
        candidateRepository.save(candidate);
    }

}