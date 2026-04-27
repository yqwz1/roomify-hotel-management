package com.roomify.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_usage_record_items")
public class ServiceUsageRecordItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Usage record is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usage_record_id", nullable = false)
    private ServiceUsageRecord usageRecord;

    @NotNull(message = "Inventory item is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem inventoryItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_item_id")
    private ServiceUsageTemplateItem templateItem;

    @Digits(integer = 12, fraction = 3, message = "Standard quantity must have up to 12 digits and 3 decimals")
    @Column(name = "standard_quantity", precision = 15, scale = 3)
    private BigDecimal standardQuantity;

    @NotNull(message = "Actual quantity is required")
    @DecimalMin(value = "0.001", message = "Actual quantity must be greater than zero")
    @Digits(integer = 12, fraction = 3, message = "Actual quantity must have up to 12 digits and 3 decimals")
    @Column(name = "actual_quantity", nullable = false, precision = 15, scale = 3)
    private BigDecimal actualQuantity;

    @Digits(integer = 12, fraction = 4, message = "Unit cost must have up to 12 digits and 4 decimals")
    @Column(name = "unit_cost", nullable = false, precision = 16, scale = 4)
    private BigDecimal unitCost;

    @Digits(integer = 12, fraction = 2, message = "Total cost must have up to 12 digits and 2 decimals")
    @Column(name = "total_cost", nullable = false, precision = 16, scale = 2)
    private BigDecimal totalCost;

    @Size(max = 500, message = "Notes must be at most 500 characters")
    @Column(length = 500)
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
        standardQuantity = standardQuantity == null ? null : standardQuantity.setScale(3, RoundingMode.HALF_UP);
        actualQuantity = actualQuantity == null ? null : actualQuantity.setScale(3, RoundingMode.HALF_UP);
        unitCost = unitCost == null ? BigDecimal.ZERO : unitCost.setScale(4, RoundingMode.HALF_UP);
        totalCost = totalCost == null ? BigDecimal.ZERO : totalCost.setScale(2, RoundingMode.HALF_UP);
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
        standardQuantity = standardQuantity == null ? null : standardQuantity.setScale(3, RoundingMode.HALF_UP);
        actualQuantity = actualQuantity == null ? null : actualQuantity.setScale(3, RoundingMode.HALF_UP);
        unitCost = unitCost == null ? BigDecimal.ZERO : unitCost.setScale(4, RoundingMode.HALF_UP);
        totalCost = totalCost == null ? BigDecimal.ZERO : totalCost.setScale(2, RoundingMode.HALF_UP);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ServiceUsageRecord getUsageRecord() {
        return usageRecord;
    }

    public void setUsageRecord(ServiceUsageRecord usageRecord) {
        this.usageRecord = usageRecord;
    }

    public InventoryItem getInventoryItem() {
        return inventoryItem;
    }

    public void setInventoryItem(InventoryItem inventoryItem) {
        this.inventoryItem = inventoryItem;
    }

    public ServiceUsageTemplateItem getTemplateItem() {
        return templateItem;
    }

    public void setTemplateItem(ServiceUsageTemplateItem templateItem) {
        this.templateItem = templateItem;
    }

    public BigDecimal getStandardQuantity() {
        return standardQuantity;
    }

    public void setStandardQuantity(BigDecimal standardQuantity) {
        this.standardQuantity = standardQuantity;
    }

    public BigDecimal getActualQuantity() {
        return actualQuantity;
    }

    public void setActualQuantity(BigDecimal actualQuantity) {
        this.actualQuantity = actualQuantity;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(BigDecimal unitCost) {
        this.unitCost = unitCost;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
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
