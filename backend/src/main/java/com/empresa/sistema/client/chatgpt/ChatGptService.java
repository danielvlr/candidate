package com.empresa.sistema.client.chatgpt;

import com.empresa.sistema.client.chatgpt.config.ChatGptConfig;
import com.empresa.sistema.client.chatgpt.dto.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class ChatGptService {

    private static final Logger logger = LoggerFactory.getLogger(ChatGptService.class);

    @Autowired
    private ChatGptClient chatGptClient;

    @Autowired
    private ChatGptConfig config;

    @Autowired
    private ObjectMapper objectMapper;

    public LinkedInProfileResponse extractLinkedInProfile(String pdfText) {
        try {
            String prompt = createLinkedInExtractionPrompt(pdfText);

            ChatMessage systemMessage = new ChatMessage("system",
                "Extraia as informações do texto fornecido e retorne um JSON no formato especificado, sem texto adicional.");

            ChatMessage userMessage = new ChatMessage("user", prompt);

            List<ChatMessage> messages = Arrays.asList(systemMessage, userMessage);

            ChatGptRequest request = new ChatGptRequest(
                config.getModel(),
                messages,
                2000, // Reduced token limit
                0.7   // Lower temperature for more consistent output
            );

            String authorization = "Bearer " + config.getApiKey();

            ChatGptResponse response = chatGptClient.createChatCompletion(
                authorization,
                request
            );

            if (response.getChoices() != null && !response.getChoices().isEmpty()) {
                String jsonResponse = response.getChoices().get(0).getMessage().getContent();

                // Limpar possível markdown do JSON
                jsonResponse = cleanJsonResponse(jsonResponse);

                logger.info("ChatGPT Response: {}", jsonResponse);

                LinkedInProfileResponse profile = objectMapper.readValue(jsonResponse, LinkedInProfileResponse.class);

                // Geração de placeholder para imagem de perfil
                if (profile.getName() != null) {
                    String initials = generateInitials(profile.getName());
                    String placeholderUrl = String.format("https://ui-avatars.com/api/?name=%s&size=200&background=0077B5&color=fff", initials.replace(" ", "+"));
                    profile.setProfileImageUrl(placeholderUrl);
                    logger.info("Placeholder de imagem gerado para: {}", profile.getName());
                }

                return profile;
            }

            throw new RuntimeException("Nenhuma resposta válida recebida do ChatGPT");

        } catch (Exception e) {
            logger.error("Erro ao extrair perfil LinkedIn via ChatGPT", e);
            throw new RuntimeException("Erro ao processar PDF via ChatGPT: " + e.getMessage(), e);
        }
    }

    private String generateInitials(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return "U";
        }

        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        } else {
            String initials = "";
            for (int i = 0; i < Math.min(2, parts.length); i++) {
                if (!parts[i].isEmpty()) {
                    initials += parts[i].charAt(0);
                }
            }
            return initials.toUpperCase();
        }
    }

    private String createLinkedInExtractionPrompt(String pdfText) {
        return String.format(
            "Analise o seguinte texto extraído de um PDF de perfil LinkedIn e extraia as informações estruturadas. " +
            "Retorne APENAS um JSON válido no formato especificado, sem texto adicional antes ou depois.\n\n" +
            "Formato JSON esperado:\n" +
            "{\n" +
            "  \"profileUrl\": \"string\",\n" +
            "  \"name\": \"string\",\n" +
            "  \"headline\": \"string\",\n" +
            "  \"location\": \"string\",\n" +
            "  \"contact\": {\n" +
            "    \"email\": \"string\",\n" +
            "    \"phone\": \"string\",\n" +
            "    \"website\": \"string\",\n" +
            "    \"linkedinProfile\": \"string\"\n" +
            "  },\n" +
            "  \"about\": \"string\",\n" +
            "  \"experience\": [\n" +
            "    {\n" +
            "      \"title\": \"string\",\n" +
            "      \"company\": \"string\",\n" +
            "      \"startDate\": \"string\",\n" +
            "      \"endDate\": \"string\",\n" +
            "      \"location\": \"string\",\n" +
            "      \"description\": \"string\"\n" +
            "    }\n" +
            "  ],\n" +
            "  \"education\": [\n" +
            "    {\n" +
            "      \"school\": \"string\",\n" +
            "      \"degree\": \"string\",\n" +
            "      \"startDate\": \"string\",\n" +
            "      \"endDate\": \"string\",\n" +
            "      \"description\": \"string\"\n" +
            "    }\n" +
            "  ],\n" +
            "  \"skills\": [\"string\"],\n" +
            "  \"certifications\": [\"string\"],\n" +
            "  \"languages\": [\"string\"],\n" +
            "  \"projects\": [\"string\"],\n" +
            "  \"volunteer\": [\"string\"]\n" +
            "}\n\n" +
            "Text: %s",
            pdfText
        );
    }

    private String cleanJsonResponse(String jsonResponse) {
        // Remover possível markdown
        if (jsonResponse.startsWith("```json")) {
            jsonResponse = jsonResponse.substring(7);
        }
        if (jsonResponse.startsWith("```")) {
            jsonResponse = jsonResponse.substring(3);
        }
        if (jsonResponse.endsWith("```")) {
            jsonResponse = jsonResponse.substring(0, jsonResponse.length() - 3);
        }

        return jsonResponse.trim();
    }
}