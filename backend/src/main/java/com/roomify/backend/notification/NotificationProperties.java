package com.roomify.backend.notification;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "roomify.notification")
public class NotificationProperties {

    private boolean schedulingEnabled = true;
    private int maxAttempts = 5;
    private int retryBatchSize = 25;
    private int remindersBatchSize = 50;
    private int perRecipientPerHourLimit = 12;
    private int perRecipientPerDayLimit = 40;
    private int initialRetryDelayMinutes = 5;
    private int maxRetryDelayMinutes = 180;

    public boolean isSchedulingEnabled() {
        return schedulingEnabled;
    }

    public void setSchedulingEnabled(boolean schedulingEnabled) {
        this.schedulingEnabled = schedulingEnabled;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public int getRetryBatchSize() {
        return retryBatchSize;
    }

    public void setRetryBatchSize(int retryBatchSize) {
        this.retryBatchSize = retryBatchSize;
    }

    public int getRemindersBatchSize() {
        return remindersBatchSize;
    }

    public void setRemindersBatchSize(int remindersBatchSize) {
        this.remindersBatchSize = remindersBatchSize;
    }

    public int getPerRecipientPerHourLimit() {
        return perRecipientPerHourLimit;
    }

    public void setPerRecipientPerHourLimit(int perRecipientPerHourLimit) {
        this.perRecipientPerHourLimit = perRecipientPerHourLimit;
    }

    public int getPerRecipientPerDayLimit() {
        return perRecipientPerDayLimit;
    }

    public void setPerRecipientPerDayLimit(int perRecipientPerDayLimit) {
        this.perRecipientPerDayLimit = perRecipientPerDayLimit;
    }

    public int getInitialRetryDelayMinutes() {
        return initialRetryDelayMinutes;
    }

    public void setInitialRetryDelayMinutes(int initialRetryDelayMinutes) {
        this.initialRetryDelayMinutes = initialRetryDelayMinutes;
    }

    public int getMaxRetryDelayMinutes() {
        return maxRetryDelayMinutes;
    }

    public void setMaxRetryDelayMinutes(int maxRetryDelayMinutes) {
        this.maxRetryDelayMinutes = maxRetryDelayMinutes;
    }
}
