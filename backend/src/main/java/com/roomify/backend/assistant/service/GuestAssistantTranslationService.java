package com.roomify.backend.assistant.service;

public interface GuestAssistantTranslationService {

    GuestAssistantTranslationBundle translateIncoming(String text, String requestedLanguage);

    String translateToGuestLanguage(String text, String sourceLanguage, String targetLanguage);
}
