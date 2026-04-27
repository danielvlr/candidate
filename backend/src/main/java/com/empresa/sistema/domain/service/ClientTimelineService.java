package com.empresa.sistema.domain.service;

import com.empresa.sistema.api.dto.TimelineEntryDTO;
import com.empresa.sistema.domain.entity.Candidate;
import com.empresa.sistema.domain.entity.Client;
import com.empresa.sistema.domain.entity.ClientHistory;
import com.empresa.sistema.domain.entity.Headhunter;
import com.empresa.sistema.domain.entity.Job;
import com.empresa.sistema.domain.entity.JobHistory;
import com.empresa.sistema.domain.repository.ClientHistoryRepository;
import com.empresa.sistema.domain.repository.ClientRepository;
import com.empresa.sistema.domain.repository.JobHistoryRepository;
import com.empresa.sistema.domain.repository.JobRepository;
import com.empresa.sistema.domain.service.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ClientTimelineService {

    private final ClientHistoryRepository clientHistoryRepository;
    private final JobRepository jobRepository;
    private final JobHistoryRepository jobHistoryRepository;
    private final ClientRepository clientRepository;

    /**
     * Aggregates ClientHistory ("EMPRESA") + JobHistory ("VAGA") into a unified
     * timeline for the given client, sorted by createdAt DESC.
     *
     * @param clientId      target client (validated; throws if not found)
     * @param pageable      paging info; sort param is ignored here (always createdAt DESC)
     * @param jobIdFilter   if non-null, restricts VAGA entries to a single job
     * @param empresaOnly   TRUE = EMPRESA only, FALSE = VAGA only, null = both
     */
    public Page<TimelineEntryDTO> getTimeline(Long clientId,
                                              Pageable pageable,
                                              Long jobIdFilter,
                                              Boolean empresaOnly) {
        Client client = clientRepository.findById(clientId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Cliente não encontrado com ID: " + clientId));

        boolean includeEmpresa = empresaOnly == null || Boolean.TRUE.equals(empresaOnly);
        boolean includeVaga = empresaOnly == null || Boolean.FALSE.equals(empresaOnly);

        // jobIdFilter implies VAGA-only semantics regardless of empresaOnly=true
        // (specific job filter is meaningless for EMPRESA rows). If caller sets
        // both jobIdFilter and empresaOnly=true, prefer VAGA filter intent.
        if (jobIdFilter != null) {
            includeEmpresa = false;
            includeVaga = true;
        }

        List<TimelineEntryDTO> all = new ArrayList<>();

        if (includeEmpresa) {
            List<ClientHistory> empresaRows =
                clientHistoryRepository.findByClientIdOrderByCreatedAtDesc(clientId);
            for (ClientHistory ch : empresaRows) {
                all.add(toEmpresaEntry(ch, client));
            }
        }

        if (includeVaga) {
            if (jobIdFilter != null) {
                // Single-job filter path: scope to that job only.
                Job job = jobRepository.findById(jobIdFilter).orElse(null);
                if (job != null && job.getClient() != null
                        && clientId.equals(job.getClient().getId())) {
                    List<JobHistory> rows =
                        jobHistoryRepository.findByJobIdOrderByCreatedAtDesc(jobIdFilter);
                    for (JobHistory jh : rows) {
                        all.add(toVagaEntry(jh, job));
                    }
                }
                // If jobIdFilter doesn't belong to clientId we silently skip.
            } else {
                // All VAGA rows for the client in one query (N+1-free).
                List<JobHistory> rows =
                    jobHistoryRepository.findByJob_Client_IdOrderByCreatedAtDesc(clientId);
                for (JobHistory jh : rows) {
                    all.add(toVagaEntry(jh, jh.getJob()));
                }
            }
        }

        // Defensive sort: nulls go last so a missing createdAt doesn't poison ordering.
        all.sort(Comparator.comparing(TimelineEntryDTO::getCreatedAt,
            Comparator.nullsLast(Comparator.reverseOrder())));

        // Manual pagination across the union (acceptable while volume is small;
        // TODO: switch to native UNION query when load grows).
        int total = all.size();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), total);
        List<TimelineEntryDTO> pageContent = start >= total
            ? Collections.emptyList()
            : all.subList(start, end);

        return new PageImpl<>(pageContent, pageable, total);
    }

    private TimelineEntryDTO toEmpresaEntry(ClientHistory ch, Client client) {
        Headhunter hh = ch.getHeadhunter();
        return TimelineEntryDTO.builder()
            .id(ch.getId())
            .origin("EMPRESA")
            .jobId(null)
            .jobTitle(null)
            .clientId(client.getId())
            .clientName(client.getCompanyName())
            .headhunterId(hh != null ? hh.getId() : null)
            .headhunterName(hh != null ? hh.getFullName() : null)
            .candidateId(null)
            .candidateName(null)
            .type(ch.getType() != null ? ch.getType().name() : null)
            .title(ch.getTitle())
            .description(ch.getDescription())
            .createdAt(ch.getCreatedAt())
            .scheduledDate(ch.getScheduledDate())
            .completedAt(ch.getCompletedAt())
            .status(ch.getStatus())
            .metadata(ch.getMetadata())
            .build();
    }

    private TimelineEntryDTO toVagaEntry(JobHistory jh, Job job) {
        Headhunter hh = jh.getHeadhunter();
        Candidate cand = jh.getCandidate();
        Client jobClient = job != null ? job.getClient() : null;

        Long resolvedClientId = jobClient != null ? jobClient.getId() : null;
        String resolvedClientName = jobClient != null ? jobClient.getCompanyName() : null;

        JobHistory.HistoryStatus status = jh.getStatus();
        LocalDateTime createdAt = jh.getCreatedAt();

        return TimelineEntryDTO.builder()
            .id(jh.getId())
            .origin("VAGA")
            .jobId(job != null ? job.getId() : null)
            .jobTitle(job != null ? job.getTitle() : null)
            .clientId(resolvedClientId)
            .clientName(resolvedClientName)
            .headhunterId(hh != null ? hh.getId() : null)
            .headhunterName(hh != null ? hh.getFullName() : null)
            .candidateId(cand != null ? cand.getId() : null)
            .candidateName(cand != null ? cand.getFullName() : null)
            .type(jh.getType() != null ? jh.getType().name() : null)
            .title(jh.getTitle())
            .description(jh.getDescription())
            .createdAt(createdAt)
            .scheduledDate(jh.getScheduledDate())
            .completedAt(jh.getCompletedAt())
            .status(status != null ? status.name() : null)
            .metadata(jh.getMetadata())
            .build();
    }
}
