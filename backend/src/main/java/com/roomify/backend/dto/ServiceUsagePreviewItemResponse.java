package com.roomify.backend.dto;

import java.math.BigDecimal;

public class ServiceUsagePreviewItemResponse {

    private final Long inventoryItemId;
    private final String inventoryItemName;
    private final String category;
    private final String unitOfMeasure;
    private final BigDecimal standardQuantity;
    private final BigDecimal actualQuantity;
    private final BigDecimal currentStockQuantity;
    private final BigDecimal projectedStockAfter;
    private final BigDecimal unitCost;
    private final BigDecimal estimatedCost;
    private final boolean lowStockAfter;

    public ServiceUsagePreviewItemResponse(
            Long inventoryItemId,
            String inventoryItemName,
            String category,
            String unitOfMeasure,
            BigDecimal standardQuantity,
            BigDecimal actualQuantity,
            BigDecimal currentStockQuantity,
            BigDecimal projectedStockAfter,
            BigDecimal unitCost,
            BigDecimal estimatedCost,
            boolean lowStockAfter) {
        this.inventoryItemId = inventoryItemId;
        this.inventoryItemName = inventoryItemName;
        this.category = category;
        this.unitOfMeasure = unitOfMeasure;
        this.standardQuantity = standardQuantity;
        this.actualQuantity = actualQuantity;
        this.currentStockQuantity = currentStockQuantity;
        this.projectedStockAfter = projectedStockAfter;
        this.unitCost = unitCost;
        this.estimatedCost = estimatedCost;
        this.lowStockAfter = lowStockAfter;
    }

    public Long getInventoryItemId() {
        return inventoryItemId;
    }

    public String getInventoryItemName() {
        return inventoryItemName;
    }

    public String getCategory() {
        return category;
    }

    public String getUnitOfMeasure() {
        return unitOfMeasure;
    }

    public BigDecimal getStandardQuantity() {
        return standardQuantity;
    }

    public BigDecimal getActualQuantity() {
        return actualQuantity;
    }

    public BigDecimal getCurrentStockQuantity() {
        return currentStockQuantity;
    }

    public BigDecimal getProjectedStockAfter() {
        return projectedStockAfter;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public BigDecimal getEstimatedCost() {
        return estimatedCost;
    }

    public boolean isLowStockAfter() {
        return lowStockAfter;
    }
}
