package com.roomify.backend.assistant.config;

import com.roomify.backend.assistant.service.GuestAssistantPresenceService;
import com.roomify.backend.assistant.service.GuestAssistantStompAuthenticationService;
import com.roomify.backend.assistant.service.GuestAssistantStompAuthenticationService.AuthenticatedWebSocketUser;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GuestAssistantStompAuthChannelInterceptor implements ChannelInterceptor {

    private final GuestAssistantStompAuthenticationService authenticationService;
    private final GuestAssistantPresenceService presenceService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = firstHeader(accessor, "Authorization");
            AuthenticatedWebSocketUser user = authenticationService.authenticateBearerToken(authHeader);
            accessor.setUser(user.authentication());
            presenceService.register(accessor.getSessionId(), user.email(), user.roles());
        }

        return message;
    }

    private String firstHeader(StompHeaderAccessor accessor, String name) {
        List<String> values = accessor.getNativeHeader(name);
        if (values != null && !values.isEmpty()) {
            return values.get(0);
        }
        values = accessor.getNativeHeader(name.toLowerCase(java.util.Locale.ROOT));
        if (values != null && !values.isEmpty()) {
            return values.get(0);
        }
        return null;
    }
}
