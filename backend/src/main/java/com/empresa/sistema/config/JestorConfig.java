package com.empresa.sistema.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
@ConfigurationProperties(prefix = "jestor")
public class JestorConfig {

    private String apiUrl;
    private String apiToken;
    private String syncCron;
    private String jobsTable;
    private String clientsTable;
    private String candidatesTable;
    private String headhuntersTable;
    private String warrantyRulesTable;
    private String candidateStatusLogsTable;

    @Bean
    public RestTemplate jestorRestTemplate(RestTemplateBuilder builder) {
        return builder
            .setConnectTimeout(Duration.ofSeconds(15))
            .setReadTimeout(Duration.ofSeconds(60))
            .build();
    }

    public String getApiUrl() { return apiUrl; }
    public void setApiUrl(String apiUrl) { this.apiUrl = apiUrl; }

    public String getApiToken() { return apiToken; }
    public void setApiToken(String apiToken) { this.apiToken = apiToken; }

    public String getSyncCron() { return syncCron; }
    public void setSyncCron(String syncCron) { this.syncCron = syncCron; }

    public String getJobsTable() { return jobsTable; }
    public void setJobsTable(String jobsTable) { this.jobsTable = jobsTable; }

    public String getClientsTable() { return clientsTable; }
    public void setClientsTable(String clientsTable) { this.clientsTable = clientsTable; }

    public String getCandidatesTable() { return candidatesTable; }
    public void setCandidatesTable(String candidatesTable) { this.candidatesTable = candidatesTable; }

    public String getHeadhuntersTable() { return headhuntersTable; }
    public void setHeadhuntersTable(String headhuntersTable) { this.headhuntersTable = headhuntersTable; }

    public String getWarrantyRulesTable() { return warrantyRulesTable; }
    public void setWarrantyRulesTable(String warrantyRulesTable) { this.warrantyRulesTable = warrantyRulesTable; }

    public String getCandidateStatusLogsTable() { return candidateStatusLogsTable; }
    public void setCandidateStatusLogsTable(String candidateStatusLogsTable) { this.candidateStatusLogsTable = candidateStatusLogsTable; }

    public boolean isConfigured() {
        return apiUrl != null && !apiUrl.isBlank()
            && apiToken != null && !apiToken.isBlank();
    }
}
