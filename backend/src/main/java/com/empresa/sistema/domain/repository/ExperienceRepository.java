package com.empresa.sistema.domain.repository;

import com.empresa.sistema.domain.entity.Experience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExperienceRepository extends JpaRepository<Experience, Long> {

    List<Experience> findByCandidateIdOrderByStartDateDesc(Long candidateId);

    @Query("SELECT e FROM Experience e WHERE e.candidate.id = :candidateId AND e.isCurrent = true")
    List<Experience> findCurrentExperiencesByCandidate(@Param("candidateId") Long candidateId);

    long countByCandidateId(Long candidateId);
}