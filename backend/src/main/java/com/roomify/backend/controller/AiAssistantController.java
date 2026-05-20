package com.roomify.backend.controller;

import com.roomify.backend.dto.ai.AiAssistantChatRequest;
import com.roomify.backend.dto.ai.AiAssistantChatResponse;
import com.roomify.backend.service.AiAssistantService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai-assistant")
@PreAuthorize("hasRole('MANAGER')")
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    public AiAssistantController(AiAssistantService aiAssistantService) {
        this.aiAssistantService = aiAssistantService;
    }

    @PostMapping("/chat")
    public ResponseEntity<AiAssistantChatResponse> chat(@Valid @RequestBody AiAssistantChatRequest request) {
        return ResponseEntity.ok(aiAssistantService.chat(request));
    }
}
