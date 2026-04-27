package com.roomify.backend.entity;

import com.roomify.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_transactions")
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Inventory item is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem item;

    @NotNull(message = "Transaction type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 40)
    private InventoryTransactionType transactionType;

    @NotNull(message = "Quantity change is required")
    @Digits(integer = 12, fraction = 3, message = "Quantity change must have up to 12 digits and 3 decimals")
    @Column(name = "quantity_change", nullable = false, precision = 15, scale = 3)
    private BigDecimal quantityChange;

    @Digits(integer = 12, fraction = 3, message = "Stock before must have up to 12 digits and 3 decimals")
    @Column(name = "stock_before", precision = 15, scale = 3)
    private BigDecimal stockBefore;

    @Digits(integer = 12, fraction = 3, message = "Stock after must have up to 12 digits and 3 decimals")
    @Column(name = "stock_after", precision = 15, scale = 3)
    private BigDecimal stockAfter;

    @Digits(integer = 12, fraction = 4, message = "Unit cost must have up to 12 digits and 4 decimals")
    @Column(name = "unit_cost", precision = 16, scale = 4)
    private BigDecimal unitCost;

    @Digits(integer = 12, fraction = 2, message = "Total value must have up to 12 digits and 2 decimals")
    @Column(name = "total_value", precision = 16, scale = 2)
    private BigDecimal totalValue;

    @NotNull(message = "Occurred at is required")
    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    @Size(max = 80, message = "Source reference type must be at most 80 characters")
    @Column(name = "source_reference_type", length = 80)
    private String sourceReferenceType;

    @Size(max = 120, message = "Source reference id must be at most 120 characters")
    @Column(name = "source_reference_id", length = 120)
    private String sourceReferenceId;

    @Size(max = 255, message = "Source reference label must be at most 255 characters")
    @Column(name = "source_reference_label", length = 255)
    private String sourceReferenceLabel;

    @Size(max = 1000, message = "Notes must be at most 1000 characters")
    @Column(length = 1000)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (occurredAt == null) {
            occurredAt = createdAt;
        }
        quantityChange = scaleQuantity(quantityChange);
        stockBefore = stockBefore == null ? null : scaleQuantity(stockBefore);
        stockAfter = stockAfter == null ? null : scaleQuantity(stockAfter);
        unitCost = unitCost == null ? null : unitCost.setScale(4, RoundingMode.HALF_UP);
        totalValue = totalValue == null ? null : totalValue.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal scaleQuantity(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(3, RoundingMode.HALF_UP);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public InventoryItem getItem() {
        return item;
    }

    public void setItem(InventoryItem item) {
        this.item = item;
    }

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

    public BigDecimal getStockBefore() {
        return stockBefore;
    }

    public void setStockBefore(BigDecimal stockBefore) {
        this.stockBefore = stockBefore;
    }

    public BigDecimal getStockAfter() {
        return stockAfter;
    }

    public void setStockAfter(BigDecimal stockAfter) {
        this.stockAfter = stockAfter;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(BigDecimal unitCost) {
        this.unitCost = unitCost;
    }

    public BigDecimal getTotalValue() {
        return totalValue;
    }

    public void setTotalValue(BigDecimal totalValue) {
        this.totalValue = totalValue;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(LocalDateTime occurredAt) {
        this.occurredAt = occurredAt;
    }

    public String getSourceReferenceType() {
        return sourceReferenceType;
    }

    public void setSourceReferenceType(String sourceReferenceType) {
        this.sourceReferenceType = sourceReferenceType;
    }

    public String getSourceReferenceId() {
        return sourceReferenceId;
    }

    public void setSourceReferenceId(String sourceReferenceId) {
        this.sourceReferenceId = sourceReferenceId;
    }

    public String getSourceReferenceLabel() {
        return sourceReferenceLabel;
    }

    public void setSourceReferenceLabel(String sourceReferenceLabel) {
        this.sourceReferenceLabel = sourceReferenceLabel;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
