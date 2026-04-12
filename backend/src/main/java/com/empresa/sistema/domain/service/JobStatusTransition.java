package com.empresa.sistema.domain.service;

import com.empresa.sistema.domain.entity.Job;
import com.empresa.sistema.domain.service.exception.BusinessException;

import java.util.Map;
import java.util.Set;

public final class JobStatusTransition {

    private static final Map<Job.JobStatus, Set<Job.JobStatus>> ALLOWED = Map.of(
        Job.JobStatus.DRAFT,   Set.of(Job.JobStatus.ACTIVE),
        Job.JobStatus.ACTIVE,  Set.of(Job.JobStatus.PAUSED, Job.JobStatus.CLOSED),
        Job.JobStatus.PAUSED,  Set.of(Job.JobStatus.ACTIVE, Job.JobStatus.CLOSED),
        Job.JobStatus.CLOSED,  Set.of(),
        Job.JobStatus.EXPIRED, Set.of()
    );

    private JobStatusTransition() {}

    public static void validate(Job.JobStatus current, Job.JobStatus target) {
        Set<Job.JobStatus> allowed = ALLOWED.getOrDefault(current, Set.of());
        if (!allowed.contains(target)) {
            throw new BusinessException(
                String.format("Transição de status não permitida: %s -> %s. Permitidos: %s",
                    current, target, allowed));
        }
    }
}
