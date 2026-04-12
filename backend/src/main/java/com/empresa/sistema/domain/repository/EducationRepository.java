package com.empresa.sistema.domain.repository;

import com.empresa.sistema.domain.entity.Education;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EducationRepository extends JpaRepository<Education, Long> {

    List<Education> findByCandidateIdOrderByEndDateDesc(Long candidateId);

    @Query("SELECT e FROM Education e WHERE e.candidate.id = :candidateId AND e.institution LIKE %:institution%")
    List<Education> findByCandidateAndInstitution(@Param("candidateId") Long candidateId, @Param("institution") String institution);

    long countByCandidateId(Long candidateId);
}