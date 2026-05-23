package com.roomify.backend.assistant.controller;

import com.roomify.backend.assistant.dto.ConversationDetailResponse;
import com.roomify.backend.assistant.dto.ConversationMessageResponse;
import com.roomify.backend.assistant.dto.ConversationReplyRequest;
import com.roomify.backend.assistant.dto.ConversationSummaryResponse;
import com.roomify.backend.assistant.entity.ConversationStatus;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/staff/guest-assistant")
@PreAuthorize("hasAnyRole('STAFF', 'MANAGER')")
@RequiredArgsConstructor
public class StaffGuestAssistantController {

    private final GuestAssistantConversationService conversationService;

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationSummaryResponse>> list(
            @RequestParam(required = false) ConversationStatus status) {
        return ResponseEntity.ok(conversationService.listStaffConversations(status));
    }

    @GetMapping("/conversations/{publicId}")
    public ResponseEntity<ConversationDetailResponse> detail(@PathVariable String publicId) {
        return ResponseEntity.ok(conversationService.getStaffConversationDetail(publicId));
    }

    @PostMapping("/conversations/{publicId}/messages")
    public ResponseEntity<ConversationMessageResponse> reply(
            @PathVariable String publicId,
            @Valid @RequestBody ConversationReplyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(conversationService.sendStaffReply(publicId, request));
    }

    @PostMapping("/conversations/{publicId}/read")
    public ResponseEntity<ConversationDetailResponse> markRead(@PathVariable String publicId) {
        return ResponseEntity.ok(conversationService.markStaffRead(publicId));
    }

    @PostMapping("/conversations/{publicId}/resolve")
    public ResponseEntity<ConversationSummaryResponse> resolve(@PathVariable String publicId) {
        return ResponseEntity.ok(conversationService.resolveConversation(publicId));
    }
}
