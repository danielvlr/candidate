package com.empresa.sistema.domain.service;

import java.time.LocalDate;

public interface EmailService {
    void sendWarrantyExpirationAlert(String to, String headhunterName, String jobTitle,
            String clientName, String candidateName, String contactPersonName,
            String contactEmail, LocalDate expirationDate, long daysRemaining,
            String serviceCategory, int guaranteeDays);
}
