package com.empresa.sistema.domain.repository;

import com.empresa.sistema.domain.entity.SyncLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SyncLogRepository extends JpaRepository<SyncLog, Long> {

    Optional<SyncLog> findTopByOrderByCompletedAtDesc();

    Page<SyncLog> findAllByOrderByCompletedAtDesc(Pageable pageable);

    Page<SyncLog> findByEntityOrderByCompletedAtDesc(String entity, Pageable pageable);
}
