package com.roomify.backend.dto;

import com.roomify.backend.entity.ServiceUsageRecordItem;

import java.math.BigDecimal;

public class ServiceUsageRecordItemResponse {

    private final Long id;
    private final Long inventoryItemId;
    private final String inventoryItemName;
    private final String category;
    private final String unitOfMeasure;
    private final BigDecimal standardQuantity;
    private final BigDecimal actualQuantity;
    private final BigDecimal unitCost;
    private final BigDecimal totalCost;
    private final String notes;

    public ServiceUsageRecordItemResponse(
            Long id,
            Long inventoryItemId,
            String inventoryItemName,
            String category,
            String unitOfMeasure,
            BigDecimal standardQuantity,
            BigDecimal actualQuantity,
            BigDecimal unitCost,
            BigDecimal totalCost,
            String notes) {
        this.id = id;
        this.inventoryItemId = inventoryItemId;
        this.inventoryItemName = inventoryItemName;
        this.category = category;
        this.unitOfMeasure = unitOfMeasure;
        this.standardQuantity = standardQuantity;
        this.actualQuantity = actualQuantity;
        this.unitCost = unitCost;
        this.totalCost = totalCost;
        this.notes = notes;
    }

    public static ServiceUsageRecordItemResponse from(ServiceUsageRecordItem item) {
        return new ServiceUsageRecordItemResponse(
                item.getId(),
                item.getInventoryItem().getId(),
                item.getInventoryItem().getName(),
                item.getInventoryItem().getCategory().name(),
                item.getInventoryItem().getUnitOfMeasure().name(),
                item.getStandardQuantity(),
                item.getActualQuantity(),
                item.getUnitCost(),
                item.getTotalCost(),
                item.getNotes());
    }

    public Long getId() {
        return id;
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

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public String getNotes() {
        return notes;
    }
}
