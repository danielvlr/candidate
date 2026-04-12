package com.empresa.sistema.client.chatgpt.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ChatGptConfig {

    @Value("${chatgpt.api.url:https://api.openai.com}")
    private String apiUrl;

    @Value("${chatgpt.api.key:}")
    private String apiKey;

    @Value("${chatgpt.model:gpt-4o}")
    private String model;

    @Value("${chatgpt.max-tokens:4000}")
    private int maxTokens;

    @Value("${chatgpt.temperature:0.7}")
    private double temperature;

    public String getApiUrl() {
        return apiUrl;
    }

    public String getApiKey() {
        return apiKey;
    }

    public String getModel() {
        return model;
    }

    public int getMaxTokens() {
        return maxTokens;
    }

    public double getTemperature() {
        return temperature;
    }
}