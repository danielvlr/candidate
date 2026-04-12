package com.empresa.sistema.domain.service;

import com.empresa.sistema.domain.entity.JobApplication;
import com.empresa.sistema.domain.entity.Candidate;
import com.empresa.sistema.domain.entity.Job;
import com.empresa.sistema.domain.repository.JobApplicationRepository;
import com.empresa.sistema.domain.repository.CandidateRepository;
import com.empresa.sistema.domain.repository.JobRepository;
import com.empresa.sistema.domain.service.exception.ResourceNotFoundException;
import com.empresa.sistema.domain.service.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@Slf4j
public class JobApplicationService {

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private WarrantyService warrantyService;

    public JobApplication applyForJob(Long candidateId, Long jobId, String coverLetter) {
        // Verificar se candidato existe
        Candidate candidate = candidateRepository.findById(candidateId)
            .orElseThrow(() -> new ResourceNotFoundException("Candidato não encontrado com ID: " + candidateId));

        // Verificar se vaga existe
        Job job = jobRepository.findById(jobId)
            .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada com ID: " + jobId));

        // Verificar se a vaga está ativa
        if (job.getStatus() != Job.JobStatus.ACTIVE) {
            throw new BusinessException("Esta vaga não está mais disponível para candidaturas");
        }

        // Verificar se candidato já se candidatou para esta vaga
        if (jobApplicationRepository.existsByCandidateIdAndJobId(candidateId, jobId)) {
            throw new BusinessException("Candidato já se candidatou para esta vaga");
        }

        // Verificar se candidato está ativo
        if (candidate.getStatus() != Candidate.CandidateStatus.ACTIVE) {
            throw new BusinessException("Candidato deve estar ativo para se candidatar");
        }

        // Criar aplicação
        JobApplication application = new JobApplication(candidate, job);
        application.setCoverLetter(coverLetter);
        application.setStatus(JobApplication.ApplicationStatus.APPLIED);

        JobApplication savedApplication = jobApplicationRepository.save(application);

        // Incrementar contador de candidaturas da vaga
        jobRepository.incrementApplicationsCount(jobId);

        return savedApplication;
    }

    @Transactional(readOnly = true)
    public Page<JobApplication> findByJobId(Long jobId, Pageable pageable) {
        return jobApplicationRepository.findByJobIdOrderByAppliedAtDesc(jobId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<JobApplication> findByCandidateId(Long candidateId, Pageable pageable) {
        return jobApplicationRepository.findByCandidateIdOrderByAppliedAtDesc(candidateId, pageable);
    }

    @Transactional(readOnly = true)
    public JobApplication findById(Long id) {
        return jobApplicationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Candidatura não encontrada com ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<JobApplication> findByStatus(JobApplication.ApplicationStatus status) {
        return jobApplicationRepository.findByStatus(status);
    }

    public JobApplication updateStatus(Long applicationId, JobApplication.ApplicationStatus newStatus) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Candidatura não encontrada com ID: " + applicationId));

        application.setStatus(newStatus);

        // Marcar como revisado se necessário
        if (newStatus != JobApplication.ApplicationStatus.APPLIED && application.getReviewedAt() == null) {
            application.setReviewedAt(LocalDateTime.now());
        }

        return jobApplicationRepository.save(application);
    }

    public JobApplication scheduleInterview(Long applicationId, LocalDateTime interviewDate) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Candidatura não encontrada com ID: " + applicationId));

        application.setInterviewDate(interviewDate);
        application.setStatus(JobApplication.ApplicationStatus.INTERVIEW_SCHEDULED);

        if (application.getReviewedAt() == null) {
            application.setReviewedAt(LocalDateTime.now());
        }

        return jobApplicationRepository.save(application);
    }

    public JobApplication addFeedback(Long applicationId, String feedback, Integer rating) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Candidatura não encontrada com ID: " + applicationId));

        application.setFeedback(feedback);

        if (rating != null && (rating < 1 || rating > 5)) {
            throw new BusinessException("Avaliação deve estar entre 1 e 5");
        }
        application.setRating(rating);

        return jobApplicationRepository.save(application);
    }

    public JobApplication addNotes(Long applicationId, String notes) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Candidatura não encontrada com ID: " + applicationId));

        application.setNotes(notes);
        return jobApplicationRepository.save(application);
    }

    public void withdraw(Long applicationId) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Candidatura não encontrada com ID: " + applicationId));

        // Verificar se a candidatura pode ser retirada
        if (application.getStatus() == JobApplication.ApplicationStatus.HIRED ||
            application.getStatus() == JobApplication.ApplicationStatus.REJECTED) {
            throw new BusinessException("Não é possível retirar uma candidatura já finalizada");
        }

        application.setStatus(JobApplication.ApplicationStatus.WITHDRAWN);
        jobApplicationRepository.save(application);
    }

    public void reject(Long applicationId, String reason) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Candidatura não encontrada com ID: " + applicationId));

        application.setStatus(JobApplication.ApplicationStatus.REJECTED);
        if (reason != null) {
            application.setFeedback(reason);
        }

        if (application.getReviewedAt() == null) {
            application.setReviewedAt(LocalDateTime.now());
        }

        jobApplicationRepository.save(application);
    }

    public void hire(Long applicationId) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Candidatura não encontrada com ID: " + applicationId));

        application.setStatus(JobApplication.ApplicationStatus.HIRED);
        application.setHiredAt(LocalDateTime.now());

        if (application.getReviewedAt() == null) {
            application.setReviewedAt(LocalDateTime.now());
        }

        // Marcar candidato como contratado
        Candidate candidate = application.getCandidate();
        candidate.setStatus(Candidate.CandidateStatus.HIRED);
        candidateRepository.save(candidate);

        JobApplication savedApplication = jobApplicationRepository.save(application);

        // Criar garantia automaticamente ao contratar
        try {
            warrantyService.createWarrantyOnHire(savedApplication);
        } catch (Exception e) {
            log.warn("Falha ao criar garantia para candidatura {}: {}", applicationId, e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public boolean hasApplied(Long candidateId, Long jobId) {
        return jobApplicationRepository.existsByCandidateIdAndJobId(candidateId, jobId);
    }

    @Transactional(readOnly = true)
    public long countByJobId(Long jobId) {
        return jobApplicationRepository.countByJobId(jobId);
    }

    @Transactional(readOnly = true)
    public long countByCandidateId(Long candidateId) {
        return jobApplicationRepository.countByCandidateId(candidateId);
    }

    @Transactional(readOnly = true)
    public long countByStatus(JobApplication.ApplicationStatus status) {
        return jobApplicationRepository.countByStatus(status);
    }

    @Transactional(readOnly = true)
    public List<JobApplication> getRecentApplications(JobApplication.ApplicationStatus status, int limit) {
        return jobApplicationRepository.findRecentApplicationsByStatus(status,
            org.springframework.data.domain.PageRequest.of(0, limit));
    }
}