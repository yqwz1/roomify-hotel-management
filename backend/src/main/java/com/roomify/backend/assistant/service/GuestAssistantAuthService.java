package com.roomify.backend.assistant.service;

import com.roomify.backend.assistant.entity.GuestConversation;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.GuestRepository;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GuestAssistantAuthService {

    private final GuestRepository guestRepository;
    private final UserRepository userRepository;

    public String requireAuthenticatedEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication is required");
        }
        String email = normalize(authentication.getName());
        if (email == null) {
            throw new AccessDeniedException("Authenticated principal email is missing");
        }
        return email;
    }

    public User requireCurrentSupportUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Support authentication is required");
        }
        boolean isSupport = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_STAFF".equals(authority.getAuthority())
                        || "ROLE_MANAGER".equals(authority.getAuthority()));
        if (!isSupport) {
            throw new AccessDeniedException("Support role is required");
        }
        String email = requireAuthenticatedEmail();
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Support user not found for email: " + email));
    }

    public List<Guest> resolveAuthenticatedGuests() {
        String email = requireAuthenticatedEmail();
        List<Guest> guests = guestRepository.findAllByEmailIgnoreCaseOrderByIdAsc(email);
        if (guests.isEmpty()) {
            throw new ResourceNotFoundException("Guest profile not found for authenticated user: " + email);
        }
        return guests;
    }

    public List<Long> getAuthenticatedGuestIds() {
        return resolveAuthenticatedGuests().stream()
                .map(Guest::getId)
                .toList();
    }

    public Guest requirePrimaryGuest() {
        return resolveAuthenticatedGuests().stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Guest profile not found"));
    }

    public void assertGuestOwnsConversation(GuestConversation conversation) {
        List<Long> guestIds = getAuthenticatedGuestIds();
        Long ownerId = conversation.getGuest() != null ? conversation.getGuest().getId() : null;
        if (ownerId == null || !guestIds.contains(ownerId)) {
            throw new AccessDeniedException("Conversation access denied for authenticated guest");
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return normalized.isBlank() ? null : normalized;
    }
}
