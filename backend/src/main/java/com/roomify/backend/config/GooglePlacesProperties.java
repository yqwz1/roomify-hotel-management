package com.roomify.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "roomify.google-places")
public class GooglePlacesProperties {

    private String apiKey = "";
    private String baseUrl = "https://places.googleapis.com/v1";
    private long cacheTtlSeconds = 300;
    private int photoMaxWidthPx = 900;
    private String defaultSearchText = "hotels in Riyadh";
    private boolean demoKeyMode = false;

    public boolean hasApiKey() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public long getCacheTtlSeconds() {
        return cacheTtlSeconds;
    }

    public void setCacheTtlSeconds(long cacheTtlSeconds) {
        this.cacheTtlSeconds = cacheTtlSeconds;
    }

    public int getPhotoMaxWidthPx() {
        return photoMaxWidthPx;
    }

    public void setPhotoMaxWidthPx(int photoMaxWidthPx) {
        this.photoMaxWidthPx = photoMaxWidthPx;
    }

    public String getDefaultSearchText() {
        return defaultSearchText;
    }

    public void setDefaultSearchText(String defaultSearchText) {
        this.defaultSearchText = defaultSearchText;
    }

    public boolean isDemoKeyMode() {
        return demoKeyMode;
    }

    public void setDemoKeyMode(boolean demoKeyMode) {
        this.demoKeyMode = demoKeyMode;
    }
}
