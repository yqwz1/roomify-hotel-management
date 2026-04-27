package com.roomify.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ServiceUsageTemplateItemRequest {

    @NotNull(message = "Inventory item is required")
    private Long inventoryItemId;

    @NotNull(message = "Standard quantity is required")
    @DecimalMin(value = "0.001", message = "Standard quantity must be greater than zero")
    @Digits(integer = 12, fraction = 3, message = "Standard quantity must have up to 12 digits and 3 decimals")
    private BigDecimal standardQuantity;

    private boolean active = true;

    @Size(max = 500, message = "Notes must be at most 500 characters")
    private String notes;

    public Long getInventoryItemId() {
        return inventoryItemId;
    }

    public void setInventoryItemId(Long inventoryItemId) {
        this.inventoryItemId = inventoryItemId;
    }

    public BigDecimal getStandardQuantity() {
        return standardQuantity;
    }

    public void setStandardQuantity(BigDecimal standardQuantity) {
        this.standardQuantity = standardQuantity;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
