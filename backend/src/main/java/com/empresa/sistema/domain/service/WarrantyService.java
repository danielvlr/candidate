package com.empresa.sistema.domain.service;

import com.empresa.sistema.domain.entity.*;
import com.empresa.sistema.domain.repository.WarrantyRepository;
import com.empresa.sistema.domain.repository.WarrantyRuleRepository;
import com.empresa.sistema.domain.service.exception.BusinessException;
import com.empresa.sistema.domain.service.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class WarrantyService {

    private final WarrantyRepository warrantyRepository;
    private final WarrantyRuleRepository warrantyRuleRepository;

    public Warranty createWarrantyOnHire(JobApplication application) {
        // Prevent duplicate warranties
        if (warrantyRepository.existsByJobApplicationId(application.getId())) {
            log.warn("Warranty already exists for application {}", application.getId());
            return warrantyRepository.findByJobApplicationId(application.getId()).orElse(null);
        }

        Job job = application.getJob();
        int days = resolveGuaranteeDays(job);

        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(days);

        Warranty warranty = Warranty.builder()
                .job(job)
                .jobApplication(application)
                .headhunter(job.getHeadhunter())
                .serviceCategory(job.getServiceCategory())
                .guaranteeDays(days)
                .startDate(startDate)
                .endDate(endDate)
                .status(Warranty.WarrantyStatus.ACTIVE)
                .build();

        log.info("Creating warranty for job {} with {} days (category: {})", job.getId(), days, job.getServiceCategory());
        return warrantyRepository.save(warranty);
    }

    private int resolveGuaranteeDays(Job job) {
        if (job.getServiceCategory() != null) {
            return warrantyRuleRepository.findByServiceCategory(job.getServiceCategory())
                    .filter(WarrantyRule::getActive)
                    .map(WarrantyRule::getDefaultDays)
                    .orElse(job.getGuaranteeDays() != null ? job.getGuaranteeDays() : 90);
        }
        return job.getGuaranteeDays() != null ? job.getGuaranteeDays() : 90;
    }

    @Transactional(readOnly = true)
    public Warranty findById(Long id) {
        return warrantyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Garantia não encontrada com ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<Warranty> findByJobId(Long jobId) {
        return warrantyRepository.findByJobId(jobId);
    }

    @Transactional(readOnly = true)
    public List<Warranty> findByHeadhunterId(Long headhunterId) {
        return warrantyRepository.findByHeadhunterId(headhunterId);
    }

    @Transactional(readOnly = true)
    public List<Warranty> findByStatus(Warranty.WarrantyStatus status) {
        return warrantyRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public List<Warranty> findExpiringWarranties(int daysBefore) {
        LocalDate targetDate = LocalDate.now().plusDays(daysBefore);
        return warrantyRepository.findExpiringWarrantiesNotNotified(targetDate);
    }

    @Transactional(readOnly = true)
    public List<Warranty> findAll() {
        return warrantyRepository.findAll();
    }

    public void markNotificationSent(Long warrantyId) {
        Warranty warranty = findById(warrantyId);
        warranty.setNotificationSentAt(LocalDateTime.now());
        warranty.setStatus(Warranty.WarrantyStatus.EXPIRING_SOON);
        warrantyRepository.save(warranty);
    }

    public Warranty markAsBreach(Long warrantyId, String reason) {
        Warranty warranty = findById(warrantyId);

        if (warranty.getStatus() == Warranty.WarrantyStatus.EXPIRED ||
            warranty.getStatus() == Warranty.WarrantyStatus.BREACHED) {
            throw new BusinessException("Garantia já está finalizada");
        }

        warranty.setStatus(Warranty.WarrantyStatus.BREACHED);
        warranty.setBreachedAt(LocalDateTime.now());
        warranty.setBreachReason(reason);

        log.info("Warranty {} breached for job {}: {}", warrantyId, warranty.getJob().getId(), reason);
        return warrantyRepository.save(warranty);
    }

    public void expireWarranties() {
        List<Warranty> expired = warrantyRepository.findExpiredWarranties(LocalDate.now());
        for (Warranty warranty : expired) {
            warranty.setStatus(Warranty.WarrantyStatus.EXPIRED);
            warrantyRepository.save(warranty);
            log.info("Warranty {} expired for job {}", warranty.getId(), warranty.getJob().getId());
        }
    }

    // WarrantyRule CRUD
    @Transactional(readOnly = true)
    public List<WarrantyRule> getWarrantyRules() {
        return warrantyRuleRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<WarrantyRule> getActiveWarrantyRules() {
        return warrantyRuleRepository.findByActiveTrue();
    }

    public WarrantyRule createRule(WarrantyRule rule) {
        if (warrantyRuleRepository.existsByServiceCategory(rule.getServiceCategory())) {
            throw new BusinessException("Já existe uma regra para a categoria: " + rule.getServiceCategory());
        }
        return warrantyRuleRepository.save(rule);
    }

    public WarrantyRule updateRule(Long ruleId, Integer defaultDays, Boolean active) {
        WarrantyRule rule = warrantyRuleRepository.findById(ruleId)
                .orElseThrow(() -> new ResourceNotFoundException("Regra não encontrada com ID: " + ruleId));

        if (defaultDays != null) {
            rule.setDefaultDays(defaultDays);
        }
        if (active != null) {
            rule.setActive(active);
        }
        return warrantyRuleRepository.save(rule);
    }

    public void deleteRule(Long ruleId) {
        WarrantyRule rule = warrantyRuleRepository.findById(ruleId)
                .orElseThrow(() -> new ResourceNotFoundException("Regra não encontrada com ID: " + ruleId));

        // Check for active warranties using this rule
        List<Warranty> activeWarranties = warrantyRepository.findByStatus(Warranty.WarrantyStatus.ACTIVE);
        boolean hasActive = activeWarranties.stream()
                .anyMatch(w -> w.getServiceCategory() == rule.getServiceCategory());

        if (hasActive) {
            throw new BusinessException("Não é possível deletar regra com garantias ativas. Desative-a primeiro.");
        }

        warrantyRuleRepository.delete(rule);
    }

    @Transactional(readOnly = true)
    public long countByStatus(Warranty.WarrantyStatus status) {
        return warrantyRepository.countByStatus(status);
    }
}
