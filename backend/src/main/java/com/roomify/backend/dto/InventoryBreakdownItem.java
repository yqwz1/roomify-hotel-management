package com.roomify.backend.dto;

import java.math.BigDecimal;

public class InventoryBreakdownItem {

    private final String key;
    private final String label;
    private final BigDecimal totalValue;
    private final BigDecimal totalQuantity;
    private final long recordCount;
    private final BigDecimal averageCost;

    public InventoryBreakdownItem(
            String key,
            String label,
            BigDecimal totalValue,
            BigDecimal totalQuantity,
            long recordCount,
            BigDecimal averageCost) {
        this.key = key;
        this.label = label;
        this.totalValue = totalValue;
        this.totalQuantity = totalQuantity;
        this.recordCount = recordCount;
        this.averageCost = averageCost;
    }

    public String getKey() {
        return key;
    }

    public String getLabel() {
        return label;
    }

    public BigDecimal getTotalValue() {
        return totalValue;
    }

    public BigDecimal getTotalQuantity() {
        return totalQuantity;
    }

    public long getRecordCount() {
        return recordCount;
    }

    public BigDecimal getAverageCost() {
        return averageCost;
    }
}
