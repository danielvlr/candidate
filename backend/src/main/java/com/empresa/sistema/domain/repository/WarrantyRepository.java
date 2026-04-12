package com.empresa.sistema.domain.repository;

import com.empresa.sistema.domain.entity.Job;
import com.empresa.sistema.domain.entity.Warranty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WarrantyRepository extends JpaRepository<Warranty, Long> {

    List<Warranty> findByStatus(Warranty.WarrantyStatus status);

    Page<Warranty> findByStatusOrderByEndDateAsc(Warranty.WarrantyStatus status, Pageable pageable);

    List<Warranty> findByJobId(Long jobId);

    List<Warranty> findByHeadhunterId(Long headhunterId);

    Optional<Warranty> findByJobApplicationId(Long jobApplicationId);

    @Query("SELECT w FROM Warranty w WHERE w.endDate <= :targetDate AND w.notificationSentAt IS NULL AND w.status = 'ACTIVE'")
    List<Warranty> findExpiringWarrantiesNotNotified(@Param("targetDate") LocalDate targetDate);

    @Query("SELECT w FROM Warranty w WHERE w.endDate < :today AND w.status IN ('ACTIVE', 'EXPIRING_SOON')")
    List<Warranty> findExpiredWarranties(@Param("today") LocalDate today);

    @Query("SELECT w FROM Warranty w WHERE w.headhunter.id = :headhunterId AND w.status IN :statuses")
    List<Warranty> findByHeadhunterIdAndStatusIn(@Param("headhunterId") Long headhunterId, @Param("statuses") List<Warranty.WarrantyStatus> statuses);

    @Query("SELECT COUNT(w) FROM Warranty w WHERE w.status = :status")
    long countByStatus(@Param("status") Warranty.WarrantyStatus status);

    @Query("SELECT w FROM Warranty w WHERE w.endDate <= :targetDate AND w.status IN ('ACTIVE', 'EXPIRING_SOON')")
    List<Warranty> findByEndDateLessThanEqual(@Param("targetDate") LocalDate targetDate);

    boolean existsByJobApplicationId(Long jobApplicationId);
}
