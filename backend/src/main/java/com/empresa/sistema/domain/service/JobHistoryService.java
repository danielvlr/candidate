package com.empresa.sistema.domain.service;

import com.empresa.sistema.api.dto.request.JobHistoryCreateRequest;
import com.empresa.sistema.api.dto.response.JobHistoryResponse;
import com.empresa.sistema.api.mapper.JobHistoryMapper;
import com.empresa.sistema.domain.entity.*;
import com.empresa.sistema.domain.repository.*;
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
public class JobHistoryService {

    private final JobHistoryRepository jobHistoryRepository;
    private final JobRepository jobRepository;
    private final CandidateRepository candidateRepository;
    private final HeadhunterRepository headhunterRepository;
    private final JobHistoryMapper jobHistoryMapper;

    @Transactional(readOnly = true)
    public List<JobHistoryResponse> findByJobId(Long jobId) {
        List<JobHistory> histories = jobHistoryRepository.findByJobIdOrderByCreatedAtDesc(jobId);
        return jobHistoryMapper.toResponseList(histories);
    }

    @Transactional(readOnly = true)
    public Page<JobHistoryResponse> findByJobId(Long jobId, Pageable pageable) {
        Page<JobHistory> histories = jobHistoryRepository.findByJobIdOrderByCreatedAtDesc(jobId, pageable);
        return histories.map(jobHistoryMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<JobHistoryResponse> findByJobIdAndType(Long jobId, JobHistory.HistoryType type) {
        List<JobHistory> histories = jobHistoryRepository.findByJobIdAndTypeOrderByCreatedAtDesc(jobId, type);
        return jobHistoryMapper.toResponseList(histories);
    }

    @Transactional(readOnly = true)
    public List<JobHistoryResponse> findByJobIdAndCandidateId(Long jobId, Long candidateId) {
        List<JobHistory> histories = jobHistoryRepository.findByJobIdAndCandidateIdOrderByCreatedAtDesc(jobId, candidateId);
        return jobHistoryMapper.toResponseList(histories);
    }

    public JobHistoryResponse create(JobHistoryCreateRequest request) {
        // Validate job exists
        Job job = jobRepository.findById(request.getJobId())
            .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada com ID: " + request.getJobId()));

        JobHistory jobHistory = jobHistoryMapper.toEntity(request);
        jobHistory.setJob(job);

        // Set optional relationships
        if (request.getHeadhunterId() != null) {
            Headhunter headhunter = headhunterRepository.findById(request.getHeadhunterId())
                .orElseThrow(() -> new ResourceNotFoundException("Headhunter não encontrado com ID: " + request.getHeadhunterId()));
            jobHistory.setHeadhunter(headhunter);
        }

        if (request.getCandidateId() != null) {
            Candidate candidate = candidateRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado com ID: " + request.getCandidateId()));
            jobHistory.setCandidate(candidate);
        }

        // Set default status if not provided
        if (jobHistory.getStatus() == null) {
            jobHistory.setStatus(JobHistory.HistoryStatus.COMPLETED);
        }

        JobHistory savedHistory = jobHistoryRepository.save(jobHistory);
        return jobHistoryMapper.toResponse(savedHistory);
    }

    public JobHistoryResponse update(Long id, JobHistoryCreateRequest request) {
        JobHistory existingHistory = jobHistoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Histórico não encontrado com ID: " + id));

        jobHistoryMapper.updateEntityFromRequest(request, existingHistory);

        // Update optional relationships
        if (request.getHeadhunterId() != null) {
            Headhunter headhunter = headhunterRepository.findById(request.getHeadhunterId())
                .orElseThrow(() -> new ResourceNotFoundException("Headhunter não encontrado com ID: " + request.getHeadhunterId()));
            existingHistory.setHeadhunter(headhunter);
        }

        if (request.getCandidateId() != null) {
            Candidate candidate = candidateRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado com ID: " + request.getCandidateId()));
            existingHistory.setCandidate(candidate);
        }

        JobHistory updatedHistory = jobHistoryRepository.save(existingHistory);
        return jobHistoryMapper.toResponse(updatedHistory);
    }

    public void delete(Long id) {
        JobHistory jobHistory = jobHistoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Histórico não encontrado com ID: " + id));

        jobHistoryRepository.delete(jobHistory);
    }

    public JobHistoryResponse markAsCompleted(Long id) {
        JobHistory jobHistory = jobHistoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Histórico não encontrado com ID: " + id));

        jobHistory.setStatus(JobHistory.HistoryStatus.COMPLETED);
        jobHistory.setCompletedAt(LocalDateTime.now());

        JobHistory updatedHistory = jobHistoryRepository.save(jobHistory);
        return jobHistoryMapper.toResponse(updatedHistory);
    }

    @Transactional(readOnly = true)
    public long countByJobId(Long jobId) {
        return jobHistoryRepository.countByJobId(jobId);
    }

    @Transactional(readOnly = true)
    public long countByJobIdAndType(Long jobId, JobHistory.HistoryType type) {
        return jobHistoryRepository.countByJobIdAndType(jobId, type);
    }

    @Transactional(readOnly = true)
    public List<JobHistoryResponse> findPendingTasks() {
        List<JobHistory> pendingTasks = jobHistoryRepository.findByStatusAndScheduledDateBeforeOrderByScheduledDateAsc(
            JobHistory.HistoryStatus.PENDING, LocalDateTime.now());
        return jobHistoryMapper.toResponseList(pendingTasks);
    }
}