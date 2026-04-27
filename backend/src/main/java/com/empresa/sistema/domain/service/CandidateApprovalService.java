package com.empresa.sistema.domain.service;

import com.empresa.sistema.api.dto.response.CandidateResponse;
import com.empresa.sistema.api.mapper.CandidateMapper;
import com.empresa.sistema.domain.entity.Candidate;
import com.empresa.sistema.domain.entity.Candidate.CandidateStatus;
import com.empresa.sistema.domain.repository.CandidateRepository;
import com.empresa.sistema.domain.service.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateApprovalService {

    private final CandidateRepository candidateRepo;
    private final CandidateMapper candidateMapper;

    @Transactional
    public CandidateResponse approve(Long candidateId, Long headhunterId) {
        int rows = candidateRepo.approveIfPending(candidateId, headhunterId, LocalDateTime.now());
        if (rows == 0) {
            Candidate existing = candidateRepo.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado: " + candidateId));
            throw new IllegalStateException(
                "Candidato não está em PENDING_APPROVAL (status atual: " + existing.getStatus() + ")");
        }
        Candidate updated = candidateRepo.findById(candidateId).orElseThrow();
        log.info("candidate_approved candidate_id={} headhunter_id={}", candidateId, headhunterId);
        return candidateMapper.toResponse(updated);
    }

    @Transactional
    public CandidateResponse reject(Long candidateId, String reason, Long headhunterId) {
        Candidate c = candidateRepo.findById(candidateId)
            .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado: " + candidateId));
        if (c.getStatus() != CandidateStatus.PENDING_APPROVAL) {
            throw new IllegalStateException(
                "Candidato não está em PENDING_APPROVAL (status atual: " + c.getStatus() + ")");
        }
        c.setStatus(CandidateStatus.REJECTED);
        c.setApprovedByHeadhunterId(headhunterId);
        c.setRejectedAt(LocalDateTime.now());
        c.setRejectionReason(reason);
        candidateRepo.save(c);
        log.info("candidate_rejected candidate_id={} headhunter_id={} reason_len={}",
                 candidateId, headhunterId, reason != null ? reason.length() : 0);
        return candidateMapper.toResponse(c);
    }
}
