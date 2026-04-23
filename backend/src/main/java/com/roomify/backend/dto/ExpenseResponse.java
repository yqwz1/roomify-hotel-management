package com.roomify.backend.dto;

import com.roomify.backend.entity.Expense;
import com.roomify.backend.entity.ExpenseCategory;
import com.roomify.backend.entity.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ExpenseResponse {

    private final Long id;
    private final String title;
    private final String description;
    private final ExpenseCategory category;
    private final BigDecimal amount;
    private final LocalDate expenseDate;
    private final String vendor;
    private final PaymentMethod paymentMethod;
    private final boolean recurring;
    private final String receiptFileName;
    private final String receiptFileUrl;
    private final Long createdByUserId;
    private final String createdByEmail;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public ExpenseResponse(
            Long id,
            String title,
            String description,
            ExpenseCategory category,
            BigDecimal amount,
            LocalDate expenseDate,
            String vendor,
            PaymentMethod paymentMethod,
            boolean recurring,
            String receiptFileName,
            String receiptFileUrl,
            Long createdByUserId,
            String createdByEmail,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.amount = amount;
        this.expenseDate = expenseDate;
        this.vendor = vendor;
        this.paymentMethod = paymentMethod;
        this.recurring = recurring;
        this.receiptFileName = receiptFileName;
        this.receiptFileUrl = receiptFileUrl;
        this.createdByUserId = createdByUserId;
        this.createdByEmail = createdByEmail;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static ExpenseResponse from(Expense expense) {
        Long createdByUserId = expense.getCreatedBy() != null ? expense.getCreatedBy().getId() : null;
        String createdByEmail = expense.getCreatedBy() != null ? expense.getCreatedBy().getEmail() : null;

        return new ExpenseResponse(
                expense.getId(),
                expense.getTitle(),
                expense.getDescription(),
                expense.getCategory(),
                expense.getAmount(),
                expense.getExpenseDate(),
                expense.getVendor(),
                expense.getPaymentMethod(),
                expense.isRecurring(),
                expense.getReceiptFileName(),
                expense.getReceiptFileUrl(),
                createdByUserId,
                createdByEmail,
                expense.getCreatedAt(),
                expense.getUpdatedAt());
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public ExpenseCategory getCategory() {
        return category;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public LocalDate getExpenseDate() {
        return expenseDate;
    }

    public String getVendor() {
        return vendor;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public boolean isRecurring() {
        return recurring;
    }

    public String getReceiptFileName() {
        return receiptFileName;
    }

    public String getReceiptFileUrl() {
        return receiptFileUrl;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public String getCreatedByEmail() {
        return createdByEmail;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
