package com.roomify.backend.assistant.service;

import java.util.Collection;
import java.util.Collections;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class GuestAssistantPresenceService {

    private final Map<String, PresenceSnapshot> sessions = new ConcurrentHashMap<>();

    public void register(String sessionId, String email, Collection<String> roles) {
        if (sessionId == null || sessionId.isBlank() || email == null || email.isBlank()) {
            return;
        }
        sessions.put(sessionId, new PresenceSnapshot(normalizeEmail(email), normalizeRoles(roles)));
    }

    public void unregister(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return;
        }
        sessions.remove(sessionId);
    }

    public boolean isSupportOnline() {
        return sessions.values().stream().anyMatch(snapshot -> isSupportRole(snapshot.roles()));
    }

    public int getSupportOnlineCount() {
        return (int) sessions.values().stream()
                .filter(snapshot -> isSupportRole(snapshot.roles()))
                .map(PresenceSnapshot::email)
                .distinct()
                .count();
    }

    public Set<String> getOnlineSupportEmails() {
        return sessions.values().stream()
                .filter(snapshot -> isSupportRole(snapshot.roles()))
                .map(PresenceSnapshot::email)
                .collect(java.util.stream.Collectors.toSet());
    }

    public Set<String> getAllConnectedEmails() {
        return sessions.values().stream()
                .map(PresenceSnapshot::email)
                .collect(java.util.stream.Collectors.toSet());
    }

    private Set<String> normalizeRoles(Collection<String> roles) {
        if (roles == null) {
            return Collections.emptySet();
        }
        return roles.stream()
                .filter(role -> role != null && !role.isBlank())
                .map(role -> role.trim().toUpperCase(Locale.ROOT))
                .collect(java.util.stream.Collectors.toSet());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private boolean isSupportRole(Set<String> roles) {
        return roles.contains("ROLE_STAFF") || roles.contains("ROLE_MANAGER");
    }

    private record PresenceSnapshot(String email, Set<String> roles) {
    }
}
