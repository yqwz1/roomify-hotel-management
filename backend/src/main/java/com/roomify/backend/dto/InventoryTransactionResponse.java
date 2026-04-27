package com.roomify.backend.dto;

import com.roomify.backend.entity.InventoryTransaction;
import com.roomify.backend.entity.InventoryTransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class InventoryTransactionResponse {

    private final Long id;
    private final Long itemId;
    private final String itemName;
    private final InventoryTransactionType transactionType;
    private final BigDecimal quantityChange;
    private final BigDecimal stockBefore;
    private final BigDecimal stockAfter;
    private final BigDecimal unitCost;
    private final BigDecimal totalValue;
    private final LocalDateTime occurredAt;
    private final String sourceReferenceType;
    private final String sourceReferenceId;
    private final String sourceReferenceLabel;
    private final String notes;
    private final Long createdByUserId;
    private final String createdByEmail;
    private final LocalDateTime createdAt;

    public InventoryTransactionResponse(
            Long id,
            Long itemId,
            String itemName,
            InventoryTransactionType transactionType,
            BigDecimal quantityChange,
            BigDecimal stockBefore,
            BigDecimal stockAfter,
            BigDecimal unitCost,
            BigDecimal totalValue,
            LocalDateTime occurredAt,
            String sourceReferenceType,
            String sourceReferenceId,
            String sourceReferenceLabel,
            String notes,
            Long createdByUserId,
            String createdByEmail,
            LocalDateTime createdAt) {
        this.id = id;
        this.itemId = itemId;
        this.itemName = itemName;
        this.transactionType = transactionType;
        this.quantityChange = quantityChange;
        this.stockBefore = stockBefore;
        this.stockAfter = stockAfter;
        this.unitCost = unitCost;
        this.totalValue = totalValue;
        this.occurredAt = occurredAt;
        this.sourceReferenceType = sourceReferenceType;
        this.sourceReferenceId = sourceReferenceId;
        this.sourceReferenceLabel = sourceReferenceLabel;
        this.notes = notes;
        this.createdByUserId = createdByUserId;
        this.createdByEmail = createdByEmail;
        this.createdAt = createdAt;
    }

    public static InventoryTransactionResponse from(InventoryTransaction transaction) {
        Long createdByUserId = transaction.getCreatedBy() != null ? transaction.getCreatedBy().getId() : null;
        String createdByEmail = transaction.getCreatedBy() != null ? transaction.getCreatedBy().getEmail() : null;
        return new InventoryTransactionResponse(
                transaction.getId(),
                transaction.getItem() != null ? transaction.getItem().getId() : null,
                transaction.getItem() != null ? transaction.getItem().getName() : null,
                transaction.getTransactionType(),
                transaction.getQuantityChange(),
                transaction.getStockBefore(),
                transaction.getStockAfter(),
                transaction.getUnitCost(),
                transaction.getTotalValue(),
                transaction.getOccurredAt(),
                transaction.getSourceReferenceType(),
                transaction.getSourceReferenceId(),
                transaction.getSourceReferenceLabel(),
                transaction.getNotes(),
                createdByUserId,
                createdByEmail,
                transaction.getCreatedAt());
    }

    public Long getId() {
        return id;
    }

    public Long getItemId() {
        return itemId;
    }

    public String getItemName() {
        return itemName;
    }

    public InventoryTransactionType getTransactionType() {
        return transactionType;
    }

    public BigDecimal getQuantityChange() {
        return quantityChange;
    }

    public BigDecimal getStockBefore() {
        return stockBefore;
    }

    public BigDecimal getStockAfter() {
        return stockAfter;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public BigDecimal getTotalValue() {
        return totalValue;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public String getSourceReferenceType() {
        return sourceReferenceType;
    }

    public String getSourceReferenceId() {
        return sourceReferenceId;
    }

    public String getSourceReferenceLabel() {
        return sourceReferenceLabel;
    }

    public String getNotes() {
        return notes;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public String getCreatedByEmail() {
        return createdByEmail;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
