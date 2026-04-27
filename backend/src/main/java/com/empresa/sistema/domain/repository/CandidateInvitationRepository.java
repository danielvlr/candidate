package com.empresa.sistema.domain.repository;

import com.empresa.sistema.domain.entity.CandidateInvitation;
import com.empresa.sistema.domain.entity.CandidateInvitation.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateInvitationRepository extends JpaRepository<CandidateInvitation, Long> {

    Optional<CandidateInvitation> findByTokenHash(String tokenHash);

    List<CandidateInvitation> findByCandidateIdAndStatusIn(Long candidateId, Collection<InvitationStatus> statuses);

    List<CandidateInvitation> findByStatusAndExpiresAtBefore(InvitationStatus status, LocalDateTime now);
}
