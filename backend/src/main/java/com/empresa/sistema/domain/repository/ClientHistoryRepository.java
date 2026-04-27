package com.empresa.sistema.domain.repository;

import com.empresa.sistema.domain.entity.ClientHistory;
import com.empresa.sistema.domain.entity.JobHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClientHistoryRepository extends JpaRepository<ClientHistory, Long> {

    List<ClientHistory> findByClientIdOrderByCreatedAtDesc(Long clientId);

    List<ClientHistory> findByClientIdAndTypeOrderByCreatedAtDesc(Long clientId, JobHistory.HistoryType type);

    Page<ClientHistory> findByClientId(Long clientId, Pageable pageable);

    long countByClientId(Long clientId);

    boolean existsByClientId(Long clientId);
}
