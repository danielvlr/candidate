package com.empresa.sistema.domain.repository;

import com.empresa.sistema.domain.entity.AssessoradoHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessoradoHistoryRepository extends JpaRepository<AssessoradoHistory, Long> {

    List<AssessoradoHistory> findByAssessoradoIdOrderByCreatedAtDesc(Long assessoradoId);

    Page<AssessoradoHistory> findByAssessoradoIdOrderByCreatedAtDesc(Long assessoradoId, Pageable pageable);
}
