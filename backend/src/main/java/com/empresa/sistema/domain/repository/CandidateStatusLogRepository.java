package com.empresa.sistema.domain.repository;

import com.empresa.sistema.domain.entity.Candidate;
import com.empresa.sistema.domain.entity.CandidateStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateStatusLogRepository extends JpaRepository<CandidateStatusLog, Long> {

    Optional<CandidateStatusLog> findByJestorId(String jestorId);

    List<CandidateStatusLog> findByCandidateOrderByCreatedAtDesc(Candidate candidate);

    List<CandidateStatusLog> findByCandidateIdOrderByCreatedAtDesc(Long candidateId);
}
