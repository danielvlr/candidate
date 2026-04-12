package com.empresa.sistema.domain.repository;

import com.empresa.sistema.domain.entity.Headhunter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HeadhunterRepository extends JpaRepository<Headhunter, Long> {

    Optional<Headhunter> findByEmail(String email);

    List<Headhunter> findByStatus(Headhunter.HeadhunterStatus status);

    List<Headhunter> findBySeniority(Headhunter.Seniority seniority);

    @Query("SELECT h FROM Headhunter h WHERE " +
           "(:name IS NULL OR LOWER(h.fullName) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:email IS NULL OR LOWER(h.email) LIKE LOWER(CONCAT('%', :email, '%'))) AND " +
           "(:seniority IS NULL OR h.seniority = :seniority) AND " +
           "(:status IS NULL OR h.status = :status)")
    Page<Headhunter> findWithFilters(
            @Param("name") String name,
            @Param("email") String email,
            @Param("seniority") Headhunter.Seniority seniority,
            @Param("status") Headhunter.HeadhunterStatus status,
            Pageable pageable
    );

    @Query("SELECT h FROM Headhunter h WHERE " +
           "LOWER(h.responsibleAreas) LIKE LOWER(CONCAT('%', :area, '%'))")
    List<Headhunter> findByResponsibleArea(@Param("area") String area);

    @Query("SELECT COUNT(h) FROM Headhunter h WHERE h.status = :status")
    Long countByStatus(@Param("status") Headhunter.HeadhunterStatus status);

    @Query("SELECT COUNT(h) FROM Headhunter h WHERE h.seniority = :seniority")
    Long countBySeniority(@Param("seniority") Headhunter.Seniority seniority);

    boolean existsByEmail(String email);

    Optional<Headhunter> findByJestorId(String jestorId);
}