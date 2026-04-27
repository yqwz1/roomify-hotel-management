package com.roomify.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.roomify.backend.entity.InventoryCategory;
import com.roomify.backend.entity.InventoryUnitOfMeasure;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public class InventoryItemRequest {

    @NotBlank(message = "Inventory item name is required")
    @Size(max = 150, message = "Inventory item name must be at most 150 characters")
    private String name;

    @NotNull(message = "Inventory category is required")
    private InventoryCategory category;

    @NotNull(message = "Unit of measure is required")
    private InventoryUnitOfMeasure unitOfMeasure;

    @NotNull(message = "Minimum stock threshold is required")
    @DecimalMin(value = "0.000", inclusive = true, message = "Minimum stock threshold cannot be negative")
    @Digits(integer = 12, fraction = 3, message = "Minimum stock threshold must have up to 12 digits and 3 decimals")
    private BigDecimal minimumStockThreshold;

    @DecimalMin(value = "0.0000", inclusive = true, message = "Default unit cost cannot be negative")
    @Digits(integer = 12, fraction = 4, message = "Default unit cost must have up to 12 digits and 4 decimals")
    private BigDecimal defaultUnitCost;

    @DecimalMin(value = "0.000", inclusive = true, message = "Initial stock quantity cannot be negative")
    @Digits(integer = 12, fraction = 3, message = "Initial stock quantity must have up to 12 digits and 3 decimals")
    private BigDecimal initialStockQuantity;

    @Size(max = 150, message = "Supplier must be at most 150 characters")
    private String supplier;

    @Size(max = 100, message = "SKU must be at most 100 characters")
    private String sku;

    private boolean active = true;

    @Size(max = 1000, message = "Notes must be at most 1000 characters")
    private String notes;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public InventoryCategory getCategory() {
        return category;
    }

    public void setCategory(InventoryCategory category) {
        this.category = category;
    }

    public InventoryUnitOfMeasure getUnitOfMeasure() {
        return unitOfMeasure;
    }

    public void setUnitOfMeasure(InventoryUnitOfMeasure unitOfMeasure) {
        this.unitOfMeasure = unitOfMeasure;
    }

    public BigDecimal getMinimumStockThreshold() {
        return minimumStockThreshold;
    }

    public void setMinimumStockThreshold(BigDecimal minimumStockThreshold) {
        this.minimumStockThreshold = minimumStockThreshold;
    }

    public BigDecimal getDefaultUnitCost() {
        return defaultUnitCost;
    }

    public void setDefaultUnitCost(BigDecimal defaultUnitCost) {
        this.defaultUnitCost = defaultUnitCost;
    }

    public BigDecimal getInitialStockQuantity() {
        return initialStockQuantity;
    }

    public void setInitialStockQuantity(BigDecimal initialStockQuantity) {
        this.initialStockQuantity = initialStockQuantity;
    }

    public String getSupplier() {
        return supplier;
    }

    public void setSupplier(String supplier) {
        this.supplier = supplier;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
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
