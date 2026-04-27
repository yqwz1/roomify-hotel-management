package com.roomify.backend.dto;

import java.math.BigDecimal;

public class ServiceUsageTemplateItemResponse {

    private final Long id;
    private final Long inventoryItemId;
    private final String inventoryItemName;
    private final String category;
    private final String unitOfMeasure;
    private final BigDecimal standardQuantity;
    private final boolean active;
    private final String notes;

    public ServiceUsageTemplateItemResponse(
            Long id,
            Long inventoryItemId,
            String inventoryItemName,
            String category,
            String unitOfMeasure,
            BigDecimal standardQuantity,
            boolean active,
            String notes) {
        this.id = id;
        this.inventoryItemId = inventoryItemId;
        this.inventoryItemName = inventoryItemName;
        this.category = category;
        this.unitOfMeasure = unitOfMeasure;
        this.standardQuantity = standardQuantity;
        this.active = active;
        this.notes = notes;
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

    public boolean isActive() {
        return active;
    }

    public String getNotes() {
        return notes;
    }
}
