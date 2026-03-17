package com.roomify.backend.entity;

import com.roomify.backend.dto.InvoiceDeliveryStatus;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class InvoiceDeliveryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String recipient;

    private String subject;

    private String confirmationNumber;

    @Enumerated(EnumType.STRING)
    private InvoiceDeliveryStatus status;

    private String errorMessage;

    private LocalDateTime createdAt;

    public InvoiceDeliveryLog() {
    }

    public InvoiceDeliveryLog(
            String recipient,
            String subject,
            String confirmationNumber,
            InvoiceDeliveryStatus status,
            String errorMessage) {

        this.recipient = recipient;
        this.subject = subject;
        this.confirmationNumber = confirmationNumber;
        this.status = status;
        this.errorMessage = errorMessage;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getRecipient() {
        return recipient;
    }

    public String getSubject() {
        return subject;
    }

    public String getConfirmationNumber() {
        return confirmationNumber;
    }

    public InvoiceDeliveryStatus getStatus() {
        return status;
    }

    public String getErrorMessage() {
        return errorMessage;
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

    public void setConfirmationNumber(String confirmationNumber) {
        this.confirmationNumber = confirmationNumber;
    }

    public void setStatus(InvoiceDeliveryStatus status) {
        this.status = status;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}