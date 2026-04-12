package com.empresa.sistema.domain.repository;

import com.empresa.sistema.domain.entity.JobHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface JobHistoryRepository extends JpaRepository<JobHistory, Long> {

    List<JobHistory> findByJobIdOrderByCreatedAtDesc(Long jobId);

    Page<JobHistory> findByJobIdOrderByCreatedAtDesc(Long jobId, Pageable pageable);

    List<JobHistory> findByJobIdAndTypeOrderByCreatedAtDesc(Long jobId, JobHistory.HistoryType type);

    List<JobHistory> findByJobIdAndCandidateIdOrderByCreatedAtDesc(Long jobId, Long candidateId);

    List<JobHistory> findByHeadhunterIdOrderByCreatedAtDesc(Long headhunterId);

    @Query("SELECT jh FROM JobHistory jh WHERE jh.job.id = :jobId AND jh.createdAt BETWEEN :startDate AND :endDate ORDER BY jh.createdAt DESC")
    List<JobHistory> findByJobIdAndCreatedAtBetween(@Param("jobId") Long jobId,
                                                   @Param("startDate") LocalDateTime startDate,
                                                   @Param("endDate") LocalDateTime endDate);

    @Query("SELECT jh FROM JobHistory jh WHERE jh.job.headhunter.id = :headhunterId AND jh.createdAt BETWEEN :startDate AND :endDate ORDER BY jh.createdAt DESC")
    List<JobHistory> findByHeadhunterIdAndCreatedAtBetween(@Param("headhunterId") Long headhunterId,
                                                          @Param("startDate") LocalDateTime startDate,
                                                          @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(jh) FROM JobHistory jh WHERE jh.job.id = :jobId")
    long countByJobId(@Param("jobId") Long jobId);

    @Query("SELECT COUNT(jh) FROM JobHistory jh WHERE jh.job.id = :jobId AND jh.type = :type")
    long countByJobIdAndType(@Param("jobId") Long jobId, @Param("type") JobHistory.HistoryType type);

    List<JobHistory> findByStatusAndScheduledDateBeforeOrderByScheduledDateAsc(JobHistory.HistoryStatus status, LocalDateTime date);
}