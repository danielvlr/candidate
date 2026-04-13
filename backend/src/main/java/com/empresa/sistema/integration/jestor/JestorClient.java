package com.empresa.sistema.integration.jestor;

import com.empresa.sistema.config.JestorConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Component
public class JestorClient {

    private static final Logger log = LoggerFactory.getLogger(JestorClient.class);
    private static final int PAGE_SIZE = 500;

    private final JestorConfig config;
    private final RestTemplate restTemplate;

    public JestorClient(JestorConfig config, RestTemplate jestorRestTemplate) {
        this.config = config;
        this.restTemplate = jestorRestTemplate;
    }

    /**
     * GET /org/get — uses Bearer header auth
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getOrganization() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(config.getApiToken());
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange(
            config.getApiUrl() + "/org/get",
            HttpMethod.GET,
            entity,
            Map.class
        );
        return response.getBody();
    }

    /**
     * POST /object/list — uses api_token in body (NOT header)
     */
    public JestorListResponse listRecords(String objectType, int page, int size) {
        Map<String, Object> body = new HashMap<>();
        body.put("object_type", objectType);
        body.put("api_token", config.getApiToken());
        body.put("page", page);
        body.put("size", size);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        for (int attempt = 0; attempt < 3; attempt++) {
            try {
                ResponseEntity<JestorListResponse> response = restTemplate.exchange(
                    config.getApiUrl() + "/object/list",
                    HttpMethod.POST,
                    entity,
                    JestorListResponse.class
                );
                return response.getBody();
            } catch (Exception e) {
                if (attempt == 2) throw e;
                log.warn("Jestor API attempt {} failed for table {} page {}: {}. Retrying...", attempt + 1, objectType, page, e.getMessage());
                try { Thread.sleep(2000L * (attempt + 1)); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); throw new RuntimeException(ie); }
            }
        }
        return null; // unreachable
    }

    /**
     * Paginates through all records of a table
     */
    public List<Map<String, Object>> listAllRecords(String objectType) {
        List<Map<String, Object>> allItems = new ArrayList<>();
        int page = 1;
        boolean hasMore = true;

        while (hasMore) {
            JestorListResponse response = listRecords(objectType, page, PAGE_SIZE);
            if (response == null || !response.isStatus() || response.getData() == null) {
                log.warn("Jestor API returned null/error for table {} page {}", objectType, page);
                break;
            }

            List<Map<String, Object>> items = response.getData().getItems();
            if (items != null && !items.isEmpty()) {
                allItems.addAll(items);
            }

            hasMore = response.getData().isHasMore();
            page++;

            if (page > 1000) {
                log.warn("Safety limit reached: 1000 pages for table {}", objectType);
                break;
            }
        }

        log.info("Fetched {} records from Jestor table {}", allItems.size(), objectType);
        return allItems;
    }
}
