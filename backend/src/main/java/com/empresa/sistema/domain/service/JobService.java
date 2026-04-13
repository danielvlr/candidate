package com.empresa.sistema.domain.service;

import com.empresa.sistema.api.dto.request.JobCreateRequest;
import com.empresa.sistema.api.dto.request.JobUpdateRequest;
import com.empresa.sistema.api.dto.response.JobResponse;
import com.empresa.sistema.api.dto.response.JobDetailResponse;
import com.empresa.sistema.api.mapper.JobMapper;
import com.empresa.sistema.domain.entity.Job;
import com.empresa.sistema.domain.entity.JobHistory;
import com.empresa.sistema.domain.entity.Client;
import com.empresa.sistema.domain.entity.Shortlist;
import com.empresa.sistema.domain.repository.JobRepository;
import com.empresa.sistema.domain.repository.JobHistoryRepository;
import com.empresa.sistema.domain.repository.ClientRepository;
import com.empresa.sistema.domain.service.exception.ResourceNotFoundException;
import com.empresa.sistema.domain.service.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final JobHistoryRepository jobHistoryRepository;
    private final ClientRepository clientRepository;
    private final JobMapper jobMapper;
    private final ShortlistService shortlistService;
    private final JobHistoryService jobHistoryService;

    @Transactional(readOnly = true)
    public Page<JobResponse> findAll(Pageable pageable) {
        Page<Job> jobs = jobRepository.findAllWithClientOrderByCreatedAtDesc(pageable);
        return jobs.map(jobMapper::toResponse);
    }

    public JobResponse findById(Long id) {
        Job job = jobRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada com ID: " + id));

        // Incrementar contador de visualizações
        jobRepository.incrementViewsCount(id);

        return jobMapper.toResponse(job);
    }

    public JobDetailResponse findDetailById(Long id) {
        Job job = jobRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada com ID: " + id));

        // Incrementar contador de visualizações
        jobRepository.incrementViewsCount(id);

        // Get the base job detail response
        JobDetailResponse jobDetail = jobMapper.toDetailResponse(job);

        // Add shortlists data
        jobDetail.setShortlists(shortlistService.findByJobId(id));

        // Add history data
        jobDetail.setHistory(jobHistoryService.findByJobId(id));

        // Calculate statistics
        jobDetail.setTotalApplications((long) job.getApplications().size());
        jobDetail.setTotalShortlists(shortlistService.countByJobId(id));
        jobDetail.setTotalHistory(jobHistoryService.countByJobId(id));

        // Shortlist status counts
        jobDetail.setShortlistsApproved(shortlistService.countByJobIdAndStatus(id, Shortlist.ShortlistStatus.APPROVED));
        jobDetail.setShortlistsRejected(shortlistService.countByJobIdAndStatus(id, Shortlist.ShortlistStatus.REJECTED));
        jobDetail.setShortlistsPending(shortlistService.countByJobIdAndStatus(id, Shortlist.ShortlistStatus.SENT) +
                                      shortlistService.countByJobIdAndStatus(id, Shortlist.ShortlistStatus.VIEWED) +
                                      shortlistService.countByJobIdAndStatus(id, Shortlist.ShortlistStatus.UNDER_REVIEW));

        return jobDetail;
    }

    @Transactional(readOnly = true)
    public Page<JobResponse> searchJobs(String search, Pageable pageable) {
        Page<Job> jobs = jobRepository.searchJobs(search, pageable);
        return jobs.map(jobMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<JobResponse> findWithFilters(String location, String companyName, Job.JobType jobType,
                                        Job.WorkMode workMode, Job.ExperienceLevel experienceLevel,
                                        Double minSalary, Double maxSalary, Long clientId, Pageable pageable) {
        Page<Job> jobs = jobRepository.findWithFilters(
            location, companyName, jobType, workMode, experienceLevel,
            minSalary, maxSalary, clientId, null, pageable);
        return jobs.map(jobMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<String> getAllLocations() {
        return jobRepository.findAllLocations();
    }

    @Transactional(readOnly = true)
    public List<String> getAllCompanies() {
        return jobRepository.findAllCompanies();
    }

    @Transactional(readOnly = true)
    public List<JobResponse> findByStatus(Job.JobStatus status) {
        List<Job> jobs = jobRepository.findByStatus(status);
        return jobMapper.toResponseList(jobs);
    }

    @Transactional(readOnly = true)
    public List<JobResponse> findFeaturedJobs() {
        List<Job> jobs = jobRepository.findByIsFeaturedTrueAndStatusOrderByCreatedAtDesc(Job.JobStatus.ACTIVE);
        return jobMapper.toResponseList(jobs);
    }

    @Transactional(readOnly = true)
    public List<JobResponse> findUrgentJobs() {
        List<Job> jobs = jobRepository.findByIsUrgentTrueAndStatusOrderByCreatedAtDesc(Job.JobStatus.ACTIVE);
        return jobMapper.toResponseList(jobs);
    }

    public JobResponse create(JobCreateRequest request) {
        // Verificar se o cliente existe
        Client client = clientRepository.findById(request.getClientId())
            .orElseThrow(() -> new BusinessException("Cliente não encontrado com ID: " + request.getClientId()));

        Job job = jobMapper.toEntity(request);

        // Definir cliente
        job.setClient(client);

        // Definir valores padrão
        if (job.getStatus() == null) {
            job.setStatus(Job.JobStatus.ACTIVE);
        }
        if (job.getJobType() == null) {
            job.setJobType(Job.JobType.FULL_TIME);
        }
        if (job.getWorkMode() == null) {
            job.setWorkMode(Job.WorkMode.ONSITE);
        }
        if (job.getExperienceLevel() == null) {
            job.setExperienceLevel(Job.ExperienceLevel.MID);
        }
        if (job.getIsUrgent() == null) {
            job.setIsUrgent(false);
        }
        if (job.getIsFeatured() == null) {
            job.setIsFeatured(false);
        }
        if (job.getViewsCount() == null) {
            job.setViewsCount(0);
        }
        if (job.getApplicationsCount() == null) {
            job.setApplicationsCount(0);
        }

        Job savedJob = jobRepository.save(job);
        recordHistory(savedJob, JobHistory.HistoryType.STATUS_CHANGED, "Vaga criada");
        return jobMapper.toResponse(savedJob);
    }

    public JobResponse update(Long id, JobUpdateRequest request) {
        Job existingJob = jobRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada com ID: " + id));

        // Se clientId foi fornecido, verificar se o cliente existe e atualizar
        if (request.getClientId() != null) {
            Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new BusinessException("Cliente não encontrado com ID: " + request.getClientId()));
            existingJob.setClient(client);
        }

        // Usar MapStruct para atualizar apenas campos não nulos
        jobMapper.updateEntityFromRequest(request, existingJob);

        Job updatedJob = jobRepository.save(existingJob);
        return jobMapper.toResponse(updatedJob);
    }

    public void delete(Long id) {
        Job job = jobRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada com ID: " + id));

        // Soft delete - marcar como fechada ao invés de excluir
        job.setStatus(Job.JobStatus.CLOSED);
        jobRepository.save(job);
    }

    public void pause(Long id) {
        Job job = jobRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada com ID: " + id));

        job.setStatus(Job.JobStatus.PAUSED);
        jobRepository.save(job);
        recordHistory(job, JobHistory.HistoryType.STATUS_CHANGED, "Vaga pausada");
    }

    public void activate(Long id) {
        Job job = jobRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada com ID: " + id));

        job.setStatus(Job.JobStatus.ACTIVE);
        jobRepository.save(job);
        recordHistory(job, JobHistory.HistoryType.STATUS_CHANGED, "Vaga ativada");
    }

    public void close(Long id) {
        Job job = jobRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada com ID: " + id));

        job.setStatus(Job.JobStatus.CLOSED);
        jobRepository.save(job);
        recordHistory(job, JobHistory.HistoryType.STATUS_CHANGED, "Vaga fechada");
    }

    public void markAsFeatured(Long id, boolean featured) {
        Job job = jobRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada com ID: " + id));

        job.setIsFeatured(featured);
        jobRepository.save(job);
    }

    public void markAsUrgent(Long id, boolean urgent) {
        Job job = jobRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada com ID: " + id));

        job.setIsUrgent(urgent);
        jobRepository.save(job);
    }

    @Transactional(readOnly = true)
    public long countByStatus(Job.JobStatus status) {
        return jobRepository.countByStatus(status);
    }

    public void checkAndExpireJobs() {
        List<Job> expiredJobs = jobRepository.findByApplicationDeadlineBefore(LocalDate.now());
        for (Job job : expiredJobs) {
            if (job.getStatus() == Job.JobStatus.ACTIVE) {
                job.setStatus(Job.JobStatus.EXPIRED);
                jobRepository.save(job);
            }
        }
    }

    @Transactional(readOnly = true)
    public Map<String, List<JobResponse>> getAllJobsKanbanByStatus() {
        List<Job> jobs = jobRepository.findAll();
        return jobs.stream()
            .collect(Collectors.groupingBy(
                j -> j.getStatus().name(),
                Collectors.mapping(jobMapper::toResponse, Collectors.toList())));
    }

    @Transactional(readOnly = true)
    public Map<String, List<JobResponse>> getAllJobsKanbanByPipeline() {
        List<Job> jobs = jobRepository.findAll();
        return jobs.stream()
            .collect(Collectors.groupingBy(
                j -> j.getPipelineStage() != null ? j.getPipelineStage().name() : "SOURCING",
                Collectors.mapping(jobMapper::toResponse, Collectors.toList())));
    }

    @Transactional(readOnly = true)
    public Map<String, List<JobResponse>> getJobsKanbanByStatus(Long headhunterId, LocalDate createdAfter,
            LocalDate deadlineBefore, Integer warrantyExpiringIn) {
        List<Job> jobs = jobRepository.findByHeadhunterId(headhunterId);

        if (createdAfter != null) {
            jobs = jobs.stream()
                .filter(j -> j.getCreatedAt() != null && !j.getCreatedAt().toLocalDate().isBefore(createdAfter))
                .collect(Collectors.toList());
        }
        if (deadlineBefore != null) {
            jobs = jobs.stream()
                .filter(j -> j.getApplicationDeadline() != null && !j.getApplicationDeadline().isAfter(deadlineBefore))
                .collect(Collectors.toList());
        }

        return jobs.stream()
            .collect(Collectors.groupingBy(
                j -> j.getStatus().name(),
                Collectors.mapping(jobMapper::toResponse, Collectors.toList())));
    }

    @Transactional(readOnly = true)
    public Map<String, List<JobResponse>> getJobsKanbanByPipeline(Long headhunterId, LocalDate createdAfter,
            LocalDate deadlineBefore, Integer warrantyExpiringIn) {
        List<Job> jobs = jobRepository.findByHeadhunterId(headhunterId);

        if (createdAfter != null) {
            jobs = jobs.stream()
                .filter(j -> j.getCreatedAt() != null && !j.getCreatedAt().toLocalDate().isBefore(createdAfter))
                .collect(Collectors.toList());
        }
        if (deadlineBefore != null) {
            jobs = jobs.stream()
                .filter(j -> j.getApplicationDeadline() != null && !j.getApplicationDeadline().isAfter(deadlineBefore))
                .collect(Collectors.toList());
        }

        return jobs.stream()
            .collect(Collectors.groupingBy(
                j -> j.getPipelineStage() != null ? j.getPipelineStage().name() : "SOURCING",
                Collectors.mapping(jobMapper::toResponse, Collectors.toList())));
    }

    public Job updatePipelineStage(Long jobId, Job.PipelineStage newStage) {
        Job job = jobRepository.findById(jobId)
            .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada com ID: " + jobId));
        String oldStage = job.getPipelineStage() != null ? job.getPipelineStage().name() : "N/A";
        job.setPipelineStage(newStage);
        Job saved = jobRepository.save(job);
        recordHistory(saved, JobHistory.HistoryType.STATUS_CHANGED, "Pipeline atualizado de " + oldStage + " para " + newStage.name());
        return saved;
    }

    public Job updateJobStatus(Long jobId, Job.JobStatus newStatus) {
        Job job = jobRepository.findById(jobId)
            .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada com ID: " + jobId));
        String oldStatus = job.getStatus() != null ? job.getStatus().name() : "N/A";
        JobStatusTransition.validate(job.getStatus(), newStatus);
        job.setStatus(newStatus);
        Job saved = jobRepository.save(job);
        recordHistory(saved, JobHistory.HistoryType.STATUS_CHANGED, "Status alterado de " + oldStatus + " para " + newStatus.name());
        return saved;
    }

    private void recordHistory(Job job, JobHistory.HistoryType type, String description) {
        JobHistory history = JobHistory.builder()
            .job(job)
            .type(type)
            .title(description)
            .description(description)
            .headhunter(job.getHeadhunter())
            .build();
        jobHistoryRepository.save(history);
    }
}