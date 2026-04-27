package com.empresa.sistema.domain.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
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

    public void sendInvite(String toEmail, String candidateName, String invitationUrl,
                           LocalDateTime expiresAt, String headhunterName) throws MailException {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String formattedExpiry = expiresAt.format(fmt);
        String safeName = candidateName != null ? candidateName : "candidato(a)";

        String subject = "Convite para cadastro - Sistema de Recrutamento";
        String html = """
            <!DOCTYPE html>
            <html><head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <h2 style="color: #4f46e5;">Convite para Cadastro</h2>
                <p>Olá <strong>%s</strong>,</p>
                <p><strong>%s</strong> te convidou para se cadastrar no nosso sistema de recrutamento.</p>
                <p style="margin: 24px 0;">
                    <a href="%s" style="background:#4f46e5;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Fazer cadastro</a>
                </p>
                <p style="color:#666;font-size:13px;">Este link é válido até <strong>%s</strong>.</p>
                <p style="color:#999;font-size:12px;margin-top:32px;">Se você não conhece o remetente, ignore este email.</p>
            </body></html>
            """.formatted(safeName, headhunterName, invitationUrl, formattedExpiry);

        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, false, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(msg);
            log.info("Invite email sent to {}", toEmail);
        } catch (jakarta.mail.MessagingException e) {
            throw new org.springframework.mail.MailSendException("Failed to build invite email", e);
        }
    }
}
