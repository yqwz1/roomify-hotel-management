package com.roomify.backend.entity;

import com.roomify.backend.dto.EmailDeliveryStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class EmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String recipient;

    private String subject;

    @Enumerated(EnumType.STRING)
    private EmailDeliveryStatus status;

    private String errorMessage;

    private String confirmationNumber;

    private LocalDateTime createdAt;

    public EmailLog() {
    }

    public EmailLog(String recipient,
            String subject,
            EmailDeliveryStatus status,
            String errorMessage,
            String confirmationNumber) {

        this.recipient = recipient;
        this.subject = subject;
        this.status = status;
        this.errorMessage = errorMessage;
        this.confirmationNumber = confirmationNumber;
        this.createdAt = LocalDateTime.now();
    }

    // getters setters

    public Long getId() {
        return id;
    }

    public String getRecipient() {
        return recipient;
    }

    public String getSubject() {
        return subject;
    }

    public EmailDeliveryStatus getStatus() {
        return status;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public String getConfirmationNumber() {
        return confirmationNumber;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setRecipient(String recipient) {
        this.recipient = recipient;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public void setStatus(EmailDeliveryStatus status) {
        this.status = status;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public void setConfirmationNumber(String confirmationNumber) {
        this.confirmationNumber = confirmationNumber;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}