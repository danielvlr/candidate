package com.empresa.sistema.client.chatgpt;

import com.empresa.sistema.client.chatgpt.dto.ChatGptRequest;
import com.empresa.sistema.client.chatgpt.dto.ChatGptResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(
    name = "chatgpt-client",
    url = "${chatgpt.api.url:https://api.openai.com}",
    configuration = ChatGptFeignConfig.class
)
public interface ChatGptClient {

    @PostMapping(value = "/v1/chat/completions", consumes = "application/json", produces = "application/json")
    ChatGptResponse createChatCompletion(
        @RequestHeader("Authorization") String authorization,
        @RequestBody ChatGptRequest request
    );
}