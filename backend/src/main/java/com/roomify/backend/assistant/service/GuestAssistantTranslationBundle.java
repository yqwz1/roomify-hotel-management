package com.roomify.backend.assistant.service;

public record GuestAssistantTranslationBundle(
        String detectedLanguage,
        String arabicText,
        String englishText) {
}
