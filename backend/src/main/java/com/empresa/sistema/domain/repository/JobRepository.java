package com.empresa.sistema.domain.repository;

import com.empresa.sistema.domain.entity.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    List<Job> findByStatus(Job.JobStatus status);

    @Query("SELECT j FROM Job j LEFT JOIN FETCH j.client WHERE j.status = :status ORDER BY j.createdAt DESC")
    Page<Job> findByStatusOrderByCreatedAtDesc(@Param("status") Job.JobStatus status, Pageable pageable);

    @Query("SELECT j FROM Job j LEFT JOIN FETCH j.client ORDER BY j.createdAt DESC")
    Page<Job> findAllWithClientOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT j FROM Job j WHERE " +
           "LOWER(j.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(j.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(j.companyName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(j.skillsRequired) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Job> searchJobs(@Param("search") String search, Pageable pageable);

    @Query("SELECT j FROM Job j WHERE " +
           "(:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
           "(:companyName IS NULL OR LOWER(j.companyName) LIKE LOWER(CONCAT('%', :companyName, '%'))) AND " +
           "(:jobType IS NULL OR j.jobType = :jobType) AND " +
           "(:workMode IS NULL OR j.workMode = :workMode) AND " +
           "(:experienceLevel IS NULL OR j.experienceLevel = :experienceLevel) AND " +
           "(:minSalary IS NULL OR j.salaryMin >= :minSalary) AND " +
           "(:maxSalary IS NULL OR j.salaryMax <= :maxSalary) AND " +
           "(:clientId IS NULL OR j.client.id = :clientId) AND " +
           "(:status IS NULL OR j.status = :status)")
    Page<Job> findWithFilters(
        @Param("location") String location,
        @Param("companyName") String companyName,
        @Param("jobType") Job.JobType jobType,
        @Param("workMode") Job.WorkMode workMode,
        @Param("experienceLevel") Job.ExperienceLevel experienceLevel,
        @Param("minSalary") Double minSalary,
        @Param("maxSalary") Double maxSalary,
        @Param("clientId") Long clientId,
        @Param("status") Job.JobStatus status,
        Pageable pageable
    );

    @Query("SELECT DISTINCT j.location FROM Job j WHERE j.location IS NOT NULL ORDER BY j.location")
    List<String> findAllLocations();

    @Query("SELECT DISTINCT j.companyName FROM Job j WHERE j.companyName IS NOT NULL ORDER BY j.companyName")
    List<String> findAllCompanies();

    List<Job> findByIsFeaturedTrueAndStatusOrderByCreatedAtDesc(Job.JobStatus status);

    List<Job> findByIsUrgentTrueAndStatusOrderByCreatedAtDesc(Job.JobStatus status);

    List<Job> findByApplicationDeadlineBefore(LocalDate date);

    @Query("SELECT COUNT(j) FROM Job j WHERE j.status = :status")
    long countByStatus(@Param("status") Job.JobStatus status);

    @Modifying
    @Query("UPDATE Job j SET j.viewsCount = j.viewsCount + 1 WHERE j.id = :jobId")
    void incrementViewsCount(@Param("jobId") Long jobId);

    @Modifying
    @Query("UPDATE Job j SET j.applicationsCount = j.applicationsCount + 1 WHERE j.id = :jobId")
    void incrementApplicationsCount(@Param("jobId") Long jobId);

    // Dashboard queries for headhunter
    @Query("SELECT COUNT(j) FROM Job j WHERE j.headhunter.id = :headhunterId")
    Long countJobsByHeadhunter(@Param("headhunterId") Long headhunterId);

    @Query("SELECT SUM(j.applicationsCount) FROM Job j WHERE j.headhunter.id = :headhunterId AND j.status IN ('ACTIVE', 'PAUSED')")
    Long countActiveCandidatesByHeadhunter(@Param("headhunterId") Long headhunterId);

    @Query("SELECT j FROM Job j WHERE j.headhunter.id = :headhunterId AND j.status IN ('ACTIVE', 'PAUSED') ORDER BY j.createdAt DESC")
    List<Job> findOpenJobsByHeadhunter(@Param("headhunterId") Long headhunterId);

    @Query("SELECT j FROM Job j WHERE j.headhunter.id = :headhunterId AND j.status = 'CLOSED' AND j.closedAt >= :threeMonthsAgo ORDER BY j.closedAt DESC")
    List<Job> findRecentlyClosedJobsByHeadhunter(@Param("headhunterId") Long headhunterId, @Param("threeMonthsAgo") java.time.LocalDateTime threeMonthsAgo);

    List<Job> findByHeadhunterId(Long headhunterId);

    List<Job> findByClient_Id(Long clientId);

    Optional<Job> findByJestorId(String jestorId);

    List<Job> findByPipelineStage(Job.PipelineStage pipelineStage);
}