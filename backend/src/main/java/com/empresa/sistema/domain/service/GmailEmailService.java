package com.empresa.sistema.domain.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class GmailEmailService implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    public void sendWarrantyExpirationAlert(String to, String headhunterName, String jobTitle,
            String clientName, String candidateName, String contactPersonName,
            String contactEmail, LocalDate expirationDate, long daysRemaining,
            String serviceCategory, int guaranteeDays) {

        String subject = "[Camarmo] Garantia expirando - " + jobTitle;

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        StringBuilder body = new StringBuilder();
        body.append("Olá ").append(headhunterName).append(",\n\n");
        body.append("A garantia da vaga \"").append(jobTitle).append("\" para o cliente ").append(clientName);
        body.append(" está expirando em ").append(daysRemaining).append(" dias (").append(expirationDate.format(fmt)).append(").\n\n");
        body.append("Candidato contratado: ").append(candidateName).append("\n");
        body.append("Categoria: ").append(serviceCategory).append("\n");
        body.append("Período de garantia: ").append(guaranteeDays).append(" dias\n");
        if (contactPersonName != null) {
            body.append("\nGestor: ").append(contactPersonName);
            if (contactEmail != null) {
                body.append(" (").append(contactEmail).append(")");
            }
            body.append("\n");
        }
        body.append("\nPor favor, verifique o status do candidato com o cliente.\n\n");
        body.append("---\nSistema Camarmo - Banco de Talentos");

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body.toString());
            mailSender.send(message);
            log.info("Warranty expiration alert sent to {} for job '{}'", to, jobTitle);
        } catch (Exception e) {
            log.error("Failed to send warranty expiration alert to {} for job '{}': {}", to, jobTitle, e.getMessage());
            throw e;
        }
    }
}
