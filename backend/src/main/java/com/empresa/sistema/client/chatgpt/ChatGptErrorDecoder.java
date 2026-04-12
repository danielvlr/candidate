package com.empresa.sistema.client.chatgpt;

import feign.Response;
import feign.codec.ErrorDecoder;

public class ChatGptErrorDecoder implements ErrorDecoder {

    @Override
    public Exception decode(String methodKey, Response response) {
        switch (response.status()) {
            case 400:
                return new IllegalArgumentException("Bad Request - Invalid parameters sent to ChatGPT API");
            case 401:
                return new SecurityException("Unauthorized - Invalid API key");
            case 403:
                return new SecurityException("Forbidden - Access denied");
            case 429:
                return new RuntimeException("Rate limit exceeded");
            case 500:
                return new RuntimeException("Internal server error in ChatGPT API");
            default:
                return new Default().decode(methodKey, response);
        }
    }
}