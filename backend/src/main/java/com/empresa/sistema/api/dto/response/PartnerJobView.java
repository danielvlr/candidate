package com.empresa.sistema.api.dto.response;

import java.util.List;

/** Visão somente leitura da vaga para o CPARTNER: sem valores, contatos, garantia nem dados de pipeline. */
public final class PartnerJobView {

    private PartnerJobView() {
    }

    public static JobResponse of(JobResponse job) {
        return job.toBuilder()
                .approvedCandidateId(null).approvedCandidateName(null)
                .headhunterId(null).headhunterName(null)
                .client(redact(job.getClient()))
                .serviceCategory(null).pipelineStage(null)
                .contactEmail(null)
                .viewsCount(null).applicationsCount(null)
                .jobValue(null).finalValue(null).guaranteeDays(null)
                .closedAt(null).lastDeliveryAt(null).firstDeliveryAt(null).frozenAt(null)
                .commissionType(null).contactMade(null).closedOnFirstSend(null).initialCheckin(null)
                .build();
    }

    public static List<JobResponse> of(List<JobResponse> jobs) {
        return jobs.stream().map(PartnerJobView::of).toList();
    }

    public static JobDetailResponse of(JobDetailResponse detail) {
        return detail.toBuilder()
                .client(null).headhunter(null)
                .serviceCategory(null).pipelineStage(null)
                .contactEmail(null)
                .viewsCount(null).applicationsCount(null)
                .jobValue(null).guaranteeDays(null)
                .closedAt(null).lastDeliveryAt(null)
                .approvedCandidateId(null).approvedCandidateName(null)
                .applications(List.of()).shortlists(List.of()).history(List.of())
                .totalApplications(0L).totalShortlists(0L).totalHistory(0L)
                .shortlistsApproved(0L).shortlistsRejected(0L).shortlistsPending(0L)
                .build();
    }

    private static ClientSummaryResponse redact(ClientSummaryResponse client) {
        return client == null ? null : client.toBuilder().contactEmail(null).contactPhone(null).build();
    }
}
