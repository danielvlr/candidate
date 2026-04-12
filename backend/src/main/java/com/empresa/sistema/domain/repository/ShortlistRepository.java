package com.empresa.sistema.domain.repository;

import com.empresa.sistema.domain.entity.Shortlist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShortlistRepository extends JpaRepository<Shortlist, Long> {

    List<Shortlist> findByJobIdOrderBySentAtDesc(Long jobId);

    List<Shortlist> findByJobIdAndStatusOrderBySentAtDesc(Long jobId, Shortlist.ShortlistStatus status);

    Page<Shortlist> findByHeadhunterIdOrderBySentAtDesc(Long headhunterId, Pageable pageable);

    @Query("SELECT s FROM Shortlist s WHERE s.job.id = :jobId AND s.candidate.id = :candidateId")
    Optional<Shortlist> findByJobIdAndCandidateId(@Param("jobId") Long jobId, @Param("candidateId") Long candidateId);

    @Query("SELECT COUNT(s) FROM Shortlist s WHERE s.job.id = :jobId")
    long countByJobId(@Param("jobId") Long jobId);

    @Query("SELECT COUNT(s) FROM Shortlist s WHERE s.job.id = :jobId AND s.status = :status")
    long countByJobIdAndStatus(@Param("jobId") Long jobId, @Param("status") Shortlist.ShortlistStatus status);

    @Query("SELECT s FROM Shortlist s WHERE s.sentAt BETWEEN :startDate AND :endDate ORDER BY s.sentAt DESC")
    List<Shortlist> findBySentAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT s FROM Shortlist s WHERE s.job.headhunter.id = :headhunterId AND s.sentAt BETWEEN :startDate AND :endDate")
    List<Shortlist> findByHeadhunterIdAndSentAtBetween(@Param("headhunterId") Long headhunterId,
                                                      @Param("startDate") LocalDateTime startDate,
                                                      @Param("endDate") LocalDateTime endDate);

    boolean existsByJobIdAndCandidateId(Long jobId, Long candidateId);
}