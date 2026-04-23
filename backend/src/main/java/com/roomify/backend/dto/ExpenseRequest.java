package com.roomify.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.roomify.backend.entity.ExpenseCategory;
import com.roomify.backend.entity.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ExpenseRequest {

    @NotBlank(message = "Expense title is required")
    @Size(max = 150, message = "Expense title must be at most 150 characters")
    private String title;

    @Size(max = 1000, message = "Notes must be at most 1000 characters")
    private String description;

    @NotNull(message = "Expense category is required")
    private ExpenseCategory category;

    @NotNull(message = "Expense amount is required")
    @DecimalMin(value = "0.01", message = "Expense amount must be greater than zero")
    @Digits(integer = 12, fraction = 2, message = "Expense amount must have up to 12 digits and 2 decimals")
    private BigDecimal amount;

    @NotNull(message = "Expense date is required")
    private LocalDate expenseDate;

    @Size(max = 150, message = "Vendor must be at most 150 characters")
    private String vendor;

    private PaymentMethod paymentMethod;

    private boolean recurring;

    @Size(max = 255, message = "Receipt file name must be at most 255 characters")
    private String receiptFileName;

    @Size(max = 500, message = "Receipt file URL must be at most 500 characters")
    private String receiptFileUrl;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ExpenseCategory getCategory() {
        return category;
    }

    public void setCategory(ExpenseCategory category) {
        this.category = category;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public LocalDate getExpenseDate() {
        return expenseDate;
    }

    public void setExpenseDate(LocalDate expenseDate) {
        this.expenseDate = expenseDate;
    }

    public String getVendor() {
        return vendor;
    }

    public void setVendor(String vendor) {
        this.vendor = vendor;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public boolean isRecurring() {
        return recurring;
    }

    public void setRecurring(boolean recurring) {
        this.recurring = recurring;
    }

    public String getReceiptFileName() {
        return receiptFileName;
    }

    public void setReceiptFileName(String receiptFileName) {
        this.receiptFileName = receiptFileName;
    }

    public String getReceiptFileUrl() {
        return receiptFileUrl;
    }

    public void setReceiptFileUrl(String receiptFileUrl) {
        this.receiptFileUrl = receiptFileUrl;
    }
}
