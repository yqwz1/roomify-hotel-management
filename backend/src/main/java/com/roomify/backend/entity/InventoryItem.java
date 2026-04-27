package com.roomify.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_items")
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Inventory item name is required")
    @Size(max = 150, message = "Inventory item name must be at most 150 characters")
    @Column(nullable = false, length = 150)
    private String name;

    @NotNull(message = "Inventory category is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private InventoryCategory category;

    @NotNull(message = "Unit of measure is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "unit_of_measure", nullable = false, length = 30)
    private InventoryUnitOfMeasure unitOfMeasure;

    @NotNull(message = "Current stock quantity is required")
    @DecimalMin(value = "0.000", inclusive = true, message = "Current stock cannot be negative")
    @Digits(integer = 12, fraction = 3, message = "Current stock must have up to 12 digits and 3 decimals")
    @Column(name = "current_stock_quantity", nullable = false, precision = 15, scale = 3)
    private BigDecimal currentStockQuantity = BigDecimal.ZERO;

    @NotNull(message = "Minimum stock threshold is required")
    @DecimalMin(value = "0.000", inclusive = true, message = "Minimum stock threshold cannot be negative")
    @Digits(integer = 12, fraction = 3, message = "Minimum stock threshold must have up to 12 digits and 3 decimals")
    @Column(name = "minimum_stock_threshold", nullable = false, precision = 15, scale = 3)
    private BigDecimal minimumStockThreshold = BigDecimal.ZERO;

    @Digits(integer = 12, fraction = 4, message = "Default unit cost must have up to 12 digits and 4 decimals")
    @DecimalMin(value = "0.0000", inclusive = true, message = "Default unit cost cannot be negative")
    @Column(name = "default_unit_cost", precision = 16, scale = 4)
    private BigDecimal defaultUnitCost = BigDecimal.ZERO;

    @Digits(integer = 12, fraction = 4, message = "Average unit cost must have up to 12 digits and 4 decimals")
    @DecimalMin(value = "0.0000", inclusive = true, message = "Average unit cost cannot be negative")
    @Column(name = "average_unit_cost", precision = 16, scale = 4)
    private BigDecimal averageUnitCost = BigDecimal.ZERO;

    @Size(max = 150, message = "Supplier must be at most 150 characters")
    @Column(length = 150)
    private String supplier;

    @Size(max = 100, message = "SKU must be at most 100 characters")
    @Column(length = 100)
    private String sku;

    @Column(nullable = false)
    private boolean active = true;

    @Size(max = 1000, message = "Notes must be at most 1000 characters")
    @Column(length = 1000)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        currentStockQuantity = scaleQuantity(currentStockQuantity);
        minimumStockThreshold = scaleQuantity(minimumStockThreshold);
        defaultUnitCost = scaleUnitCost(defaultUnitCost);
        averageUnitCost = scaleUnitCost(averageUnitCost);
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
        currentStockQuantity = scaleQuantity(currentStockQuantity);
        minimumStockThreshold = scaleQuantity(minimumStockThreshold);
        defaultUnitCost = scaleUnitCost(defaultUnitCost);
        averageUnitCost = scaleUnitCost(averageUnitCost);
    }

    private BigDecimal scaleQuantity(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(3, RoundingMode.HALF_UP);
    }

    private BigDecimal scaleUnitCost(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(4, RoundingMode.HALF_UP);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public BigDecimal getCurrentStockQuantity() {
        return currentStockQuantity;
    }

    public void setCurrentStockQuantity(BigDecimal currentStockQuantity) {
        this.currentStockQuantity = currentStockQuantity;
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

    public BigDecimal getAverageUnitCost() {
        return averageUnitCost;
    }

    public void setAverageUnitCost(BigDecimal averageUnitCost) {
        this.averageUnitCost = averageUnitCost;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
