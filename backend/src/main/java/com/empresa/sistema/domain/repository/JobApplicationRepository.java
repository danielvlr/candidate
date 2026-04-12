package com.empresa.sistema.domain.repository;

import com.empresa.sistema.domain.entity.JobApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    List<JobApplication> findByCandidateId(Long candidateId);

    List<JobApplication> findByJobId(Long jobId);

    Page<JobApplication> findByJobIdOrderByAppliedAtDesc(Long jobId, Pageable pageable);

    Page<JobApplication> findByCandidateIdOrderByAppliedAtDesc(Long candidateId, Pageable pageable);

    Optional<JobApplication> findByCandidateIdAndJobId(Long candidateId, Long jobId);

    boolean existsByCandidateIdAndJobId(Long candidateId, Long jobId);

    List<JobApplication> findByStatus(JobApplication.ApplicationStatus status);

    @Query("SELECT ja FROM JobApplication ja WHERE " +
           "ja.job.id = :jobId AND ja.status = :status")
    List<JobApplication> findByJobIdAndStatus(@Param("jobId") Long jobId,
                                              @Param("status") JobApplication.ApplicationStatus status);

    @Query("SELECT ja FROM JobApplication ja WHERE " +
           "ja.candidate.id = :candidateId AND ja.status = :status")
    List<JobApplication> findByCandidateIdAndStatus(@Param("candidateId") Long candidateId,
                                                     @Param("status") JobApplication.ApplicationStatus status);

    @Query("SELECT COUNT(ja) FROM JobApplication ja WHERE ja.job.id = :jobId")
    long countByJobId(@Param("jobId") Long jobId);

    @Query("SELECT COUNT(ja) FROM JobApplication ja WHERE ja.candidate.id = :candidateId")
    long countByCandidateId(@Param("candidateId") Long candidateId);

    @Query("SELECT COUNT(ja) FROM JobApplication ja WHERE ja.status = :status")
    long countByStatus(@Param("status") JobApplication.ApplicationStatus status);

    @Query("SELECT ja FROM JobApplication ja " +
           "JOIN FETCH ja.candidate " +
           "JOIN FETCH ja.job " +
           "WHERE ja.status = :status " +
           "ORDER BY ja.appliedAt DESC")
    List<JobApplication> findRecentApplicationsByStatus(@Param("status") JobApplication.ApplicationStatus status,
                                                         Pageable pageable);
}