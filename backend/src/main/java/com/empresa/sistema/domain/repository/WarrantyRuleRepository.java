package com.empresa.sistema.domain.repository;

import com.empresa.sistema.domain.entity.Job;
import com.empresa.sistema.domain.entity.WarrantyRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarrantyRuleRepository extends JpaRepository<WarrantyRule, Long> {

    Optional<WarrantyRule> findByServiceCategory(Job.ServiceCategory serviceCategory);

    List<WarrantyRule> findByActiveTrue();

    boolean existsByServiceCategory(Job.ServiceCategory serviceCategory);
}
