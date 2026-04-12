package com.empresa.sistema.domain.service;

import com.empresa.sistema.api.dto.request.CandidateCreateRequest;
import com.empresa.sistema.api.dto.response.CandidateResponse;
import com.empresa.sistema.api.mapper.CandidateMapper;
import com.empresa.sistema.domain.entity.Candidate;
import com.empresa.sistema.client.chatgpt.ChatGptService;
import com.empresa.sistema.client.chatgpt.dto.LinkedInProfileResponse;
import com.empresa.sistema.domain.service.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;

import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class LinkedInService {

    private static final Logger logger = LoggerFactory.getLogger(LinkedInService.class);

    private final ChatGptService chatGptService;
    private final CandidateMapper candidateMapper;

    /**
     * Extrai dados de candidato a partir de um arquivo PDF do LinkedIn
     */
    public CandidateResponse extractCandidateDataFromPdf(MultipartFile file) {
        logger.info("Processando arquivo PDF enviado: {}", file.getOriginalFilename());

        try {
            // Extract text from PDF
            String pdfText = extractTextFromUploadedPdf(file);
            logger.info("Texto extraído do PDF ({} caracteres)", pdfText.length());

            if (pdfText == null || pdfText.trim().isEmpty()) {
                throw new BusinessException("Não foi possível extrair texto do PDF enviado");
            }

            // Use ChatGPT to extract structured data
            LinkedInProfileResponse linkedInProfile = chatGptService.extractLinkedInProfile(pdfText);
            if (linkedInProfile == null) {
                throw new BusinessException("Falha ao processar dados do LinkedIn via ChatGPT");
            }

            CandidateCreateRequest candidateRequest = convertChatGptResponseToRequest(linkedInProfile);

            // Validate extracted data
            if (candidateRequest.getFullName() == null || candidateRequest.getFullName().trim().isEmpty()) {
                throw new BusinessException("Não foi possível extrair nome do candidato do PDF");
            }

            if (candidateRequest.getEmail() == null || candidateRequest.getEmail().trim().isEmpty()) {
                throw new BusinessException("Não foi possível extrair email do candidato do PDF");
            }

            // Convert Request to Entity and then to Response
            Candidate candidate = candidateMapper.toEntity(candidateRequest);
            setDefaultValues(candidate);
            CandidateResponse response = candidateMapper.toResponse(candidate);

            logger.info("Dados estruturados extraídos com sucesso via ChatGPT para: {}", response.getFullName());
            return response;

        } catch (BusinessException e) {
            logger.error("Erro de negócio ao processar PDF: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Erro técnico ao processar PDF via ChatGPT: {}", file.getOriginalFilename(), e);
            throw new BusinessException("Falha técnica ao processar o PDF do LinkedIn: " + e.getMessage());
        }
    }

    /**
     * Extrai texto de um arquivo PDF enviado
     */
    private String extractTextFromUploadedPdf(MultipartFile file) throws IOException {
        logger.info("Extraindo texto do PDF: {}", file.getOriginalFilename());

        try (InputStream inputStream = file.getInputStream()) {
            byte[] fileBytes = inputStream.readAllBytes();

            // Validate that it's actually a PDF file
            if (fileBytes.length < 4 || !isPdfFile(fileBytes)) {
                throw new IllegalArgumentException("O arquivo enviado não é um PDF válido");
            }

            PDDocument document = org.apache.pdfbox.Loader.loadPDF(fileBytes);
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            document.close();

            logger.info("PDF processado com sucesso. Texto extraído: {} caracteres", text.length());
            return text;
        } catch (IllegalArgumentException e) {
            logger.error("Arquivo inválido: {}", file.getOriginalFilename(), e);
            throw e;
        } catch (Exception e) {
            logger.error("Erro ao extrair texto do PDF: {}", file.getOriginalFilename(), e);
            throw new IOException("Falha na extração do texto do PDF: " + e.getMessage(), e);
        }
    }

    /**
     * Verifica se o arquivo é um PDF válido
     */
    private boolean isPdfFile(byte[] fileBytes) {
        if (fileBytes.length < 4) {
            return false;
        }
        // Check for PDF header: %PDF
        return fileBytes[0] == 0x25 && fileBytes[1] == 0x50 &&
               fileBytes[2] == 0x44 && fileBytes[3] == 0x46;
    }

    /**
     * Converte resposta do ChatGPT para CandidateCreateRequest
     */
    public CandidateCreateRequest convertChatGptResponseToRequest(LinkedInProfileResponse linkedInProfile) {
        if (linkedInProfile == null) {
            throw new IllegalArgumentException("LinkedInProfile não pode ser nulo");
        }

        CandidateCreateRequest candidate = new CandidateCreateRequest();

        // Basic information
        candidate.setFullName(linkedInProfile.getName());
        candidate.setHeadline(linkedInProfile.getHeadline());
        candidate.setSummary(linkedInProfile.getAbout());
        candidate.setLinkedinUrl(linkedInProfile.getProfileUrl());

        // Contact information
        if (linkedInProfile.getContact() != null) {
            candidate.setEmail(linkedInProfile.getContact().getEmail());
        }

        // Location information
        if (linkedInProfile.getLocation() != null) {
            String[] locationParts = linkedInProfile.getLocation().split(",");
            if (locationParts.length > 0) {
                candidate.setCity(locationParts[0].trim());
            }
            if (locationParts.length > 1) {
                candidate.setState(locationParts[1].trim());
            }
        }

        // Skills
        if (linkedInProfile.getSkills() != null && !linkedInProfile.getSkills().isEmpty()) {
            candidate.setSkills(String.join(", ", linkedInProfile.getSkills()));
        }

        // Experience
        if (linkedInProfile.getExperience() != null && !linkedInProfile.getExperience().isEmpty()) {
            List<com.empresa.sistema.api.dto.request.ExperienceCreateRequest> experiences = new ArrayList<>();
            for (LinkedInProfileResponse.ExperienceInfo exp : linkedInProfile.getExperience()) {
                com.empresa.sistema.api.dto.request.ExperienceCreateRequest experienceRequest = new com.empresa.sistema.api.dto.request.ExperienceCreateRequest();
                experienceRequest.setJobTitle(exp.getTitle());
                experienceRequest.setCompanyName(exp.getCompany());
                experienceRequest.setDescription(exp.getDescription());
                experienceRequest.setLocation(exp.getLocation());

                // Parse dates
                experienceRequest.setStartDate(parseLinkedInDate(exp.getStartDate()));
                if (exp.getEndDate() != null && !exp.getEndDate().equalsIgnoreCase("Present")) {
                    experienceRequest.setEndDate(parseLinkedInDate(exp.getEndDate()));
                    experienceRequest.setIsCurrent(false);
                } else {
                    experienceRequest.setIsCurrent(true);
                }

                experiences.add(experienceRequest);
            }
            candidate.setExperiences(experiences);
        }

        // Education
        if (linkedInProfile.getEducation() != null && !linkedInProfile.getEducation().isEmpty()) {
            List<com.empresa.sistema.api.dto.request.EducationCreateRequest> educations = new ArrayList<>();
            for (LinkedInProfileResponse.EducationInfo edu : linkedInProfile.getEducation()) {
                com.empresa.sistema.api.dto.request.EducationCreateRequest educationRequest = new com.empresa.sistema.api.dto.request.EducationCreateRequest();
                educationRequest.setInstitution(edu.getSchool());
                educationRequest.setDegree(edu.getDegree());
                educationRequest.setDescription(edu.getDescription());

                // Parse dates
                educationRequest.setStartDate(parseLinkedInDate(edu.getStartDate()));
                educationRequest.setEndDate(parseLinkedInDate(edu.getEndDate()));

                educations.add(educationRequest);
            }
            candidate.setEducation(educations);
        }

        // Generate email if missing
        if (candidate.getEmail() == null || candidate.getEmail().trim().isEmpty()) {
            candidate.setEmail(generateEmailFromName(candidate.getFullName()));
        }

        return candidate;
    }

    /**
     * Converte datas do formato LinkedIn para LocalDate
     */
    private java.time.LocalDate parseLinkedInDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }

        try {
            // Try common formats
            if (dateStr.matches("\\d{4}")) {
                // Year only: use first day of year
                return java.time.LocalDate.of(Integer.parseInt(dateStr), 1, 1);
            } else if (dateStr.matches("\\d{4}-\\d{2}")) {
                // Year and month: use first day of month
                String[] parts = dateStr.split("-");
                return java.time.LocalDate.of(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]), 1);
            } else if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
                // Full date
                return java.time.LocalDate.parse(dateStr);
            }
        } catch (Exception e) {
            logger.warn("Erro ao converter data do LinkedIn: {}", dateStr, e);
        }

        return null;
    }

    /**
     * Gera email baseado no nome
     */
    private String generateEmailFromName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return "usuario@email.com";
        }

        String[] nameParts = fullName.toLowerCase()
            .replaceAll("[^a-z ]", "")
            .split(" ");

        if (nameParts.length >= 2) {
            return nameParts[0] + "." + nameParts[nameParts.length - 1] + "@email.com";
        } else {
            return nameParts[0] + "@email.com";
        }
    }

    /**
     * Define valores padrão para campos obrigatórios (Entity)
     */
    private void setDefaultValues(Candidate candidate) {
        if (candidate.getStatus() == null) {
            candidate.setStatus(Candidate.CandidateStatus.ACTIVE);
        }
        if (candidate.getWorkPreference() == null) {
            candidate.setWorkPreference(Candidate.WorkPreference.HYBRID);
        }
        if (candidate.getWillingToRelocate() == null) {
            candidate.setWillingToRelocate(false);
        }
    }
}