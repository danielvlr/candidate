package com.empresa.sistema.domain.repository;

import com.empresa.sistema.domain.entity.Candidate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Long> {

    Optional<Candidate> findByEmail(String email);

    Optional<Candidate> findByEmailIgnoreCase(String email);

    List<Candidate> findByStatus(Candidate.CandidateStatus status);

    @Query("SELECT c FROM Candidate c WHERE " +
           "LOWER(c.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.headline) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.skills) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Candidate> searchCandidates(@Param("search") String search, Pageable pageable);

    @Query("SELECT c FROM Candidate c WHERE " +
           "(:headline IS NULL OR LOWER(c.headline) LIKE LOWER(CONCAT('%', :headline, '%'))) AND " +
           "(:city IS NULL OR LOWER(c.city) = LOWER(:city)) AND " +
           "(:minSalary IS NULL OR c.desiredSalary >= :minSalary) AND " +
           "(:maxSalary IS NULL OR c.desiredSalary <= :maxSalary) AND " +
           "(:workPreference IS NULL OR c.workPreference = :workPreference) AND " +
           "c.status = :status")
    Page<Candidate> findWithFilters(
        @Param("headline") String headline,
        @Param("city") String city,
        @Param("minSalary") Double minSalary,
        @Param("maxSalary") Double maxSalary,
        @Param("workPreference") Candidate.WorkPreference workPreference,
        @Param("status") Candidate.CandidateStatus status,
        Pageable pageable
    );

    @Query("SELECT DISTINCT c.city FROM Candidate c WHERE c.city IS NOT NULL ORDER BY c.city")
    List<String> findAllCities();

    @Query("SELECT DISTINCT c.headline FROM Candidate c WHERE c.headline IS NOT NULL ORDER BY c.headline")
    List<String> findAllHeadlines();

    @Query("SELECT COUNT(c) FROM Candidate c WHERE c.status = :status")
    long countByStatus(@Param("status") Candidate.CandidateStatus status);

    boolean existsByEmail(String email);

    Optional<Candidate> findByJestorId(String jestorId);

    @Modifying
    @Query("UPDATE Candidate c SET c.status = com.empresa.sistema.domain.entity.Candidate.CandidateStatus.ACTIVE, " +
           "c.approvedByHeadhunterId = :hhId, c.approvedAt = :now " +
           "WHERE c.id = :id AND c.status = com.empresa.sistema.domain.entity.Candidate.CandidateStatus.PENDING_APPROVAL")
    int approveIfPending(@Param("id") Long id,
                         @Param("hhId") Long hhId,
                         @Param("now") LocalDateTime now);
}