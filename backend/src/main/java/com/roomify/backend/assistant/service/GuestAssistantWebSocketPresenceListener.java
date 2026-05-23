package com.roomify.backend.assistant.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
public class GuestAssistantWebSocketPresenceListener {

    private final GuestAssistantPresenceService presenceService;
    private final GuestAssistantRealtimeService realtimeService;

    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        if (accessor.getUser() == null) {
            return;
        }
        realtimeService.broadcastPresenceSnapshot();
    }

    @EventListener
    public void handleSessionDisconnected(SessionDisconnectEvent event) {
        presenceService.unregister(event.getSessionId());
        realtimeService.broadcastPresenceSnapshot();
    }
}
