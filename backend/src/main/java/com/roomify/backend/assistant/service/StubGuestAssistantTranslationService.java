package com.roomify.backend.assistant.service;

import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

@Service
public class StubGuestAssistantTranslationService implements GuestAssistantTranslationService {

    private static final Pattern ARABIC_PATTERN = Pattern.compile("[\\p{InArabic}]");

    @Override
    public GuestAssistantTranslationBundle translateIncoming(String text, String requestedLanguage) {
        String sanitized = text == null ? "" : text.trim();
        String detectedLanguage = detectLanguage(sanitized, requestedLanguage);
        String english = "en".equals(detectedLanguage)
                ? sanitized
                : "[English translation fallback from " + detectedLanguage + "] " + sanitized;
        String arabic = "ar".equals(detectedLanguage)
                ? sanitized
                : "[Arabic translation fallback from " + detectedLanguage + "] " + sanitized;
        return new GuestAssistantTranslationBundle(detectedLanguage, arabic, english);
    }

    @Override
    public String translateToGuestLanguage(String text, String sourceLanguage, String targetLanguage) {
        String sanitized = text == null ? "" : text.trim();
        String normalizedTarget = normalizeLanguage(targetLanguage);
        if ("ar".equals(normalizedTarget)) {
            return "[Arabic delivery fallback from " + normalizeLanguage(sourceLanguage) + "] " + sanitized;
        }
        if ("en".equals(normalizedTarget) || normalizedTarget == null) {
            return sanitized;
        }
        return "[" + normalizedTarget.toUpperCase(Locale.ROOT) + " delivery fallback from "
                + normalizeLanguage(sourceLanguage) + "] " + sanitized;
    }

    private String detectLanguage(String text, String requestedLanguage) {
        String normalizedRequested = normalizeLanguage(requestedLanguage);
        if (normalizedRequested != null) {
            return normalizedRequested;
        }
        if (text == null || text.isBlank()) {
            return "en";
        }
        if (ARABIC_PATTERN.matcher(text).find()) {
            return "ar";
        }
        String lower = text.toLowerCase(Locale.ROOT);
        if (lower.contains("bonjour") || lower.contains("merci") || lower.contains("s'il")) {
            return "fr";
        }
        if (lower.contains("merhaba") || lower.contains("teşekkür") || lower.contains("tesekkur")) {
            return "tr";
        }
        return "en";
    }

    private String normalizeLanguage(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "ar", "en", "fr", "tr" -> normalized;
            default -> null;
        };
    }
}
