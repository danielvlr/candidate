package com.empresa.sistema.domain.repository;

import com.empresa.sistema.domain.entity.HeadhunterHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface HeadhunterHistoryRepository extends JpaRepository<HeadhunterHistory, Long> {

    List<HeadhunterHistory> findByHeadhunterIdOrderByCreatedAtDesc(Long headhunterId);

    Page<HeadhunterHistory> findByHeadhunterIdOrderByCreatedAtDesc(Long headhunterId, Pageable pageable);

    List<HeadhunterHistory> findByActionType(HeadhunterHistory.ActionType actionType);

    @Query("SELECT h FROM HeadhunterHistory h WHERE " +
           "h.headhunter.id = :headhunterId AND " +
           "h.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY h.createdAt DESC")
    List<HeadhunterHistory> findByHeadhunterAndDateRange(
            @Param("headhunterId") Long headhunterId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT h FROM HeadhunterHistory h WHERE " +
           "h.headhunter.id = :headhunterId AND " +
           "h.actionType = :actionType " +
           "ORDER BY h.createdAt DESC")
    List<HeadhunterHistory> findByHeadhunterAndActionType(
            @Param("headhunterId") Long headhunterId,
            @Param("actionType") HeadhunterHistory.ActionType actionType
    );

    @Query("SELECT h FROM HeadhunterHistory h WHERE " +
           "h.changedBy = :changedBy " +
           "ORDER BY h.createdAt DESC")
    List<HeadhunterHistory> findByChangedBy(@Param("changedBy") String changedBy);

    @Query("SELECT COUNT(h) FROM HeadhunterHistory h WHERE " +
           "h.headhunter.id = :headhunterId AND " +
           "h.actionType = :actionType")
    Long countByHeadhunterAndActionType(
            @Param("headhunterId") Long headhunterId,
            @Param("actionType") HeadhunterHistory.ActionType actionType
    );
}