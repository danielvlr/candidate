package com.empresa.sistema.domain.repository;

import com.empresa.sistema.domain.entity.Assessorado;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessoradoRepository extends JpaRepository<Assessorado, Long> {

    Page<Assessorado> findBySeniorIdOrderByCreatedAtDesc(Long seniorId, Pageable pageable);

    List<Assessorado> findBySeniorId(Long seniorId);

    List<Assessorado> findByStatus(Assessorado.AssessoradoStatus status);

    List<Assessorado> findByCandidateId(Long candidateId);

    Page<Assessorado> findBySeniorIdAndStatus(Long seniorId, Assessorado.AssessoradoStatus status, Pageable pageable);

    boolean existsByCandidateIdAndSeniorIdAndStatusIn(Long candidateId, Long seniorId,
                                                       List<Assessorado.AssessoradoStatus> statuses);

    long countBySeniorId(Long seniorId);

    long countBySeniorIdAndStatus(Long seniorId, Assessorado.AssessoradoStatus status);

    @Query("SELECT a FROM Assessorado a WHERE " +
           "(:name IS NULL OR LOWER(a.candidate.fullName) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:phase IS NULL OR a.currentPhase = :phase) AND " +
           "(:seniorId IS NULL OR a.senior.id = :seniorId)")
    Page<Assessorado> findWithFilters(
            @Param("name") String name,
            @Param("status") Assessorado.AssessoradoStatus status,
            @Param("phase") Assessorado.AssessoradoPhase phase,
            @Param("seniorId") Long seniorId,
            Pageable pageable
    );
}
