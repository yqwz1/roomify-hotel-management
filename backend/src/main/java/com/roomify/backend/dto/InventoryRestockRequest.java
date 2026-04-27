package com.roomify.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.roomify.backend.entity.ExpenseCategory;
import com.roomify.backend.entity.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public class InventoryRestockRequest {

    @NotNull(message = "Restock quantity is required")
    @DecimalMin(value = "0.001", message = "Restock quantity must be greater than zero")
    @Digits(integer = 12, fraction = 3, message = "Restock quantity must have up to 12 digits and 3 decimals")
    private BigDecimal quantity;

    @NotNull(message = "Unit cost is required")
    @DecimalMin(value = "0.0001", message = "Unit cost must be greater than zero")
    @Digits(integer = 12, fraction = 4, message = "Unit cost must have up to 12 digits and 4 decimals")
    private BigDecimal unitCost;

    private LocalDateTime occurredAt;

    @Size(max = 150, message = "Supplier must be at most 150 characters")
    private String supplier;

    @Size(max = 1000, message = "Notes must be at most 1000 characters")
    private String notes;

    private boolean linkToExpense = true;

    private PaymentMethod paymentMethod;

    private ExpenseCategory expenseCategory;

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(BigDecimal unitCost) {
        this.unitCost = unitCost;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(LocalDateTime occurredAt) {
        this.occurredAt = occurredAt;
    }

    public String getSupplier() {
        return supplier;
    }

    public void setSupplier(String supplier) {
        this.supplier = supplier;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public boolean isLinkToExpense() {
        return linkToExpense;
    }

    public void setLinkToExpense(boolean linkToExpense) {
        this.linkToExpense = linkToExpense;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public ExpenseCategory getExpenseCategory() {
        return expenseCategory;
    }

    public void setExpenseCategory(ExpenseCategory expenseCategory) {
        this.expenseCategory = expenseCategory;
    }
}
