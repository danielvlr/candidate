package com.empresa.sistema.domain.service;

import com.empresa.sistema.api.dto.request.ShortlistCreateRequest;
import com.empresa.sistema.api.dto.response.ShortlistResponse;
import com.empresa.sistema.api.mapper.ShortlistMapper;
import com.empresa.sistema.domain.entity.*;
import com.empresa.sistema.domain.repository.*;
import com.empresa.sistema.domain.service.exception.BusinessException;
import com.empresa.sistema.domain.service.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class ShortlistService {

    private final ShortlistRepository shortlistRepository;
    private final JobRepository jobRepository;
    private final CandidateRepository candidateRepository;
    private final HeadhunterRepository headhunterRepository;
    private final JobHistoryRepository jobHistoryRepository;
    private final ShortlistMapper shortlistMapper;

    @Transactional(readOnly = true)
    public List<ShortlistResponse> findByJobId(Long jobId) {
        List<Shortlist> shortlists = shortlistRepository.findByJobIdOrderBySentAtDesc(jobId);
        return shortlistMapper.toResponseList(shortlists);
    }

    @Transactional(readOnly = true)
    public List<ShortlistResponse> findByJobIdAndStatus(Long jobId, Shortlist.ShortlistStatus status) {
        List<Shortlist> shortlists = shortlistRepository.findByJobIdAndStatusOrderBySentAtDesc(jobId, status);
        return shortlistMapper.toResponseList(shortlists);
    }

    public List<ShortlistResponse> createShortlist(ShortlistCreateRequest request) {
        // Validate job exists
        Job job = jobRepository.findById(request.getJobId())
            .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada com ID: " + request.getJobId()));

        // Validate headhunter exists
        Headhunter headhunter = headhunterRepository.findById(request.getHeadhunterId())
            .orElseThrow(() -> new ResourceNotFoundException("Headhunter não encontrado com ID: " + request.getHeadhunterId()));

        List<Shortlist> shortlists = new ArrayList<>();
        int position = 1;

        for (Long candidateId : request.getCandidateIds()) {
            // Validate candidate exists
            Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado com ID: " + candidateId));

            // Check if candidate is already in shortlist for this job
            if (shortlistRepository.existsByJobIdAndCandidateId(job.getId(), candidateId)) {
                throw new BusinessException("Candidato " + candidate.getFullName() + " já foi enviado para esta vaga");
            }

            // Create shortlist entry
            Shortlist shortlist = Shortlist.builder()
                .job(job)
                .candidate(candidate)
                .headhunter(headhunter)
                .status(Shortlist.ShortlistStatus.SENT)
                .sentAt(LocalDateTime.now())
                .positionInShortlist(position++)
                .notes(request.getNotes())
                .presentationText(request.getPresentationText())
                .build();

            shortlists.add(shortlistRepository.save(shortlist));

            // Create history entry
            JobHistory history = JobHistory.builder()
                .job(job)
                .headhunter(headhunter)
                .candidate(candidate)
                .type(JobHistory.HistoryType.SHORTLIST_SENT)
                .title("Candidato enviado em shortlist")
                .description("Candidato " + candidate.getFullName() + " foi enviado para o cliente na posição " + (position - 1))
                .status(JobHistory.HistoryStatus.COMPLETED)
                .build();

            jobHistoryRepository.save(history);
        }

        return shortlistMapper.toResponseList(shortlists);
    }

    public ShortlistResponse updateStatus(Long shortlistId, Shortlist.ShortlistStatus newStatus, String feedback) {
        Shortlist shortlist = shortlistRepository.findById(shortlistId)
            .orElseThrow(() -> new ResourceNotFoundException("Shortlist não encontrado com ID: " + shortlistId));

        Shortlist.ShortlistStatus oldStatus = shortlist.getStatus();
        shortlist.setStatus(newStatus);

        if (feedback != null) {
            shortlist.setClientFeedback(feedback);
        }

        // Update timestamps based on status
        LocalDateTime now = LocalDateTime.now();
        switch (newStatus) {
            case VIEWED -> shortlist.setViewedAt(now);
            case APPROVED, REJECTED, INTERVIEW_REQUESTED -> shortlist.setRespondedAt(now);
        }

        shortlist = shortlistRepository.save(shortlist);

        // Create history entry for status change
        JobHistory history = JobHistory.builder()
            .job(shortlist.getJob())
            .headhunter(shortlist.getHeadhunter())
            .candidate(shortlist.getCandidate())
            .type(JobHistory.HistoryType.FEEDBACK_RECEIVED)
            .title("Status do shortlist alterado")
            .description("Status alterado de " + oldStatus + " para " + newStatus +
                        (feedback != null ? ". Feedback: " + feedback : ""))
            .status(JobHistory.HistoryStatus.COMPLETED)
            .build();

        jobHistoryRepository.save(history);

        return shortlistMapper.toResponse(shortlist);
    }

    public void deleteShortlist(Long shortlistId) {
        Shortlist shortlist = shortlistRepository.findById(shortlistId)
            .orElseThrow(() -> new ResourceNotFoundException("Shortlist não encontrado com ID: " + shortlistId));

        // Create history entry for withdrawal
        JobHistory history = JobHistory.builder()
            .job(shortlist.getJob())
            .headhunter(shortlist.getHeadhunter())
            .candidate(shortlist.getCandidate())
            .type(JobHistory.HistoryType.SHORTLIST_SENT)
            .title("Shortlist retirado")
            .description("Candidato " + shortlist.getCandidate().getFullName() + " foi retirado do shortlist")
            .status(JobHistory.HistoryStatus.COMPLETED)
            .build();

        jobHistoryRepository.save(history);

        shortlistRepository.delete(shortlist);
    }

    @Transactional(readOnly = true)
    public long countByJobId(Long jobId) {
        return shortlistRepository.countByJobId(jobId);
    }

    @Transactional(readOnly = true)
    public long countByJobIdAndStatus(Long jobId, Shortlist.ShortlistStatus status) {
        return shortlistRepository.countByJobIdAndStatus(jobId, status);
    }
}