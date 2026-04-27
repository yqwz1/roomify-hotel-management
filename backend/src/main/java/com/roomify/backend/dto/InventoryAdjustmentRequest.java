package com.roomify.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.roomify.backend.entity.InventoryTransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public class InventoryAdjustmentRequest {

    @NotNull(message = "Transaction type is required")
    private InventoryTransactionType transactionType;

    @NotNull(message = "Quantity change is required")
    @DecimalMin(value = "0.001", message = "Quantity change must be greater than zero")
    @Digits(integer = 12, fraction = 3, message = "Quantity change must have up to 12 digits and 3 decimals")
    private BigDecimal quantityChange;

    private LocalDateTime occurredAt;

    @Digits(integer = 12, fraction = 4, message = "Unit cost must have up to 12 digits and 4 decimals")
    @DecimalMin(value = "0.0000", inclusive = true, message = "Unit cost cannot be negative")
    private BigDecimal unitCost;

    private boolean increaseStock;

    @Size(max = 1000, message = "Notes must be at most 1000 characters")
    private String notes;

    public InventoryTransactionType getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(InventoryTransactionType transactionType) {
        this.transactionType = transactionType;
    }

    public BigDecimal getQuantityChange() {
        return quantityChange;
    }

    public void setQuantityChange(BigDecimal quantityChange) {
        this.quantityChange = quantityChange;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(LocalDateTime occurredAt) {
        this.occurredAt = occurredAt;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(BigDecimal unitCost) {
        this.unitCost = unitCost;
    }

    public boolean isIncreaseStock() {
        return increaseStock;
    }

    public void setIncreaseStock(boolean increaseStock) {
        this.increaseStock = increaseStock;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
