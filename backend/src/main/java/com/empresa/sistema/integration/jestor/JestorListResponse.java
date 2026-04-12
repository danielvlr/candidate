package com.empresa.sistema.integration.jestor;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class JestorListResponse {

    private boolean status;
    private JestorData data;
    private JestorMetadata metadata;

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class JestorData {
        private List<String> warnings;
        private List<Map<String, Object>> items;
        private int total;
        @JsonProperty("has_more")
        private boolean hasMore;

        public List<String> getWarnings() { return warnings; }
        public void setWarnings(List<String> warnings) { this.warnings = warnings; }
        public List<Map<String, Object>> getItems() { return items; }
        public void setItems(List<Map<String, Object>> items) { this.items = items; }
        public int getTotal() { return total; }
        public void setTotal(int total) { this.total = total; }
        public boolean isHasMore() { return hasMore; }
        public void setHasMore(boolean hasMore) { this.hasMore = hasMore; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class JestorMetadata {
        private String response;
        private String message;

        public String getResponse() { return response; }
        public void setResponse(String response) { this.response = response; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public boolean isStatus() { return status; }
    public void setStatus(boolean status) { this.status = status; }
    public JestorData getData() { return data; }
    public void setData(JestorData data) { this.data = data; }
    public JestorMetadata getMetadata() { return metadata; }
    public void setMetadata(JestorMetadata metadata) { this.metadata = metadata; }
}
