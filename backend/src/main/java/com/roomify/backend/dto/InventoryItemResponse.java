package com.roomify.backend.dto;

import com.roomify.backend.entity.InventoryCategory;
import com.roomify.backend.entity.InventoryItem;
import com.roomify.backend.entity.InventoryUnitOfMeasure;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class InventoryItemResponse {

    private final Long id;
    private final String name;
    private final InventoryCategory category;
    private final InventoryUnitOfMeasure unitOfMeasure;
    private final BigDecimal currentStockQuantity;
    private final BigDecimal minimumStockThreshold;
    private final BigDecimal defaultUnitCost;
    private final BigDecimal averageUnitCost;
    private final String supplier;
    private final String sku;
    private final boolean active;
    private final boolean lowStock;
    private final String notes;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public InventoryItemResponse(
            Long id,
            String name,
            InventoryCategory category,
            InventoryUnitOfMeasure unitOfMeasure,
            BigDecimal currentStockQuantity,
            BigDecimal minimumStockThreshold,
            BigDecimal defaultUnitCost,
            BigDecimal averageUnitCost,
            String supplier,
            String sku,
            boolean active,
            boolean lowStock,
            String notes,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.unitOfMeasure = unitOfMeasure;
        this.currentStockQuantity = currentStockQuantity;
        this.minimumStockThreshold = minimumStockThreshold;
        this.defaultUnitCost = defaultUnitCost;
        this.averageUnitCost = averageUnitCost;
        this.supplier = supplier;
        this.sku = sku;
        this.active = active;
        this.lowStock = lowStock;
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static InventoryItemResponse from(InventoryItem item) {
        boolean lowStock = item.getCurrentStockQuantity() != null
                && item.getMinimumStockThreshold() != null
                && item.getCurrentStockQuantity().compareTo(item.getMinimumStockThreshold()) <= 0;
        return new InventoryItemResponse(
                item.getId(),
                item.getName(),
                item.getCategory(),
                item.getUnitOfMeasure(),
                item.getCurrentStockQuantity(),
                item.getMinimumStockThreshold(),
                item.getDefaultUnitCost(),
                item.getAverageUnitCost(),
                item.getSupplier(),
                item.getSku(),
                item.isActive(),
                lowStock,
                item.getNotes(),
                item.getCreatedAt(),
                item.getUpdatedAt());
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public InventoryCategory getCategory() {
        return category;
    }

    public InventoryUnitOfMeasure getUnitOfMeasure() {
        return unitOfMeasure;
    }

    public BigDecimal getCurrentStockQuantity() {
        return currentStockQuantity;
    }

    public BigDecimal getMinimumStockThreshold() {
        return minimumStockThreshold;
    }

    public BigDecimal getDefaultUnitCost() {
        return defaultUnitCost;
    }

    public BigDecimal getAverageUnitCost() {
        return averageUnitCost;
    }

    public String getSupplier() {
        return supplier;
    }

    public String getSku() {
        return sku;
    }

    public boolean isActive() {
        return active;
    }

    public boolean isLowStock() {
        return lowStock;
    }

    public String getNotes() {
        return notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
