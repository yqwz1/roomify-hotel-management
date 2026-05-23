package com.roomify.backend.assistant.controller;

import com.roomify.backend.assistant.dto.ConversationCreateRequest;
import com.roomify.backend.assistant.dto.ConversationDetailResponse;
import com.roomify.backend.assistant.dto.ConversationMessageCreateRequest;
import com.roomify.backend.assistant.dto.ConversationMessageResponse;
import com.roomify.backend.assistant.dto.ConversationQuickActionRequest;
import com.roomify.backend.assistant.dto.ConversationSummaryResponse;
import com.roomify.backend.assistant.service.GuestAssistantConversationService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/guest-assistant")
@PreAuthorize("hasRole('GUEST')")
@RequiredArgsConstructor
public class GuestAssistantConversationController {

    private final GuestAssistantConversationService conversationService;

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationSummaryResponse>> list() {
        return ResponseEntity.ok(conversationService.listGuestConversations());
    }

    @PostMapping("/conversations")
    public ResponseEntity<ConversationDetailResponse> create(@Valid @RequestBody ConversationCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(conversationService.createGuestConversation(request));
    }

    @GetMapping("/conversations/{publicId}")
    public ResponseEntity<ConversationDetailResponse> detail(@PathVariable String publicId) {
        return ResponseEntity.ok(conversationService.getGuestConversationDetail(publicId));
    }

    @PostMapping("/conversations/{publicId}/messages")
    public ResponseEntity<ConversationMessageResponse> sendMessage(
            @PathVariable String publicId,
            @Valid @RequestBody ConversationMessageCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(conversationService.sendGuestMessage(publicId, request));
    }

    @PostMapping("/conversations/{publicId}/quick-actions")
    public ResponseEntity<ConversationDetailResponse> quickAction(
            @PathVariable String publicId,
            @Valid @RequestBody ConversationQuickActionRequest request) {
        return ResponseEntity.ok(conversationService.runQuickAction(publicId, request));
    }

    @PostMapping("/conversations/{publicId}/read")
    public ResponseEntity<ConversationDetailResponse> markRead(@PathVariable String publicId) {
        return ResponseEntity.ok(conversationService.markGuestRead(publicId));
    }
}
